# 🕶️ Bob (Hermess) - Matrix Edition

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-blue?style=for-the-badge)
![MCP](https://img.shields.io/badge/Model_Context_Protocol-Integrated-green?style=for-the-badge)

**Bob (Projeto Hermess)** é um orquestrador de sistema avançado de linha de comando (CLI) com uma leve personalidade hacker (Matrix). Ele funciona como um Agente Autônomo Pessoal que roda 100% localmente no seu computador, garantindo privacidade total e zero dependência de nuvem.

O grande diferencial do Bob é a sua capacidade de **"enxergar e interagir" com a sua máquina**. Em vez de ser apenas um gerador de texto, ele está equipado com a infraestrutura do **Model Context Protocol (MCP)**, permitindo que o modelo de IA utilize ferramentas de forma autônoma para ler pastas, analisar arquivos e executar comandos para te ajudar como um verdadeiro Engenheiro de Software Sênior.

---

## ✨ Features Principais

- **🧠 Inteligência Local (Ollama):** Comunicação nativa otimizada com o Ollama local via HTTP Streaming, contornando a necessidade de SDKs pesados.
- **🛠️ Autonomous Tool Calling:** O motor do Bob interpreta "Function Calling" (Chamadas de Ferramenta) dos modelos, pausando o chat, executando integrações complexas no computador, injetando o resultado na memória e devolvendo uma resposta mastigada para você.
- **🔌 Model Context Protocol (MCP):** Integração out-of-the-box com servidores MCP, começando pelo FileSystem Server da Anthropic, dando visão em tempo real do seu código-fonte para o Agente.
- **🖥️ CLI UI Premium:** Interface de linha de comando com estética de máquina de escrever (streaming iterativo), feedback visual do raciocínio e ausência total de "glitches" de rolagem no terminal.
- **⚡ Eficiência de Hardware:** Otimizado e programado por padrão para usar o `qwen2.5:1.5b` — um modelo genial da classe de 1 Bilhão de parâmetros que consome apenas ~1.1 GB de RAM, mas suporta perfeitamente o acionamento complexo de ferramentas.

---

## 🚀 Instalação e Setup

Certifique-se de que você tenha o **Node.js** e o **Ollama** instalados na sua máquina.

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone https://github.com/Brasallis/bob.git
   cd bob
   npm install
   ```

2. **Compile o projeto TypeScript:**
   ```bash
   npm run build
   ```

3. **Inicie a Matrix (Bob):**
   Execute o CLI através do script compilado:
   ```bash
   node ./dist/cli.js
   ```
   *(Caso não tenha o modelo `qwen2.5:1.5b` no seu computador, o Bob fará o download e a configuração mágica para você instantaneamente na primeira execução).*

---

## 🎮 Comandos do REPL

Dentro do chat, você tem controle total da engine:
- `/model <nome-do-modelo>`: Troca o "cérebro" do Bob em tempo real. Ex: `/model llama3.2:1b`
- `/clear`: Limpa a tela do terminal (sem apagar a memória do agente).
- `/exit`: Desconecta e finaliza todos os servidores e processos MCP seguramente.

### Testando a autonomia de ferramentas (MCP)
Experimente digitar o seguinte para o Bob após ele inicializar:
> *"Leia o arquivo package.json no diretório atual usando suas ferramentas e resuma as dependências do projeto para mim."*

---

## 🏗️ Arquitetura (Fase 2)

- **`cli.ts`**: Ponto de entrada, loop de interface (REPL) e interceptação de comandos.
- **`Orchestrator.ts`**: O cérebro integrador. Gerencia a vida do cliente MCP e as instruções sistêmicas do Bob.
- **`Agent.ts`**: Motor HTTP nativo otimizado que executa as iterações (turnos) com o modelo local, lida com arrays de ferramentas e processa respostas aninhadas no formato Ollama/OpenAI.
- **`MCPClient.ts`**: O braço do agente. Inicia a classe `StdioClientTransport` de background e traduz os schemas do `@modelcontextprotocol/sdk`.

---
*“Wake up, neo...”* 🐇
