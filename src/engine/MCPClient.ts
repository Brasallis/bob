import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPManager {
    private client: Client;
    private transport: StdioClientTransport | null = null;
    public ollamaTools: any[] = [];

    constructor() {
        this.client = new Client(
            { name: "Bob", version: "1.0.0" },
            { capabilities: {} }
        );
    }

    async connectFileSystem(allowedDir: string) {
        this.transport = new StdioClientTransport({
            command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
            args: ["-y", "@modelcontextprotocol/server-filesystem", allowedDir],
        });

        await this.client.connect(this.transport);
        
        const toolsResponse = await this.client.listTools();
        
        // Converte as ferramentas do formato MCP para o formato nativo suportado por Ollama/OpenAI
        this.ollamaTools = toolsResponse.tools.map((t: any) => ({
            type: "function",
            function: {
                name: t.name,
                description: t.description,
                parameters: t.inputSchema
            }
        }));
    }

    async callTool(name: string, args: any): Promise<string> {
        try {
            const result = await this.client.callTool({
                name,
                arguments: args
            });
            
            // O MCP retorna um array de "content", vamos extrair o texto
            const content = result.content as any[];
            return content.map((c: any) => c.text || JSON.stringify(c)).join('\n');
        } catch (e: any) {
            return `Erro ao executar ferramenta ${name}: ${e.message}`;
        }
    }

    async disconnect() {
        if (this.transport) {
            await this.transport.close();
        }
    }
}
