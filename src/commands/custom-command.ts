import type { Command } from '@commander-js/extra-typings';
import { confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { deleteConfig, saveCommandConfig, saveConfig } from 'config';
import { messageIcons, showMessageLog, successLog } from 'message';
import type { Config, CustomCommand } from 'types/config.js';
import { startProcess } from 'utils';

export const loadCustomCommand = (program: Command) => {
	const config = program.getOptionValue('config') as Config;
	const customCommands = config?.commands;

	program
		.command('add')
		.alias('a')
		.description('Add new command')
		.option('--description, -d <d>', 'Project command description')
		.arguments('[name] [path]')
		.action(async (_name, _path, { d }) => {
			if (customCommands?.find((p) => p?.name === _name)) {
				showMessageLog(
					{
						error: `Command name ${_name} already exists. Please choose a different name.`,
					},
					{ exit: true, exitNumber: 1 },
				);
			}

			const name =
				_name ??
				(await input({
					message: 'Enter the command name',
					validate: (value) => {
						if (value.includes(' ')) {
							return 'Command name cannot contain spaces';
						}
						if (program.commands.find((cmd) => cmd.name() === value)) {
							return `Command name ${value} already exists. Please choose a different name.`;
						}
						return true;
					},
				}));

			const path =
				_path ??
				(await input({
					message: 'Enter the path',
					default: customCommands?.find((p) => p?.name === name)?.path ?? '/',
					required: true,
				}));

			const desc =
				d ??
				(await input({
					message: 'Enter the command description. Leave empty for no description:',
					default: '',
				}));

			const newConfig: CustomCommand = {
				name,
				path,
				description: desc === '' ? undefined : desc,
			};
			const { error, success } = await saveConfig('commands', [newConfig], 'name');
			showMessageLog({ error, success }, { exit: true, exitNumber: 1 });
		});

	program
		.command('edit')
		.alias('e')
		.description('Edit command')
		.option('--description, -d <d>', 'Edit command description')
		.option('--path, -p <p>', 'Edit command path')
		.argument('[name]', 'Name of the command')
		.action(async (_name, { p, d }) => {
			if (!customCommands?.length) {
				showMessageLog({ error: 'No commands found' }, { exit: true, exitNumber: 1 });
			}

			const name =
				_name ??
				(await select({
					message: 'Enter command name which you want to edit:',
					choices: customCommands?.map((p) => ({ value: p.name, name: p.name })) ?? [],
				}));

			const customCommand = customCommands?.find((p) => p?.name === name);
			if (!customCommand) {
				showMessageLog({ error: `Command ${name} not found` }, { exit: true, exitNumber: 1 });
			}

			const path =
				p ??
				(await input({
					message: 'Enter the path:',
					default: customCommand?.path ?? '/',
					required: true,
				}));

			const desc =
				d ??
				(await input({
					message: 'Enter the command description. Leave empty for no description:',
					default: customCommand?.description ?? '',
				}));

			const newConfig: CustomCommand = {
				name,
				path,
				description: desc === '' ? undefined : desc,
			};
			const { error, success } = await saveConfig('commands', [newConfig], 'name');
			showMessageLog({ error, success }, { exit: true, exitNumber: 1 });
		});

	program
		.command('delete')
		.alias('d')
		.description('Delete command')
		.argument('[name]', 'Name of the command')
		.action(async (_name) => {
			if (!customCommands?.length) {
				showMessageLog({ error: 'No commands found' }, { exit: true, exitNumber: 1 });
			}

			const name =
				_name ??
				(await select({
					message: 'Enter command name which you want to delete:',
					choices: customCommands?.map((p) => ({ value: p.name, name: p.name })) ?? [],
				}));

			const deleteCommand = await confirm({
				message: `${chalk.red(
					`${messageIcons.warning} WARNING`,
				)}\nAre you sure you want to delete command ${name}? This action cannot be undone`,
				default: false,
			});

			if (!deleteCommand) {
				showMessageLog(
					{ message: 'Command deletion cancelled' },
					{ exit: true, exitNumber: 1 },
				);
			}

			const customCommandIndex = customCommands?.findIndex((p) => p?.name === name) ?? -1;
			if (customCommandIndex < 0) {
				showMessageLog({ error: `Command ${name} not found` }, { exit: true, exitNumber: 1 });
			}

			const { error, success } = await deleteConfig('commands', customCommandIndex);
			showMessageLog({ error, success }, { exit: true, exitNumber: 1 });
		});

	for (const cm of config?.commands ?? []) {
		const customCommand = program.command(cm.name).description(cm?.description ?? '');

		const addCommand = customCommand
			.command('addsub')
			.alias('as')
			.description(`Add new subcommand for ${cm.name}`);

		const deleteCommand = customCommand
			.command('deletesub')
			.alias('ds')
			.description(`Delete subcommand for ${cm.name}`);

		deleteCommand.argument('[name]', 'Name of the subcommand').action(async (name) => {
			if (!cm?.subcommands?.length) {
				showMessageLog({ error: 'No commands found' }, { exit: true, exitNumber: 1 });
			}

			const projectIndex =
				config.commands?.findIndex((project) => project.name === cm.name) ?? -1;
			const commandChoices =
				cm?.subcommands?.map((scm) => ({
					value: scm.name,
					name: scm.name,
				})) ?? [];

			const commandName =
				name ??
				(await select({
					message: 'Enter the command name',
					choices: commandChoices,
				}));

			if (projectIndex < 0) {
				showMessageLog(
					{ error: `Project ${cm.name} not found` },
					{ exit: true, exitNumber: 1 },
				);
			}

			const commandIndex =
				config.commands
					?.at(projectIndex)
					?.subcommands?.findIndex((scm) => scm.name === commandName) ?? -1;
			if (commandIndex < 0) {
				showMessageLog(
					{ error: `Command ${commandName} not found` },
					{ exit: true, exitNumber: 1 },
				);
			}

			config.commands?.at(projectIndex)?.subcommands?.splice(commandIndex, 1);
			await saveConfig('commands', config.commands, 'name');
			successLog(`Command ${commandName} removed from project ${cm.name}`);
		});

		addCommand
			.argument('[name]', 'Name of the subcommand')
			.option('--description, -d <d>', 'Subcommand description')
			.option('--argument, -a <a>', 'Subcommand argument')
			.option('--options, -o <o>', 'Subcommand options')
			.option('--command, -c <c>', 'Subcommand name')
			.action(async (_name, { d, a, o, c }) => {
				c = c ? c.replaceAll(',', ' ') : undefined;
				const command = {
					name:
						_name ??
						(await input({
							message: 'Enter the subcommand name',
							validate: (value) => {
								if (value.includes(' ')) {
									return 'Command name cannot contain spaces';
								}
								if (cm?.subcommands?.find((cmd) => cmd.name === value)) {
									return `Command name ${value} already exists. Please choose a different name.`;
								}
								return true;
							},
						})),
					command:
						c ??
						(await input({
							message: 'Enter the command for example sh, pnpm or bash etc.:',
							required: true,
							validate: (value) => {
								if (value.includes(' ')) {
									return 'Command cannot contain spaces';
								}

								if (program.commands.find((cmd) => cmd.name() === value)) {
									return `Command name ${value} already exists. Please choose a different name.`;
								}

								return true;
							},
						})),
					options:
						o ??
						(await input({
							message: 'Enter the command options. Leave empty for no options',
							default: '',
						})),
					argument:
						a ??
						(await input({
							message: 'Enter argument for the command, Leave empty for no argument',
							default: '',
						})),
					description:
						d ??
						(await input({
							message: 'Enter the command description. Leave empty for no description:',
							default: '',
						})),
				};

				const newCommand = {
					name: command.name,
					description: command.description === '' ? undefined : command.description,
					argument: command.argument === '' ? undefined : command.argument,
					options: command.options === '' ? undefined : command.options.split(' '),
					command: command.command,
				};

				saveCommandConfig(cm.name, newCommand);
				successLog(
					`New subcommand ${newCommand.name} successfully saved for command ${cm.name}`,
				);
			});

		for (const scm of cm?.subcommands ?? []) {
			const subProjectCommand = customCommand
				.command(scm.name)
				.description(scm?.description ?? '');

			subProjectCommand.action(async () => {
				startProcess(scm.command, scm.options ?? [], cm.path);
			});
		}
	}
};
