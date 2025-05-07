export type Command = {
	name: string;
	description?: string;
	argument: string;
	options?: string[];
	command: string;
};
export type Project = {
	id: string;
	name: string;
	path: string;
	commands?: Command[];
};
export type Config = {
	projects?: Project[];
};

export type TransformArrayToObject<T> = T extends Array<infer U> ? U : T;
export type ConfigKeys = keyof Config;
export type ConfigValues = Config[keyof Config];
