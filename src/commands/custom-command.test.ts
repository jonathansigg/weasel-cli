import { afterEach } from 'node:test';
import { Command, type CommandUnknownOpts } from '@commander-js/extra-typings';
import { confirm, input, select } from '@inquirer/prompts';
import { render } from '@inquirer/testing';
import { describe, expect, test, vi } from 'vitest';
import { loadCustomCommand } from './custom-command';

const mocks = vi.hoisted(() => {
	const config = {
		commands: [
			{
				name: 'project1',
				path: '/Users/John/Projects/project1',
				description: 'Project 1 description',
				subcommands: [
					{
						name: 'start',
						command: 'sh',
						argument: 'bin/start',
						options: ['-c'],
						description: 'Start server',
					},
					{
						name: 'stop',
						command: 'sh',
						argument: 'bin/stop',
						options: ['-c'],
						description: 'Stop server',
					},
				],
			},
			{
				name: 'project2',
				path: '/Users/John/Projects/project2',
				subcommands: [
					{
						name: 'start',
						command: 'sh',
						argument: 'bin/start',
						options: ['-c'],
						description: 'Start server',
					},
					{
						name: 'delete',
						command: 'sh',
						argument: 'bin/delete',
						options: ['-c'],
						description: 'Delete server',
					},
				],
			},
		],
	};
	return {
		config,
		process: {
			exit: vi.fn(),
		},
		inquirer: {
			confirm: vi.fn((fn) => fn).mockReturnThis(),
			input: vi.fn((fn) => fn),
			select: vi.fn((fn) => fn),
		},
		conf: {
			saveConfig: vi.fn(),
			saveCommandConfig: vi.fn(),
			deleteConfig: vi.fn(),
		},
	};
});

vi.mock('process', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof process;
	return {
		...actual,
		exit: mocks.process.exit,
	};
});

vi.mock('@inquirer/prompts', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('@inquirer/prompts');
	return {
		...actual,
		// confirm: mocks.inquirer.confirm(actual.confirm),
		// input: mocks.inquirer.input(actual.input),
		// select: mocks.inquirer.select(actual.select),
	};
});

const programMock = vi.hoisted(() => async () => {
	const { Command } = await import('@commander-js/extra-typings');
	const program = new Command();
	return program;
});

vi.mock('@commander-js/extra-typings', async () => {
	const program = await programMock();
	return {
		Command: vi.fn(() => program),
	};
});

vi.mock('../helper/message', () => {
	return { successLog: vi.fn() };
});

vi.mock('../helper/config', () => {
	return {
		saveConfig: mocks.conf.saveConfig,
		saveCommandConfig: mocks.conf.saveCommandConfig,
		deleteConfig: mocks.conf.deleteConfig,
	};
});

describe('custom command', () => {
	const program = new Command();
	program
		.name('weasel')
		.description(
			'Weasel CLI was created for managing custom commands for your projects.\nCreated with ❤️ by @jonathansigg.',
		)
		.version('1.0.0')
		.setOptionValue('config', mocks.config);
	loadCustomCommand(program);

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('loadCustomCommand()', () => {
		test('should call getOptionValue to retrieve config', () => {
			expect(program.getOptionValue('config')).toEqual(mocks.config);
		});

		test('should create add command', () => {
			const command = program.commands.find((cmd) => cmd.name() === 'add');

			expect(command?.name()).toBeDefined();
			expect(command?.alias()).toEqual('a');
			expect(command?.description()).toEqual('Add new command');

			expect(command?.options).lengthOf(1);
			expect(command?.options?.at(0)?.flags).toEqual('--description, -d <d>');
			expect(command?.options?.at(0)?.description).toEqual('Project command description');

			expect(command?.registeredArguments).lengthOf(2);
			expect(command?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(command?.registeredArguments?.at(0)?.name()).toEqual('name');
			expect(command?.registeredArguments?.at(1)?.required).toBeFalsy();
			expect(command?.registeredArguments?.at(1)?.name()).toEqual('path');
		});

		test('should create edit command', () => {
			const command = program.commands.find((cmd) => cmd.name() === 'edit');

			expect(command?.name()).toBeDefined();
			expect(command?.alias()).toEqual('e');
			expect(command?.description()).toEqual('Edit command');

			expect(command?.options).lengthOf(2);
			expect(command?.options?.at(0)?.flags).toEqual('--description, -d <d>');
			expect(command?.options?.at(0)?.description).toEqual('Edit command description');
			expect(command?.options?.at(1)?.flags).toEqual('--path, -p <p>');
			expect(command?.options?.at(1)?.description).toEqual('Edit command path');

			expect(command?.registeredArguments).lengthOf(1);
			expect(command?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(command?.registeredArguments?.at(0)?.description).toEqual('Name of the command');
			expect(command?.registeredArguments?.at(0)?.name()).toEqual('name');
		});

		test('should create delete command', () => {
			const command = program.commands.find((cmd) => cmd.name() === 'delete');

			expect(command?.name()).toBeDefined();
			expect(command?.alias()).toEqual('d');
			expect(command?.description()).toEqual('Delete command');

			expect(command?.registeredArguments).lengthOf(1);
			expect(command?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(command?.registeredArguments?.at(0)?.description).toEqual('Name of the command');
			expect(command?.registeredArguments?.at(0)?.name()).toEqual('name');
		});

		test('should create custom command project1 with subcommands', () => {
			const command = program.commands.find((cmd) => cmd.name() === 'project1');

			expect(command?.name()).toBeDefined();
			expect(command?.description()).toEqual('Project 1 description');

			const subcommand: (CommandUnknownOpts | undefined)[] = [];
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'start'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'stop'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'addsub'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'deletesub'));

			expect(subcommand[0]?.name()).toBeDefined();
			expect(subcommand[0]?.description()).toEqual('Start server');

			expect(subcommand[1]?.name()).toBeDefined();
			expect(subcommand[1]?.description()).toEqual('Stop server');

			expect(subcommand[2]?.name()).toBeDefined();
			expect(subcommand[2]?.alias()).toEqual('as');
			expect(subcommand[2]?.description()).toEqual('Add new subcommand for project1');
			expect(subcommand[2]?.registeredArguments).lengthOf(1);
			expect(subcommand[2]?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(subcommand[2]?.registeredArguments?.at(0)?.description).toEqual(
				'Name of the subcommand',
			);

			expect(subcommand[2]?.options).lengthOf(4);
			expect(subcommand[2]?.options?.at(0)?.flags).toEqual('--description, -d <d>');
			expect(subcommand[2]?.options?.at(0)?.description).toEqual('Subcommand description');
			expect(subcommand[2]?.options?.at(1)?.flags).toEqual('--argument, -a <a>');
			expect(subcommand[2]?.options?.at(1)?.description).toEqual('Subcommand argument');
			expect(subcommand[2]?.options?.at(2)?.flags).toEqual('--options, -o <o>');
			expect(subcommand[2]?.options?.at(2)?.description).toEqual('Subcommand options');
			expect(subcommand[2]?.options?.at(3)?.flags).toEqual('--command, -c <c>');
			expect(subcommand[2]?.options?.at(3)?.description).toEqual('Subcommand name');

			expect(subcommand[3]?.name()).toBeDefined();
			expect(subcommand[3]?.alias()).toEqual('ds');
			expect(subcommand[3]?.description()).toEqual('Delete subcommand for project1');
			expect(subcommand[3]?.registeredArguments).lengthOf(1);
			expect(subcommand[3]?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(subcommand[3]?.registeredArguments?.at(0)?.description).toEqual(
				'Name of the subcommand',
			);
		});

		test('should create custom command project2 with subcommands', () => {
			const command = program.commands.find((cmd) => cmd.name() === 'project2');

			expect(command?.name()).toBeDefined();

			const subcommand: (CommandUnknownOpts | undefined)[] = [];
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'start'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'delete'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'addsub'));
			subcommand.push(command?.commands.find((cmd) => cmd.name() === 'deletesub'));

			expect(subcommand[0]?.name()).toBeDefined();
			expect(subcommand[0]?.description()).toEqual('Start server');

			expect(subcommand[1]?.name()).toBeDefined();
			expect(subcommand[1]?.description()).toEqual('Delete server');

			expect(subcommand[2]?.name()).toBeDefined();
			expect(subcommand[2]?.alias()).toEqual('as');
			expect(subcommand[2]?.description()).toEqual('Add new subcommand for project2');
			expect(subcommand[2]?.registeredArguments).lengthOf(1);
			expect(subcommand[2]?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(subcommand[2]?.registeredArguments?.at(0)?.description).toEqual(
				'Name of the subcommand',
			);

			expect(subcommand[2]?.options).lengthOf(4);
			expect(subcommand[2]?.options?.at(0)?.flags).toEqual('--description, -d <d>');
			expect(subcommand[2]?.options?.at(0)?.description).toEqual('Subcommand description');
			expect(subcommand[2]?.options?.at(1)?.flags).toEqual('--argument, -a <a>');
			expect(subcommand[2]?.options?.at(1)?.description).toEqual('Subcommand argument');
			expect(subcommand[2]?.options?.at(2)?.flags).toEqual('--options, -o <o>');
			expect(subcommand[2]?.options?.at(2)?.description).toEqual('Subcommand options');
			expect(subcommand[2]?.options?.at(3)?.flags).toEqual('--command, -c <c>');
			expect(subcommand[2]?.options?.at(3)?.description).toEqual('Subcommand name');

			expect(subcommand[3]?.name()).toBeDefined();
			expect(subcommand[3]?.alias()).toEqual('ds');
			expect(subcommand[3]?.description()).toEqual('Delete subcommand for project2');
			expect(subcommand[3]?.registeredArguments).lengthOf(1);
			expect(subcommand[3]?.registeredArguments?.at(0)?.required).toBeFalsy();
			expect(subcommand[3]?.registeredArguments?.at(0)?.description).toEqual(
				'Name of the subcommand',
			);
		});
	});

	// describe('command actions', () => {
	// 	describe('add command', () => {
	// 		test('should call action with correct arguments', async () => {
	// 			const p = await program.parseAsync(['node', 'weasel', 'add']);

	// 			const { answer, events, getScreen } = await render(p, {
	// 				message: 'Enter the command name',
	// 			});

	// 			events.type('test');
	// 		});
	// 	});
	// });
});
