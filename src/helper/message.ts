import chalk from 'chalk';
import type { MessageLogOptions, MessageResponse } from '../types/message';

export const successLog = (...message: unknown[]) => {
	console.log(chalk.green('✔'), ...message);
};

export const errorLog = (...message: unknown[]) => {
	console.log(chalk.red('✖'), ...message);
};

export const infoLog = (...message: unknown[]) => {
	console.log(chalk.blue('ℹ'), ...message);
};

export const warningLog = (...message: unknown[]) => {
	console.log(chalk.yellow('⚠'), ...message);
};

export const debugLog = (...message: unknown[]) => {
	console.log(chalk.gray('➤'), ...message);
};

export const messageLog = (...message: unknown[]) => {
	console.log(...message);
};

export const iconLog = (icon: string, ...message: unknown[]) => {
	console.log(chalk.gray(icon), ...message);
};

export const breakLineLog = () => {
	console.log(chalk.gray('\n──────────────────────────────────────────────\n'));
};

export const showMessageLog = (
	message: MessageResponse,
	{ exit = false, exitNumber = 1 }: MessageLogOptions,
) => {
	if (message.error) {
		errorLog(message.error);
		if (exit) {
			process.exit(exitNumber);
		}
	}
	if (message.success) {
		successLog(message.success);
	}
	if (message.info) {
		infoLog(message.info);
	}
	if (message.warning) {
		warningLog(message.warning);
	}
	if (message.debug) {
		debugLog(message.debug);
	}
	if (message.message) {
		messageLog(message.message);
	}
	if (message.breakLine) {
		breakLineLog();
	}
};
