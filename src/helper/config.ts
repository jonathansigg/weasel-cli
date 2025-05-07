import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Command, Config, ConfigKeys } from '../types/config.js';
import type { MessageResponse } from '../types/message.js';
import { errorLog, successLog } from './message.js';
import { checkAndCreateDir } from './utils.js';

// Path to the config file in the user's home directory
export const configDirPath = path.join(os.homedir(), '.mac-scripts');
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
export const saveConfig = async <K extends keyof Config>(
	key: K,
	value: Config[K],
): Promise<MessageResponse> => {
	const config = await loadConfig();
	if (Array.isArray(value)) {
		for (const item of value) {
			if (item?.id === undefined) {
				return { error: `Value must have an id property: ${key} = ${value}` };
			}

			const newConfig =
				config[key]?.map((i) => {
					if (i.id === item?.id) {
						return { ...i, ...item };
					}
					return i;
				}) ?? [];

			if (newConfig?.find((i) => i.id === item?.id)) {
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
		return { error: `Failed to save config: ${key} = ${value}` };
	}
};

export const saveCommandConfig = async (projectName: string, command: Command) => {
	const config = await loadConfig();
	if (!config?.projects?.length) {
		return { error: 'No projects found' };
	}
	const projectIndex = config.projects?.findIndex((p) => p.name === projectName) ?? -1;
	if (projectIndex < 0 || config.projects[projectIndex] === undefined) {
		return { error: `Project ${projectName} not found` };
	}
	Object.assign(config.projects[projectIndex], {
		name: projectName,
	});

	config.projects[projectIndex].commands = [
		...(config.projects[projectIndex]?.commands ?? []),
		command,
	];

	await saveConfig('projects', config.projects);
};

// Delete config
export const deleteConfig = async (key: ConfigKeys) => {
	const config = await loadConfig();
	delete config[key];
	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		successLog(`Config deleted: ${key}`);
	} catch {
		errorLog(`Failed to delete config: ${key}`);
	}
};
