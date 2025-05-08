import { afterEach } from 'node:test';
import { describe, expect, test, vi } from 'vitest';
import {
	configDirPath,
	configPath,
	deleteConfig,
	loadConfig,
	saveCommandConfig,
	saveConfig,
} from './config';

const mocks = vi.hoisted(() => ({
	os: {
		homedir: vi.fn(() => '/home/user'),
	},
	utils: {
		checkAndCreateDir: vi.fn(),
	},
	fs: {
		readFileSync: vi.fn(),
		writeFileSync: vi.fn(),
	},
	config: {
		loadConfig: vi.fn((fn) => fn),
	},
}));

vi.mock('os', () => ({
	homedir: mocks.os.homedir,
}));

vi.mock('node:fs', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('node:fs');

	return {
		...actual,
		readFileSync: mocks.fs.readFileSync,
		writeFileSync: mocks.fs.writeFileSync,
	};
});

vi.mock('./utils', () => ({
	checkAndCreateDir: mocks.utils.checkAndCreateDir,
}));

vi.mock('./config', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('./config');

	return {
		...actual,
		loadConfig: mocks.config.loadConfig(actual.loadConfig),
	};
});

describe('config', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('configDirPath', () => {
		test('should get configDirPath', () => {
			expect(configDirPath).toEqual('/home/user/.weasel');
		});
	});

	describe('configPath', () => {
		test('should get configPath', () => {
			expect(configPath).toEqual('/home/user/.weasel/config.json');
		});
	});

	describe('loadConfig', () => {
		test('should get config from config path', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(JSON.stringify({ key: 'value' }));
			const result = await loadConfig();
			expect(result).toEqual({ key: 'value' });
		});

		test('should get empty object when throwing error', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockRejectedValue(new Error('Error reading file'));
			const result = await loadConfig();
			expect(result).toEqual({});
		});
	});

	describe('saveConfig()', () => {
		mocks.utils.checkAndCreateDir.mockClear();
		mocks.fs.readFileSync.mockClear();
		mocks.fs.writeFileSync.mockClear();

		afterEach(() => {
			mocks.utils.checkAndCreateDir.mockClear();
			mocks.fs.readFileSync.mockClear();
			mocks.fs.writeFileSync.mockClear();
		});
		test('should save new config to config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(JSON.stringify({ key: 'value 1' }));
			const expectedResult = {
				key: 'value 1',
				key2: 'value 2',
			};

			const result = await saveConfig('key2', 'value 2');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to key2' });
		});

		test('should save and overwrite config to config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(JSON.stringify({ key: 'value 1' }));
			const expectedResult = {
				key: 'value 2',
			};

			const result = await saveConfig('key', 'value 2');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to key' });
		});

		test('should save new config to empty config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue('');
			const expectedResult = {
				key: 'value',
			};

			const result = await saveConfig('key', 'value');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to key' });
		});

		test('should save new config array to config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({ testkey: [{ id: 1, name: 'test 1' }] }),
			);
			const expectedResult = {
				testkey: [
					{ id: 1, name: 'test 1' },
					{ id: 2, name: 'test 2' },
				],
			};

			const result = await saveConfig('testkey', [{ id: 2, name: 'test 2' }], 'id');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to testkey' });
		});

		test('should save new config array with existing key to config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					testkey: [
						{ id: 1, name: 'test 1' },
						{ id: 2, name: 'test 2' },
					],
				}),
			);
			const expectedResult = {
				testkey: [
					{ id: 1, name: 'test 111' },
					{ id: 2, name: 'test 2' },
				],
			};

			const result = await saveConfig('testkey', [{ id: 1, name: 'test 111' }], 'id');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to testkey' });
		});
	});

	describe('saveCommandConfig()', () => {
		afterEach(() => {
			mocks.utils.checkAndCreateDir.mockClear();
			mocks.fs.readFileSync.mockClear();
			mocks.fs.writeFileSync.mockClear();
		});

		test('should save new subcommand config to config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: [
						{
							name: 'test',
							command: 'test command',
						},
					],
				}),
			);
			const expectedResult = {
				commands: [
					{
						name: 'test',
						command: 'test command',
						subcommands: [
							{
								name: 'test 2',
								description: 'test command 2',
								argument: 'start',
								options: ['-f', '--force'],
								command: 'pnpm',
							},
						],
					},
				],
			};

			const result = await saveCommandConfig('test', {
				name: 'test 2',
				description: 'test command 2',
				argument: 'start',
				options: ['-f', '--force'],
				command: 'pnpm',
			});
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'New config saved to commands' });
		});

		test('should fail to save command, when no command is set', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue('');
			const expectedResult = {
				commands: [],
			};

			const result = await saveCommandConfig('commands', []);
			expect(result).toEqual({ error: 'No Commands found' });
		});

		test('should fail to save command, when no command name not found', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: [
						{
							name: 'test',
							command: 'test command',
						},
					],
				}),
			);

			const result = await saveCommandConfig('test 2', []);
			expect(result).toEqual({ error: 'Command test 2 not found' });
		});
	});

	describe('deleteConfig()', () => {
		afterEach(() => {
			mocks.utils.checkAndCreateDir.mockClear();
			mocks.fs.readFileSync.mockClear();
			mocks.fs.writeFileSync.mockClear();
		});

		test('should delete config from config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					key: 'value',
					key2: 'value 2',
				}),
			);
			const expectedResult = {
				key2: 'value 2',
			};

			const result = await deleteConfig('key');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({ success: 'Config deleted: key' });
		});

		test('should delete command from config file', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: [
						{
							name: 'test',
							command: 'test command',
						},
						{
							name: 'test 2',
							command: 'test command 2',
						},
					],
				}),
			);
			const expectedResult = {
				commands: [
					{
						name: 'test',
						command: 'test command',
					},
				],
			};

			const result = await deleteConfig('commands', 1, 'name');
			expect(mocks.fs.writeFileSync).toHaveBeenCalledWith(
				configPath,
				JSON.stringify(expectedResult, null, 2),
			);
			expect(result).toEqual({
				success: 'Command test 2 deleted from commands',
			});
		});

		test('should fail delete command from config file when identifier not existing', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: [
						{
							name: 'test',
							command: 'test command',
						},
						{
							name: 'test 2',
							command: 'test command 2',
						},
					],
				}),
			);

			const result = await deleteConfig('commands', 1, 'weird');
			expect(result).toEqual({
				error: 'Command identifier weird does not exist',
			});
		});

		test('should fail delete command from config file when index not existing', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: [
						{
							name: 'test',
							command: 'test command',
						},
						{
							name: 'test 2',
							command: 'test command 2',
						},
					],
				}),
			);

			const result = await deleteConfig('commands', 3, 'test');
			expect(result).toEqual({
				error: 'Index 3 out of bounds',
			});
		});

		test('should fail delete command from config file when config value is not an array', async () => {
			mocks.utils.checkAndCreateDir.mockResolvedValue(true);
			mocks.fs.readFileSync.mockReturnValue(
				JSON.stringify({
					commands: {
						name: 'test',
						command: 'test command',
					},
				}),
			);

			const result = await deleteConfig('commands', 3, 'test');
			expect(result).toEqual({
				error: 'Config is not an array: commands',
			});
		});
	});
});
