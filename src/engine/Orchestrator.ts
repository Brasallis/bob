import { Agent } from './Agent';

export class Orchestrator extends Agent {
    constructor() {
        super({
            name: 'Bob',
            systemPrompt: `Você é Bob, um orquestrador de sistema avançado de linha de comando com uma leve personalidade hacker/Matrix.
Sua função primária é auxiliar o desenvolvedor com tarefas de engenharia de software e análise de sistemas.
Responda de maneira concisa, técnica e direta.`,
        });
    }

    async chat(message: string): Promise<string> {
        return await this.run(message);
    }
}
