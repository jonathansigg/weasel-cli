export type CustomSubCommand = {
	name: string;
	description?: string;
	argument?: string;
	options?: string[];
	command: string;
};

export type CustomCommand = {
	name: string;
	path: string;
	description?: string;
	subcommands?: CustomSubCommand[];
};

export type Config = {
	commands?: CustomCommand[];
};

export type ConfigKeys = keyof Config;
export type ConfigValues = keyof CustomCommand;
