import { select } from '@inquirer/prompts';
import { copy } from 'fs-extra';
import { mkdirp } from 'mkdirp';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { normalize } from 'node:path';
import { exit } from 'node:process';
import type { Config, Project } from '../types/config.js';
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

export const startProcess = (
	command: string,
	argument: string,
	options: string[],
	cwd: string,
) => {
	const script = spawn(command, [...options, argument], {
		cwd: normalize(cwd),
	});

	script.stdout.on('data', (data) => {
		messageLog(`${data}`);
	});

	script.stdout.on('error', (error) => {
		errorLog(error);
		exit(1);
	});
};

export const getProject = async (name?: string, config?: Config): Promise<Project> => {
	if (!config?.projects?.length) {
		showMessageLog({ error: 'No projects found' }, { exit: true, exitNumber: 1 });
	}

	const projects = config?.projects?.map((p) => ({ value: p.id, name: p.name })) ?? [];
	const projectName =
		name ??
		(await select({
			message: 'Select a project to start',
			choices: projects,
		}));

	const project = config?.projects?.find((p) => p.id === projectName) as Project;
	if (!project) {
		showMessageLog(
			{ error: `Project ${projectName} not found` },
			{ exit: true, exitNumber: 1 },
		);
	}

	return project;
};
