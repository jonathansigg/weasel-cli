import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { exit } from 'node:process';
import { afterEach } from 'node:test';
import { copy } from 'fs-extra';
import { mkdirp } from 'mkdirp';
import { describe, expect, test, vi } from 'vitest';
import { errorLog, messageLog, showMessageLog } from '../helper/message';
import { checkAndCreateDir, copyDir, getAppVersion, startProcess } from './utils';

vi.mock('../../package.json', () => ({
	version: '1.0.0',
}));

vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
}));

vi.mock('mkdirp', () => ({
	mkdirp: vi.fn(),
}));

vi.mock('fs-extra', () => ({
	copy: vi.fn(),
}));

vi.mock('../helper/message', () => ({
	errorLog: vi.fn(),
	messageLog: vi.fn(),
	showMessageLog: vi.fn(),
}));

vi.mock('node:child_process', () => ({
	spawn: vi.fn().mockReturnValue({
		stdout: {
			on: vi.fn((event, callback) => {
				if (event === 'data') {
					callback('test data');
				}
			}),
		},
	}),
}));

vi.mock('node:path', () => ({
	normalize: vi.fn((path) => `mockPath/${path}`),
}));

vi.mock('node:process', () => ({
	exit: vi.fn(),
}));

describe('utils', () => {
	const existingSyncMock = vi.mocked(existsSync);
	const copyMock = vi.mocked(copy);
	const spawnMock = vi.mocked(spawn);

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getAppVersion()', () => {
		test('should return the version', () => {
			const version = getAppVersion();
			expect(version).toEqual('1.0.0');
		});
	});

	describe('checkAndCreateDir()', () => {
		test('should check directory and not creating it', async () => {
			existingSyncMock.mockReturnValue(true);

			const result = await checkAndCreateDir('/testDir');
			expect(result).toBeTruthy();
		});

		test('should create a directory if it does not exist', async () => {
			existingSyncMock.mockReturnValue(false);

			const result = await checkAndCreateDir('/testDir');
			expect(mkdirp).toHaveBeenCalledWith('/testDir');
			expect(result).toBeFalsy();
		});
	});

	describe('copyDir()', () => {
		const srcDir = '/srcDir';
		const destDir = '/destDir';

		test('should return error message if source directory does not exist', async () => {
			existingSyncMock.mockReturnValue(false);

			const result = await copyDir(srcDir, destDir);
			expect(result).toEqual({
				error: `Source directory does not exist: ${srcDir}`,
			});
		});

		test('should resolve error message if copy fails', async () => {
			existingSyncMock.mockReturnValue(true);
			copyMock.mockImplementation((_, __, options, callback) => {
				callback(new Error('Copy error'));
			});

			const result = await copyDir(srcDir, destDir);
			expect(result).toEqual({
				error: 'Error moving directory: Copy error',
			});
		});

		test('should resolve error message if copy fails', async () => {
			existingSyncMock.mockReturnValue(true);
			copyMock.mockImplementation((_, __, options, callback) => {
				callback(undefined);
			});

			const result = await copyDir(srcDir, destDir);
			expect(result).toEqual({
				success: `Directory moved from ${srcDir} to ${destDir}`,
			});
		});
	});

	describe('startProcess()', () => {
		const command = 'testCommand';
		const options = ['arg1', 'arg2'];
		const cwd = 'testDir';

		test('should show message log', () => {
			const message = 'Running command: testCommand arg1 arg2';
			startProcess(command, options, cwd);
			expect(messageLog).toHaveBeenCalledWith(message);
		});

		test('should spawn a process', () => {
			const instance = spawnMock.mock.results[0].value;
			startProcess(command, options, cwd);
			expect(spawn).toHaveBeenCalledWith(command, [...options], {
				cwd: 'mockPath/testDir',
				env: process.env,
				shell: true,
			});

			instance.stdout.on('data', (data: unknown) => {
				expect(messageLog).toHaveBeenCalledWith('test data');
			});

			instance.stdout.on('error', (data: unknown) => {
				expect(errorLog).toHaveBeenCalledWith('test data');
				expect(exit).toHaveBeenCalledWith(1);
			});
		});
	});

});
