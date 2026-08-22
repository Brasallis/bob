import { spawn, execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

export class OllamaManager {
    /**
     * Verifica se o Ollama está rodando localmente respondendo na API
     */
    static async ping(): Promise<boolean> {
        try {
            const response = await fetch(`${OLLAMA_URL}/api/version`);
            if (response.ok) {
                return true;
            }
            return false;
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
            // Usamos detached para que o processo do Ollama continue mesmo se o CLI fechar
            const ollamaProcess = spawn('ollama', ['serve'], {
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            
            ollamaProcess.unref();

            // Aguarda alguns segundos para o serviço subir
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
     * Baixa e instala o Ollama no Windows (Nível Google: zero atrito)
     */
    static async installOllamaWindows(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(chalk.yellow('\n>>> Ollama não encontrado. Baixando o instalador oficial...'));
            
            const installerPath = path.join(os.tmpdir(), 'OllamaSetup.exe');
            
            // Usamos powershell para baixar o arquivo para não precisar de bibliotecas extras
            const downloadCommand = `powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '${installerPath}'"`;
            
            try {
                execSync(downloadCommand, { stdio: 'inherit' });
                console.log(chalk.green('>>> Download concluído. Iniciando instalação...'));
                
                // Roda o instalador. O usuário terá que passar pelas telas, mas já agilizamos tudo.
                const installProcess = spawn(installerPath, [], { stdio: 'inherit', shell: true });
                
                installProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log(chalk.green('>>> Instalação do Ollama concluída!'));
                        resolve();
                    } else {
                        reject(new Error(`O instalador falhou com código ${code}`));
                    }
                });
            } catch (error: any) {
                reject(new Error(`Falha ao baixar ou instalar o Ollama: ${error.message}`));
            }
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
     * Inicia o download de um modelo usando o binário local do Ollama para herdar a barra de progresso nativa.
     */
    static pullModel(modelName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(chalk.yellow(`\n>>> Iniciando download automático do modelo: ${modelName}`));
            console.log(chalk.gray(`>>> Isso pode demorar dependendo da sua conexão...`));
            
            const pullProcess = spawn('ollama', ['pull', modelName], {
                stdio: 'inherit', // Isso joga a barra de progresso nativa do Ollama no terminal do Bob
                shell: true
            });

            pullProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green(`\n>>> Download do ${modelName} concluído com sucesso!`));
                    resolve();
                } else {
                    reject(new Error(`O comando 'ollama pull' falhou com código ${code}`));
                }
            });
            
            pullProcess.on('error', (err) => {
                reject(err);
            });
        });
    }
}
