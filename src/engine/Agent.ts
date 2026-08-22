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
        this.model = config.model || process.env.OLLAMA_MODEL || 'llama3';
        
        this.client = new OpenAI({
            baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1',
            apiKey: process.env.OLLAMA_API_KEY || 'ollama',
        });

        // Inicializa a memória com o system prompt
        this.memory.push({ role: 'system', content: this.systemPrompt });
    }

    async run(task: string): Promise<string> {
        this.memory.push({ role: 'user', content: task });
        
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: this.memory,
            });

            const reply = response.choices[0]?.message?.content || "Sem resposta gerada.";
            this.memory.push({ role: 'assistant', content: reply });
            return reply;
        } catch (error: any) {
            console.error(`[${this.name}] Erro ao comunicar com o modelo local (${this.model}): ${error.message}`);
            return "Erro ao processar a tarefa.";
        }
    }
}
