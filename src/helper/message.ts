import chalk from 'chalk';
import type { MessageIcons, MessageLogOptions, MessageResponse } from 'types/message';

export const messageIcons = {
	success: '✔',
	error: '✖',
	info: 'ℹ',
	warning: '⚠',
	debug: '➤',
	arrow: '➜',
};

export const successLog = (...message: unknown[]) => {
	console.log(chalk.green(messageIcons.success), ...message);
};

export const errorLog = (...message: unknown[]) => {
	console.log(chalk.red(messageIcons.error), ...message);
};

export const infoLog = (...message: unknown[]) => {
	console.log(chalk.blue(messageIcons.info), ...message);
};

export const warningLog = (...message: unknown[]) => {
	console.log(chalk.yellow(messageIcons.warning), ...message);
};

export const debugLog = (...message: unknown[]) => {
	console.log(chalk.gray(messageIcons.debug), ...message);
};

export const messageLog = (...message: unknown[]) => {
	console.log(...message);
};

export const iconLog = (icon: MessageIcons, ...message: unknown[]) => {
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
