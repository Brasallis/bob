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

    const isRunning = await OllamaManager.ping();
    if (!isRunning) {
        spinner.fail(chalk.red('Falha ao conectar com o Ollama.'));
        console.log(chalk.yellow('\nOllama não está rodando ou não está instalado.'));
        console.log(chalk.gray('-> Para instalar: https://ollama.com/download'));
        console.log(chalk.gray('-> Se já está instalado, abra o aplicativo do Ollama e tente novamente.\n'));
        process.exit(1);
    }
    spinner.succeed(chalk.green('Ollama conectado com sucesso.'));

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
        output: process.stdout,
        prompt: chalk.greenBright('bob> ')
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log(chalk.green('>>> Disconnecting...'));
            process.exit(0);
        }

        if (input) {
            process.stdout.write(chalk.green('... \r')); // simple loading indicator
            const response = await orchestrator.chat(input);
            console.log(chalk.green(response));
        }
        rl.prompt();
    }).on('close', () => {
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
    console.log(chalk.green(response));
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
