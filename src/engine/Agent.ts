import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

export interface AgentConfig {
    name: string;
    systemPrompt: string;
    model?: string;
}

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;

export class Agent {
    public name: string;
    public systemPrompt: string;
    public model: string;
    protected memory: { role: string, content: string }[] = [];

    constructor(config: AgentConfig) {
        this.name = config.name;
        this.systemPrompt = config.systemPrompt;
        this.model = config.model || process.env.OLLAMA_MODEL || 'gemma:2b';
        
        // Inicializa a memória com o system prompt
        this.memory.push({ role: 'system', content: this.systemPrompt });
    }

    run(task: string, onChunk?: (text: string) => void): Promise<{text: string, usage?: any, model: string}> {
        return new Promise((resolve) => {
            this.memory.push({ role: 'user', content: task });

            const data = JSON.stringify({
                model: this.model,
                messages: this.memory,
                stream: true
            });

            const req = http.request({
                hostname: OLLAMA_HOST,
                port: OLLAMA_PORT,
                path: '/api/chat',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res) => {
                if (res.statusCode !== 200) {
                    let errorBody = '';
                    res.on('data', chunk => { errorBody += chunk.toString(); });
                    res.on('end', () => {
                        console.error(`\n[${this.name}] Ollama retornou erro HTTP ${res.statusCode}: ${errorBody}`);
                        resolve({ text: "Erro interno do Ollama (veja o terminal).", model: this.model });
                    });
                    return;
                }

                let fullReply = '';
                let finalUsage: any = undefined;

                res.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const parsed = JSON.parse(line);
                            
                            if (parsed.message?.content) {
                                fullReply += parsed.message.content;
                                if (onChunk) onChunk(parsed.message.content);
                            }

                            if (parsed.done) {
                                finalUsage = {
                                    prompt_tokens: parsed.prompt_eval_count || 0,
                                    completion_tokens: parsed.eval_count || 0
                                };
                            }
                        } catch (e) {
                            // ignora erros de parse parcial
                        }
                    }
                });

                res.on('end', () => {
                    if (!fullReply) {
                        fullReply = "Sem resposta gerada.";
                    }
                    this.memory.push({ role: 'assistant', content: fullReply });
                    resolve({
                        text: fullReply,
                        usage: finalUsage,
                        model: this.model
                    });
                });
            });

            req.on('error', (error: any) => {
                console.error(`\n[${this.name}] Erro crítico de conexão com o motor local: ${error.message}`);
                resolve({ text: "O motor Ollama falhou ou perdeu conexão.", model: this.model });
            });

            req.write(data);
            req.end();
        });
    }
}
