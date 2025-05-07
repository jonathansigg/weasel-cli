import { select } from '@inquirer/prompts';
import { copy } from 'fs-extra';
import { mkdirp } from 'mkdirp';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { normalize } from 'node:path';
import { exit } from 'node:process';
import type { Config, CustomCommand } from '../types/config.js';
import { errorLog, messageLog, showMessageLog } from './message.js';

export const checkAndCreateDir = async (dirPath: string) => {
	if (existsSync(dirPath)) {
		return true;
	}

	await mkdirp(dirPath);
	return false;
};

export const copyDir = async (srcDir: string, destDir: string) => {
	if (!existsSync(srcDir)) {
		throw new Error(`Source directory does not exist: ${srcDir}`);
	}

	copy(srcDir, destDir, { overwrite: true }, (err) => {
		if (err) throw new Error(`Error moving directory: ${err.message}`);
	});
};

export const startProcess = (command: string, options: string[], cwd: string) => {
	messageLog(`Running command: ${command} ${options.join(' ')}`);
	const script = spawn(command, [...options], {
		cwd: normalize(cwd),
		env: process.env,
		shell: true,
	});

	script.stdout.on('data', (data) => {
		messageLog(`${data}`);
	});

	script.stdout.on('error', (error) => {
		errorLog(error);
		exit(1);
	});
};

export const getProject = async (name?: string, config?: Config): Promise<CustomCommand> => {
	if (!config?.commands?.length) {
		showMessageLog({ error: 'No commands found' }, { exit: true, exitNumber: 1 });
	}

	const customCommands = config?.commands?.map((p) => ({ value: p.name, name: p.name })) ?? [];
	const customCommandName =
		name ??
		(await select({
			message: 'Select a command to start',
			choices: customCommands,
		}));

	const customCommand = config?.commands?.find(
		(p) => p.name === customCommandName,
	) as CustomCommand;
	if (!customCommand) {
		showMessageLog(
			{ error: `Command ${customCommandName} not found` },
			{ exit: true, exitNumber: 1 },
		);
	}

	return customCommand;
};
