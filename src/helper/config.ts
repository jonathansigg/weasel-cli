import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Config, ConfigKeys, ConfigValues, CustomSubCommand } from '../types/config.js';
import type { MessageResponse } from '../types/message.js';
import { checkAndCreateDir } from './utils.js';

// Path to the config file in the user's home directory
export const configDirPath = path.join(os.homedir(), '.weasel');
export const configPath = path.join(configDirPath, 'config.json');

// Load existing config or initialize empty
export const loadConfig = async (): Promise<Config> => {
	await checkAndCreateDir(configDirPath);

	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
	} catch (error) {
		return {};
	}
};

// Save config back to file
export const saveConfig = async <K extends ConfigKeys>(
	key: K,
	value: Config[K],
	id?: ConfigValues,
): Promise<MessageResponse> => {
	const config = await loadConfig();
	if (Array.isArray(value)) {
		for (const item of value) {
			if (id && item?.[id] === undefined) {
				return {
					error: `Value must have a property '${String(id)}': ${key} = ${JSON.stringify(value)}`,
				};
			}

			const newConfig =
				config[key]?.map((i) => {
					if (id && i[id] === item[id]) {
						return { ...i, ...item };
					}
					return i;
				}) ?? [];

			if (id && newConfig?.find((i) => i[id] === item[id])) {
				config[key] = newConfig?.length ? newConfig : [item];
			} else {
				config[key] = newConfig?.length ? [...newConfig, item] : [item];
			}
		}
	} else {
		config[key] = value;
	}

	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		return { success: 'New config saved' };
	} catch (e) {
		return { error: `Failed to save config: ${key} = ${JSON.stringify(value)}` };
	}
};

export const saveCommandConfig = async (
	projectName: string,
	command: CustomSubCommand,
): Promise<MessageResponse> => {
	const config = await loadConfig();
	if (!config?.commands?.length) {
		return { error: 'No projects found' };
	}
	const projectIndex = config.commands?.findIndex((p) => p.name === projectName) ?? -1;
	if (projectIndex < 0 || config.commands[projectIndex] === undefined) {
		return { error: `Project ${projectName} not found` };
	}
	Object.assign(config.commands[projectIndex], {
		name: projectName,
	});

	config.commands[projectIndex].subcommands = [
		...(config.commands[projectIndex]?.subcommands ?? []),
		command,
	];

	return saveConfig('commands', config.commands, 'name');
};

// Delete config
export const deleteConfig = async (
	key: ConfigKeys,
	index?: number,
	keyName?: string,
): Promise<MessageResponse> => {
	const config = await loadConfig();
	if (!config[key]) {
		return { error: `Config not found: ${key}` };
	}

	if (index !== undefined) {
		if (!Array.isArray(config[key])) {
			return { error: `Config is not an array: ${key}` };
		}

		if (index < 0 || index >= config[key].length) {
			return { error: `Index out of bounds: ${key}[${index}]` };
		}

		config[key].splice(index, 1);
	} else {
		delete config[key];
	}

	const _keyName = keyName ?? 'name';

	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		const configItem = config[key].at(index ?? 0);
		const configItemValue =
			configItem && typeof configItem === 'object' && _keyName in configItem
				? configItem[keyName as keyof typeof configItem]
				: undefined;
		return {
			success:
				configItemValue !== undefined
					? `${configItemValue} ${key} successfully deleted`
					: `Config deleted: ${key}`,
		};
	} catch {
		return { error: `Failed to delete config: ${key}` };
	}
};
