import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { normalize } from 'node:path';
import { exit } from 'node:process';
import { copy } from 'fs-extra';
import { errorLog, messageLog } from 'message';
import { mkdirp } from 'mkdirp';
import { version } from 'package';
import type { MessageResponse } from 'types/message';

export const getAppVersion = (): string => version;

export const checkAndCreateDir = async (dirPath: string) => {
	if (existsSync(dirPath)) {
		return true;
	}

	await mkdirp(dirPath);
	return false;
};

export const copyDir = async (srcDir: string, destDir: string): Promise<MessageResponse> => {
	return new Promise((resolve) => {
		if (!existsSync(srcDir)) {
			return resolve({ error: `Source directory does not exist: ${srcDir}` });
		}

		copy(srcDir, destDir, { overwrite: true }, (err) => {
			if (err) {
				return resolve({ error: `Error moving directory: ${err.message}` });
			}

			return resolve({ success: `Directory moved from ${srcDir} to ${destDir}` });
		});
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
