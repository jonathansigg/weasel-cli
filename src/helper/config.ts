import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import type { Config, ConfigKeys, ConfigValues, CustomSubCommand } from 'types/config';
import type { MessageResponse } from 'types/message';
import { checkAndCreateDir } from 'utils';

export const configDirPath = path.join(homedir(), '.weasel');
export const configPath = path.join(configDirPath, 'config.json');

export const loadConfig = async (): Promise<Config> => {
	await checkAndCreateDir(configDirPath);

	try {
		return JSON.parse(readFileSync(configPath, 'utf-8'));
	} catch (error) {
		return {};
	}
};

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
					error: `Value must have a property '${String(id)}'`,
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
		writeFileSync(configPath, JSON.stringify(config, null, 2));
		return { success: `New config saved to ${key}` };
	} catch (e) {
		return { error: `Failed to save config: ${key} = ${JSON.stringify(value)}` };
	}
};

export const saveCommandConfig = async (
	commandName: string,
	command: CustomSubCommand,
): Promise<MessageResponse> => {
	const config = await loadConfig();
	if (!config?.commands?.length) {
		return { error: 'No Commands found' };
	}
	const commandIndex = config.commands?.findIndex((p) => p.name === commandName) ?? -1;
	if (commandIndex < 0 || config.commands[commandIndex] === undefined) {
		return { error: `Command ${commandName} not found` };
	}
	Object.assign(config.commands[commandIndex], {
		name: commandName,
	});

	config.commands[commandIndex].subcommands = [
		...(config.commands[commandIndex]?.subcommands ?? []),
		command,
	];

	return saveConfig('commands', config.commands, 'name');
};

// Delete config
export const deleteConfig = async (
	key: ConfigKeys,
	index?: number,
	keyName?: string | null,
): Promise<MessageResponse> => {
	const config = await loadConfig();
	let configValue = '';
	if (!config[key]) {
		return { error: `Config not found: ${key}` };
	}

	if (index !== undefined) {
		if (!Array.isArray(config[key])) {
			return { error: `Config is not an array: ${key}` };
		}

		if (index < 0 || index >= config[key].length) {
			return { error: `Index ${index} out of bounds` };
		}

		const deletedConfig = config[key].at(index);
		const _keyName = (keyName ?? '') as ConfigValues;
		if (deletedConfig === undefined || !(_keyName in deletedConfig)) {
			return { error: `Command identifier ${_keyName} does not exist` };
		} else {
			configValue = deletedConfig[_keyName] as string;
		}

		config[key].splice(index, 1);
	} else {
		delete config[key];
	}

	try {
		writeFileSync(configPath, JSON.stringify(config, null, 2));
		return {
			success:
				configValue === ''
					? `Config deleted: ${key}`
					: `Command ${configValue} deleted from ${key}`,
		};
	} catch {
		return { error: `Failed to delete config: ${key}` };
	}
};
