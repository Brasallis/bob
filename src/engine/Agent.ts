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
    protected memory: any[] = [];
    
    // Ferramentas MCP injetadas
    public tools: any[] = [];
    public toolHandler?: (name: string, args: any) => Promise<string>;

    constructor(config: AgentConfig) {
        this.name = config.name;
        this.systemPrompt = config.systemPrompt;
        this.model = config.model || process.env.OLLAMA_MODEL || 'gemma:2b';
        
        // Inicializa a memória com o system prompt
        this.memory.push({ role: 'system', content: this.systemPrompt });
    }

    async run(task: string, onChunk?: (text: string) => void): Promise<{text: string, usage?: any, model: string}> {
        if (task) {
            this.memory.push({ role: 'user', content: task });
        }
        
        return this.executeTurn(onChunk);
    }

    private executeTurn(onChunk?: (text: string) => void): Promise<{text: string, usage?: any, model: string}> {
        return new Promise((resolve) => {
            const payload: any = {
                model: this.model,
                messages: this.memory,
                stream: true
            };

            if (this.tools && this.tools.length > 0) {
                payload.tools = this.tools;
            }

            const data = JSON.stringify(payload);

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
                let pendingToolCalls: any[] = [];

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

                            if (parsed.message?.tool_calls) {
                                pendingToolCalls = parsed.message.tool_calls;
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

                res.on('end', async () => {
                    // Se o modelo decidiu chamar uma ferramenta
                    if (pendingToolCalls.length > 0 && this.toolHandler) {
                        // Adiciona a intenção da chamada de ferramenta na memória para o modelo saber que ele pediu
                        this.memory.push({ 
                            role: 'assistant', 
                            content: fullReply, 
                            tool_calls: pendingToolCalls 
                        });

                        // Executa as ferramentas (simples sequencial por enquanto)
                        for (const call of pendingToolCalls) {
                            const func = call.function;
                            if (onChunk) onChunk(`\n[Executando ferramenta: ${func.name}...]\n`);
                            
                            const result = await this.toolHandler(func.name, func.arguments);
                            
                            // Injeta o resultado
                            this.memory.push({
                                role: 'tool',
                                content: result
                            });
                        }

                        // Recursão: Pede pro modelo pensar de novo agora que ele tem os resultados da ferramenta
                        const nextTurn = await this.executeTurn(onChunk);
                        resolve(nextTurn);
                        return;
                    }

                    if (!fullReply && pendingToolCalls.length === 0) {
                        fullReply = "Sem resposta gerada.";
                    }

                    if (fullReply) {
                        this.memory.push({ role: 'assistant', content: fullReply });
                    }
                    
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
