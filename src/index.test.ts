import { Command } from '@commander-js/extra-typings';
import { type Mock, describe, expect, test, vi } from 'vitest';
import { loadCustomCommand } from './commands/custom-command';
import { loadConfig } from './helper/config';

const mocks = vi.hoisted(() => ({
	command: {
		name: vi.fn().mockReturnThis(),
		description: vi.fn().mockReturnThis(),
		version: vi.fn().mockReturnThis(),
		parse: vi.fn().mockReturnThis(),
		setOptionValue: vi.fn().mockReturnThis(),
	},
	appVersion: vi.fn().mockReturnValue('1.0.0'),
	loadConfig: vi.fn().mockResolvedValue({ commands: [] }),
}));

vi.mock('@commander-js/extra-typings', () => ({
	Command: vi.fn(() => mocks.command),
}));

vi.mock('./commands/custom-command');
vi.mock('./helper/config', () => ({
	loadConfig: mocks.loadConfig,
}));
vi.mock('./helper/utils', () => ({
	getAppVersion: mocks.appVersion,
}));

describe('weasel CLI', () => {
	test('should load config and create CLI', async () => {
		await import('./index');
		const config = await mocks.loadConfig();

		expect(config).toEqual({ commands: [] });
		expect(Command).toHaveBeenCalled();
		expect(mocks.command.name).toHaveBeenCalledWith('weasel');
		expect(mocks.command.description).toHaveBeenCalledWith(
			'Weasel CLI was created for managing custom commands for your projects.\nCreated with ❤️ by @jonathansigg.',
		);
		expect(mocks.command.version).toHaveBeenCalledWith('1.0.0');
		expect(loadCustomCommand).toHaveBeenCalledWith(mocks.command);
		expect(mocks.command.parse).toHaveBeenCalledWith(process.argv);
	});
});
