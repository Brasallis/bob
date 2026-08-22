import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export interface AgentConfig {
    name: string;
    systemPrompt: string;
    model?: string;
}

export class Agent {
    public name: string;
    public systemPrompt: string;
    public model: string;
    protected client: OpenAI;
    protected memory: any[] = [];

    constructor(config: AgentConfig) {
        this.name = config.name;
        this.systemPrompt = config.systemPrompt;
        this.model = config.model || process.env.OLLAMA_MODEL || 'gemma:2b';
        
        this.client = new OpenAI({
            baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1',
            apiKey: process.env.OLLAMA_API_KEY || 'ollama',
        });

        // Inicializa a memória com o system prompt
        this.memory.push({ role: 'system', content: this.systemPrompt });
    }

    async run(task: string, onChunk?: (text: string) => void): Promise<{text: string, usage?: any, model: string}> {
        this.memory.push({ role: 'user', content: task });
        
        try {
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages: this.memory,
                stream: true,
                stream_options: { include_usage: true }
            });

            let fullReply = '';
            let finalUsage: any = undefined;
            let finalModel = this.model;

            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || "";
                if (text) {
                    fullReply += text;
                    if (onChunk) onChunk(text);
                }
                
                if (chunk.usage) {
                    finalUsage = chunk.usage;
                }
                
                if (chunk.model) {
                    finalModel = chunk.model;
                }
            }

            if (!fullReply) {
                fullReply = "Sem resposta gerada.";
            }

            this.memory.push({ role: 'assistant', content: fullReply });
            return {
                text: fullReply,
                usage: finalUsage,
                model: finalModel
            };
        } catch (error: any) {
            console.error(`\n[${this.name}] Erro ao comunicar com o modelo local (${this.model}): ${error.message}`);
            return {
                text: "Erro ao processar a tarefa.",
                model: this.model
            };
        }
    }
}
