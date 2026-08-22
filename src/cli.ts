#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import readline from 'readline';
import { Orchestrator } from './engine/Orchestrator';

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

program
  .command('chat')
  .description('Inicia o REPL iterativo com o orquestrador')
  .action(async () => {
    console.log(chalk.greenBright('Wake up, neo...'));
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
    console.log(chalk.green(`>>> Executing task: ${task}`));
    const orchestrator = new Orchestrator();
    const response = await orchestrator.chat(task);
    console.log(chalk.green(response));
  });

program.parse(process.argv);
