export type MessageResponse = {
	error?: string;
	success?: string;
	info?: string;
	warning?: string;
	debug?: string;
	message?: string;
	breakLine?: string;
};

export type MessageLogOptions = {
	exit?: boolean;
	exitNumber?: number;
};

export type MessageIcons = '✔' | '✖' | 'ℹ' | '⚠' | '➤' | '➜' | string;
