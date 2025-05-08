#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { loadCustomCommand } from 'commands/custom-command';
import { loadConfig } from 'config';
import { getAppVersion } from 'utils';
const program = new Command();
loadConfig().then((config) => {
	program
		.name('weasel')
		.description(
			'Weasel CLI was created for managing custom commands for your projects.\nCreated with ❤️ by @jonathansigg.',
		)
		.version(getAppVersion())
		.setOptionValue('config', config);

	loadCustomCommand(program);

	program.parse(process.argv);
});
