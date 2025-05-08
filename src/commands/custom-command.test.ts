import { afterEach } from 'node:test';
import { Command, type CommandUnknownOpts } from '@commander-js/extra-typings';
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
		command: {
			command: vi.fn().mockReturnThis(),
			name: vi.fn().mockReturnThis(),
			alias: vi.fn().mockReturnThis(),
			option: vi.fn().mockReturnThis(),
			argument: vi.fn().mockReturnThis(),
			arguments: vi.fn().mockReturnThis(),
			description: vi.fn().mockReturnThis(),
			version: vi.fn().mockReturnThis(),
			parse: vi.fn().mockReturnThis(),
			setOptionValue: vi.fn().mockReturnThis(),
			action: vi.fn().mockReturnThis(),
			getOptionValue: vi.fn().mockReturnValue(config),
		},
	};
});

const programMock = vi.hoisted(() => async () => {
	const { Command } = await import('@commander-js/extra-typings');
	const program = new Command();
	program.getOptionValue = mocks.command.getOptionValue;
	return program;
});

vi.mock('@commander-js/extra-typings', async () => {
	const program = await programMock();
	return {
		Command: vi.fn(() => program),
	};
});

describe('custom command', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('loadCustomCommand()', () => {
		const program = new Command();
		loadCustomCommand(program);
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
});
