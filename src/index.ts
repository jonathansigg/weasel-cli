#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { loadProjectCommands } from './commands/project.js';
import { loadConfig } from './helper/config.js';
const program = new Command();
loadConfig().then((config) => {
	program
		.name('github-runner-cli')
		.description('A powerful CLI tool for managing GitHub runners')
		.version('1.0.0')
		.setOptionValue('config', config);

	loadProjectCommands(program);

	program.parse(process.argv);
});
