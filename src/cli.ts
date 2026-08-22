#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import readline from 'readline';
import ora from 'ora';
import { Orchestrator } from './engine/Orchestrator';
import { OllamaManager } from './engine/OllamaManager';

// Mostra o nome BOB em fonte 2D, verde Matrix
console.clear();
console.log(
    chalk.greenBright(
        figlet.textSync('BOB', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })
    )
);

console.log(chalk.green('>>> System initialized...'));
console.log(chalk.green('>>> Connection to the construct established.'));
console.log('');

const program = new Command();

program
  .name('bob')
  .description('Bob Multiagent Developer CLI (Matrix Edition)')
  .version('1.0.0');

// Nova função auxiliar para checar Ollama
async function checkOllamaSetup(model: string = 'llama3') {
    const spinner = ora({
        text: chalk.green('Verificando conexão com o Ollama...'),
        color: 'green'
    }).start();

    let isRunning = await OllamaManager.ping();
    
    if (!isRunning) {
        spinner.stop();
        
        const isInstalled = OllamaManager.isInstalled();
        if (!isInstalled) {
            console.log(chalk.greenBright('┌──────────────────────────────────────────────────────────┐'));
            console.log(chalk.greenBright('│                                                          │'));
            console.log(chalk.greenBright('│ ') + chalk.whiteBright.bold(' OLLAMA NÃO ENCONTRADO ') + chalk.greenBright('                                  │'));
            console.log(chalk.greenBright('│                                                          │'));
            console.log(chalk.greenBright('│ ') + chalk.gray('Bob precisa do motor Ollama para processar a Matrix.') + chalk.greenBright('     │'));
            console.log(chalk.greenBright('│                                                          │'));
            console.log(chalk.greenBright('│ ') + chalk.green('1.') + chalk.white(' Acesse ') + chalk.cyan.underline('https://ollama.com/download') + chalk.greenBright('                    │'));
            console.log(chalk.greenBright('│ ') + chalk.green('2.') + chalk.white(' Baixe e instale a versão para Windows.') + chalk.greenBright('                │'));
            console.log(chalk.greenBright('│ ') + chalk.green('3.') + chalk.white(' Reinicie este terminal e digite ') + chalk.yellow('bob') + chalk.white(' novamente.') + chalk.greenBright('        │'));
            console.log(chalk.greenBright('│                                                          │'));
            console.log(chalk.greenBright('└──────────────────────────────────────────────────────────┘\n'));
            process.exit(0);
        } else {
            // Está instalado mas não rodando
            spinner.start(chalk.green('Iniciando o motor Ollama em background...'));
            try {
                await OllamaManager.startOllama();
                isRunning = true;
                spinner.succeed(chalk.green('Ollama iniciado com sucesso em background.'));
            } catch (e: any) {
                spinner.fail(chalk.red('Não foi possível iniciar o Ollama: ' + e.message));
                process.exit(1);
            }
        }
    } else {
        spinner.succeed(chalk.green('Ollama conectado com sucesso.'));
    }

    if (isRunning) {
        spinner.start(chalk.green(`Verificando modelo local (${model})...`));
        const hasModel = await OllamaManager.hasModel(model);
        
        if (!hasModel) {
            spinner.warn(chalk.yellow(`Modelo ${model} não encontrado localmente.`));
            try {
                await OllamaManager.pullModel(model);
            } catch (error: any) {
                console.error(chalk.red(`\nErro ao baixar o modelo: ${error.message}`));
                process.exit(1);
            }
        } else {
            spinner.succeed(chalk.green(`Modelo ${model} está pronto para uso.`));
        }
    }
}

program
  .command('chat', { isDefault: true })
  .description('Inicia o REPL iterativo com o orquestrador')
  .action(async () => {
    
    // Auto-setup mágico
    await checkOllamaSetup('llama3');
    
    console.log(chalk.greenBright('\nWake up, neo...'));
    const orchestrator = new Orchestrator();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let lastModel = 'llama3';
    let lastTokensIn = 0;
    let lastTokensOut = 0;

    const setupScrollRegion = () => {
        const rows = process.stdout.rows || 24;
        process.stdout.write(`\x1b[1;${rows - 1}r`);
    };

    const drawFooter = (model: string, tokensIn: number, tokensOut: number) => {
        lastModel = model;
        lastTokensIn = tokensIn;
        lastTokensOut = tokensOut;
        
        const rows = process.stdout.rows || 24;
        const cols = process.stdout.columns || 80;
        
        process.stdout.write('\x1b[s'); // Save cursor
        process.stdout.write(`\x1b[${rows};1H`); // Move to bottom
        
        const footerText = ` [ Model: ${model} | Tokens: ${tokensIn} in, ${tokensOut} out ] [ Commands: /clear | /model <name> | /exit ] `;
        process.stdout.write(chalk.bgGreen.black(footerText.padEnd(cols, ' ')));
        
        process.stdout.write('\x1b[u'); // Restore cursor
    };

    const resetScrollRegion = () => {
        const rows = process.stdout.rows || 24;
        process.stdout.write(`\x1b[1;${rows}r`);
    };

    process.stdout.on('resize', () => {
        setupScrollRegion();
        drawFooter(lastModel, lastTokensIn, lastTokensOut);
    });

    // Limpa a tela, configura a margem de rolagem e desenha o rodapé inicial
    console.clear();
    setupScrollRegion();
    drawFooter('llama3', 0, 0);
    
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit' || input.toLowerCase() === '/exit') {
            resetScrollRegion();
            console.log(chalk.green('>>> Disconnecting...'));
            process.exit(0);
        }

        if (input.toLowerCase() === '/clear') {
            console.clear();
            drawFooter(lastModel, lastTokensIn, lastTokensOut);
            rl.prompt();
            return;
        }

        if (input.toLowerCase().startsWith('/model ')) {
            const newModel = input.substring(7).trim();
            if (newModel) {
                orchestrator.model = newModel;
                console.log(chalk.cyan(`>>> Motor de inferência alterado para: ${newModel}`));
                drawFooter(newModel, 0, 0);
            }
            rl.prompt();
            return;
        }

        if (input) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(chalk.greenBright('[Bob] '));
            
            const response = await orchestrator.chat(input, (text) => {
                process.stdout.write(chalk.green(text));
            });
            
            console.log();

            drawFooter(
                response.model, 
                response.usage?.prompt_tokens || 0, 
                response.usage?.completion_tokens || 0
            );
        }
        rl.prompt();
    }).on('close', () => {
        resetScrollRegion();
        console.log(chalk.green('\n>>> Connection terminated.'));
        process.exit(0);
    });
  });

program
  .command('run <task>')
  .description('Executa uma tarefa diretamente')
  .action(async (task) => {
    await checkOllamaSetup('llama3');
    console.log(chalk.green(`>>> Executing task: ${task}`));
    const orchestrator = new Orchestrator();
    const response = await orchestrator.chat(task);
    console.log(chalk.green(response.text));
  });

program
  .command('pull <model>')
  .description('Baixa um modelo diretamente do Ollama')
  .action(async (model) => {
    const isRunning = await OllamaManager.ping();
    if (!isRunning) {
        console.log(chalk.red('Ollama não está rodando. Abra o Ollama e tente novamente.'));
        process.exit(1);
    }
    
    try {
        await OllamaManager.pullModel(model);
    } catch (error: any) {
        console.error(chalk.red(`\nErro ao baixar o modelo: ${error.message}`));
    }
  });

program.parse(process.argv);
