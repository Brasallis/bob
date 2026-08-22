import { OpenAI } from 'openai';
import dotenv from 'dotenv';
// Em breve, importaremos as ferramentas MCP e orquestração do Agente
// import { Client } from '@modelcontextprotocol/sdk/client/index.js';

dotenv.config();

// Configuração do cliente compatível com OpenAI apontando para o Ollama local
const openai = new OpenAI({
    baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1',
    apiKey: process.env.OLLAMA_API_KEY || 'ollama', // API Key não é exigida pelo Ollama, mas a SDK do OpenAI pede algo
});

async function main() {
    console.log("Iniciando o agente Hermess...");

    try {
        // Exemplo simples de chamada para o modelo local
        console.log("Testando conexão com o modelo local...");
        const response = await openai.chat.completions.create({
            model: process.env.OLLAMA_MODEL || 'llama3', // Substitua pelo modelo que você baixou no Ollama
            messages: [{ role: 'user', content: 'Olá! Você é o agente Hermess?' }],
        });

        console.log("Resposta do Hermess:");
        console.log(response.choices[0]?.message?.content || "Sem resposta");
        
        console.log("\nO sistema MCP será inicializado aqui em futuras iterações.");
    } catch (error) {
        console.error("Erro ao conectar com o modelo local:", error);
        console.log("\nCertifique-se de que o Ollama está rodando e o modelo correto está baixado.");
    }
}

main();
