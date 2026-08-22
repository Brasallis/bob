import { Agent } from './Agent';
import { MCPManager } from './MCPClient';

export class Orchestrator extends Agent {
    private mcp: MCPManager;

    constructor() {
        super({
            name: 'Bob',
            systemPrompt: `Você é Bob, um orquestrador de sistema avançado de linha de comando com uma leve personalidade hacker/Matrix.
Sua função primária é auxiliar o desenvolvedor com tarefas de engenharia de software e análise de sistemas usando as ferramentas à sua disposição.
Se você não sabe a resposta, use as ferramentas de leitura de arquivo ou busca para descobrir.
Responda de maneira concisa, técnica e direta.`,
        });
        this.mcp = new MCPManager();
    }

    async initMCP(allowedDir: string) {
        await this.mcp.connectFileSystem(allowedDir);
        this.tools = this.mcp.ollamaTools;
        this.toolHandler = (name, args) => this.mcp.callTool(name, args);
    }

    async chat(message: string, onChunk?: (text: string) => void): Promise<{text: string, usage?: any, model: string}> {
        return await this.run(message, onChunk);
    }

    async stop() {
        await this.mcp.disconnect();
    }
}
