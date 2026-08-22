import { spawn, execSync } from 'child_process';
import chalk from 'chalk';
import http from 'http';
import readline from 'readline';

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const OLLAMA_URL = process.env.OLLAMA_API_URL || `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

export class OllamaManager {
    /**
     * Verifica se o Ollama está rodando localmente respondendo na API
     */
    static async ping(): Promise<boolean> {
        try {
            const response = await fetch(`${OLLAMA_URL}/api/version`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verifica se o binário do Ollama está instalado no sistema
     */
    static isInstalled(): boolean {
        try {
            execSync('ollama -v', { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Tenta iniciar o Ollama em background
     */
    static startOllama(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(chalk.gray('>>> Tentando iniciar o serviço do Ollama em background...'));
            const ollamaProcess = spawn('ollama', ['serve'], {
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            
            ollamaProcess.unref();

            setTimeout(async () => {
                const isRunning = await this.ping();
                if (isRunning) {
                    resolve();
                } else {
                    reject(new Error("O serviço do Ollama não respondeu após iniciar."));
                }
            }, 3000);
        });
    }

    /**
     * Verifica se um modelo específico está instalado
     */
    static async hasModel(modelName: string): Promise<boolean> {
        try {
            const response = await fetch(`${OLLAMA_URL}/api/tags`);
            if (!response.ok) return false;
            
            const data = await response.json();
            return data.models.some((m: any) => m.name === modelName || m.name === `${modelName}:latest`);
        } catch (error) {
            return false;
        }
    }

    /**
     * Auxiliar para desenhar a barra de progresso no terminal
     */
    private static drawProgressBar(modelName: string, completed: number, total: number, status: string) {
        const width = 30;
        const percent = total > 0 ? (completed / total) : 0;
        const filled = Math.round(width * percent);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const percentText = (percent * 100).toFixed(1).padStart(5, ' ');
        
        // Conversão simples para GB
        const completedGB = (completed / 1024 / 1024 / 1024).toFixed(2);
        const totalGB = (total / 1024 / 1024 / 1024).toFixed(2);
        const sizeText = total > 0 ? `${completedGB}GB / ${totalGB}GB` : '';

        // Limpa a linha atual e escreve por cima
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        
        process.stdout.write(
            chalk.greenBright(`[Bob] `) + 
            chalk.green(`Baixando ${modelName}: [${bar}] ${percentText}% ${sizeText ? `- ${sizeText}` : ''} | ${status}`)
        );
    }

    /**
     * Inicia o download de um modelo usando a API via HTTP nativo para criar uma Progress Bar Google-Level.
     */
    static pullModel(modelName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(chalk.greenBright(`\n>>> Bob está solicitando o modelo ${modelName}...`));
            
            const data = JSON.stringify({ name: modelName });
            
            const req = http.request({
                hostname: OLLAMA_HOST,
                port: OLLAMA_PORT,
                path: '/api/pull',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Ollama retornou erro: ${res.statusCode}`));
                    return;
                }

                res.on('data', (chunk) => {
                    // A API do Ollama manda chunks de JSON separados por quebra de linha.
                    const lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.status === 'success') {
                                // Apaga a barra e mostra sucesso final
                                readline.clearLine(process.stdout, 0);
                                readline.cursorTo(process.stdout, 0);
                                console.log(chalk.greenBright(`\n>>> Download e verificação do modelo ${modelName} concluídos com sucesso!`));
                                resolve();
                                return;
                            }
                            
                            // Se tiver progresso, desenha a barra
                            if (parsed.completed !== undefined && parsed.total !== undefined) {
                                this.drawProgressBar(modelName, parsed.completed, parsed.total, parsed.status);
                            } else {
                                // Mensagens de status (ex: "pulling manifest") sem bytes
                                readline.clearLine(process.stdout, 0);
                                readline.cursorTo(process.stdout, 0);
                                process.stdout.write(
                                    chalk.greenBright(`[Bob] `) + chalk.green(`Baixando ${modelName}: ${parsed.status}`)
                                );
                            }
                        } catch (e) {
                            // ignora erros de parse caso o chunk quebre o json
                        }
                    }
                });

                res.on('end', () => {
                    // Se fechar e não tiver mandado success, a gente ignora ou resolve
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            req.write(data);
            req.end();
        });
    }
}
