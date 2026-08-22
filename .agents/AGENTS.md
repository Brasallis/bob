# Hermess - Agente Pessoal e Automação

Este projeto ("Hermess") é um agente pessoal baseado em Node.js e TypeScript, configurado para trabalhar com modelos de IA locais (via Ollama) e para se conectar a várias plataformas e ferramentas através do Model Context Protocol (MCP).

## Tecnologias
- **Node.js / TypeScript**: Base do agente.
- **Ollama**: Provedor de modelos locais. A API compatível com OpenAI é utilizada.
- **MCP (Model Context Protocol)**: Usado para integrar ferramentas e servidores (ex: acesso a arquivos, banco de dados, APIs de serviços).

## Regras para Antigravity neste Workspace
- Ao criar novas automações, implemente os scripts em `src/skills/` e adicione a respectiva instrução na pasta `.agents/skills/`.
- Sempre priorize o uso da API do Ollama (`http://localhost:11434/v1`) para inferência de modelos locais.
- Ao usar dependências, adicione-as no `package.json` utilizando o Node.js.
