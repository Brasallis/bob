#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';

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
    console.log(chalk.green('Starting interactive mode. (Em breve)'));
  });

program
  .command('run <task>')
  .description('Executa uma tarefa diretamente')
  .action((task) => {
    console.log(chalk.green(`>>> Executing task: ${task}`));
  });

program.parse(process.argv);
