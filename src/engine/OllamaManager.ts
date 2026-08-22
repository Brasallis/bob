import { spawn } from 'child_process';
import chalk from 'chalk';

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

export class OllamaManager {
    /**
     * Verifica se o Ollama está rodando localmente
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
