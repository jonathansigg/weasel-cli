import { afterEach } from 'node:test';
import { describe, expect, test, vi } from 'vitest';
import {
	breakLineLog,
	debugLog,
	errorLog,
	iconLog,
	infoLog,
	messageIcons,
	messageLog,
	showMessageLog,
	successLog,
	warningLog,
} from './message';

vi.mock('chalk', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...(typeof actual === 'object' && actual !== null ? actual : {}),
		green: vi.fn((text) => `mocked-green(${text})`),
		red: vi.fn((text) => `mocked-red(${text})`),
		blue: vi.fn((text) => `mocked-blue(${text})`),
		yellow: vi.fn((text) => `mocked-yellow(${text})`),
		gray: vi.fn((text) => `mocked-gray(${text})`),
	};
});

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('message log', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});
	describe('messageIcons', () => {
		test('should return the correct icons', () => {
			expect(messageIcons).toEqual({
				success: '✔',
				error: '✖',
				info: 'ℹ',
				warning: '⚠',
				debug: '➤',
				arrow: '➜',
			});
		});
	});
	describe('successLog()', () => {
		test('should log success message', () => {
			const message = 'Success!';
			successLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.success, message);
		});
	});

	describe('errorLog()', () => {
		test('should log error message', () => {
			const message = 'Error!';
			errorLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.error, message);
		});
	});

	describe('infoLog()', () => {
		test('should log info message', () => {
			const message = 'Info!';
			infoLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.info, message);
		});
	});

	describe('warningLog()', () => {
		test('should log warning message', () => {
			const message = 'Warning!';
			warningLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.warning, message);
		});
	});

	describe('debugLog()', () => {
		test('should log debug message', () => {
			const message = 'Debug!';
			debugLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.debug, message);
		});
	});

	describe('messageLog()', () => {
		test('should log message', () => {
			const message = 'Message!';
			messageLog(message);
			expect(consoleLogSpy).toHaveBeenCalledWith(message);
		});
	});

	describe('iconLog()', () => {
		test('should log message with icon', () => {
			const icon = '🍺';
			const message = 'Icon!';
			iconLog(icon, message);
			expect(consoleLogSpy).toHaveBeenCalledWith(icon, message);
		});
	});

	describe('breakLineLog()', () => {
		test('should log breakLine message', () => {
			breakLineLog();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\n──────────────────────────────────────────────\n',
			);
		});
	});

	describe('showMessageLog()', () => {
		test('should log error message and exit', () => {
			const message = { error: 'Error!' };
			const exitSpy = vi.spyOn(process, 'exit').mockImplementation(vi.fn() as never);
			showMessageLog(message, { exit: true, exitNumber: 2 });
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.error, message.error);
			expect(exitSpy).toHaveBeenCalledWith(2);
		});

		test('should log all messages', () => {
			const message = {
				error: 'Error!',
				success: 'Success!',
				info: 'Info!',
				warning: 'Warning!',
				debug: 'Debug!',
				message: 'Message!',
			};
			showMessageLog(message, { exit: false });
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.error, message.error);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.success, message.success);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.info, message.info);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.warning, message.warning);
			expect(consoleLogSpy).toHaveBeenCalledWith(messageIcons.debug, message.debug);
			expect(consoleLogSpy).toHaveBeenCalledWith(message.message);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'\n──────────────────────────────────────────────\n',
			);
		});
	});
});
