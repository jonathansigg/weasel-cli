import type { Command } from '@commander-js/extra-typings';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { saveCommandConfig, saveConfig } from '../helper/config.js';
import { iconLog, showMessageLog, successLog } from '../helper/message.js';
import { startProcess } from '../helper/utils.js';
import type { Config, Project } from '../types/config.js';

export const loadProjectCommands = (program: Command) => {
	const config = program.getOptionValue('config') as Config;

	program
		.command('projects')
		.description('Projects')
		.command('list')
		.alias('l')
		.description('List all projects')

		.action(() => {
			const projects = config?.projects?.map((p) => p.name) ?? [];
			if (!projects?.length) {
				showMessageLog({ error: 'No projects found' }, { exit: true, exitNumber: 1 });
			}

			for (const p of config?.projects ?? []) {
				iconLog(
					chalk.green('➜'),
					`${p.name}`,
					'|',
					chalk.blue('Commands:'),
					p?.commands?.map((c) => c.name).join(', '),
				);
			}
		});

	const project = program.command('project').description('Manage projects');

	project
		.command('add')
		.alias('a')
		.description('Add a new project')
		.argument('<name>', 'Name of the project')
		.option('--path, -p <p>', 'Path to the project')
		.action(async (name, { p }) => {
			const path =
				p ??
				(await input({
					message: 'Enter the path to the project',
					default: config?.projects?.find((p) => p.id === name)?.path ?? '',
					validate(value) {
						if (value.length === 0) {
							return 'Start command cannot be empty';
						}
						return true;
					},
				}));

			const newConfig: Project = {
				id: name,
				name,
				path,
			};
			const { error, success } = await saveConfig('projects', [newConfig]);
			showMessageLog({ error, success }, { exit: true, exitNumber: 1 });
		});

	for (const p of config?.projects ?? []) {
		const projectCommand = project.command(p.name).description(`Manage project ${p.name}`);

		const addCommand = projectCommand
			.command('add')
			.alias('a')
			.description('Add a new stuff to project');

		const deleteCommand = projectCommand
			.command('delete')
			.alias('d')
			.description('Remove stuff from project');

		deleteCommand
			.command('command')
			.alias('c')
			.description('Remove a command from project')
			.argument('[name]', 'Name of the command')
			.action(async (name) => {
				if (!p?.commands?.length) {
					showMessageLog({ error: 'No commands found' }, { exit: true, exitNumber: 1 });
				}

				const projectIndex =
					config.projects?.findIndex((project) => project.name === p.name) ?? -1;
				const commandChoices =
					p?.commands?.map((c) => ({
						value: c.name,
						name: c.name,
					})) ?? [];

				const commandName =
					name ??
					(await select({ message: 'Enter the command name', choices: commandChoices }));

				if (projectIndex < 0) {
					showMessageLog(
						{ error: `Project ${p.name} not found` },
						{ exit: true, exitNumber: 1 },
					);
				}

				const commandIndex =
					config.projects
						?.at(projectIndex)
						?.commands?.findIndex((c) => c.name === commandName) ?? -1;
				if (commandIndex < 0) {
					showMessageLog(
						{ error: `Command ${commandName} not found` },
						{ exit: true, exitNumber: 1 },
					);
				}

				config.projects?.at(projectIndex)?.commands?.splice(commandIndex, 1);
				await saveConfig('projects', config.projects);
				successLog(`Command ${commandName} removed from project ${p.name}`);
			});

		addCommand
			.command('command')
			.alias('c')
			.description('add a new command to project')
			.argument('<name>', 'Name of the command')
			.option('--description, -d <d>', 'Project command description')
			.option('--argument, -a <a>', 'Project command argument')
			.option('--options, -o <o>', 'Project command options')
			.option(
				'--command, -c <c>',
				'Project command. For multiple commands, use comma (,) to separate them',
			)
			.action(async (name, { d, a, o, c }) => {
				c = c ? c.replaceAll(',', ' ') : undefined;
				const command = {
					name,
					description:
						d ??
						(await input({
							message: 'Enter the command description. Leave empty for no description:',
							default: '',
						})),
					argument:
						a ??
						(await input({
							message: 'Enter argument for the command:',
							required: true,
						})),
					options:
						o ??
						(await input({
							message: 'Enter the command options. Leave empty for no options, ex (-c,-f):',
							default: '',
							validate: (value) => {
								if (value.includes(' ')) {
									return 'Options cannot contain spaces';
								}
								return true;
							},
						})),
					command:
						c ??
						(await input({
							message: 'Enter the command. (ex: sh):',
							required: true,
							validate: (value) => {
								if (value.includes(' ')) {
									return 'Command cannot contain spaces';
								}
								return true;
							},
						})),
				};

				const newCommand = {
					name: command.name,
					description: command.description === '' ? undefined : command.description,
					argument: command.argument,
					options: command.options === '' ? undefined : command.options.split(','),
					command: command.command,
				};

				saveCommandConfig(p.name, newCommand);
				successLog(`New command ${newCommand.name} successfully saved to project ${p.name}`);
			});

		for (const c of p?.commands ?? []) {
			const subProjectCommand = projectCommand.command(c.name);

			if (c?.description) {
				subProjectCommand.description(c.description);
			}

			subProjectCommand.action(async () => {
				startProcess(c.command, c.argument, c.options ?? [], p.path);
			});
		}
	}
};
