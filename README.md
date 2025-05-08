
# Weasel CLI

Weasel CLI is a powerful command-line tool designed to help you manage and execute custom commands. It simplifies for example project workflows by allowing you to define, organize, and run project-specific commands with ease.

## Features

- **Command Management**: Define and execute custom commands.
- **Interactive Prompts**: User-friendly prompts for seamless interaction.
- **Cross-Platform**: Works on macOS, Linux, and Windows.

## Installation

Install the package globally using npm:

```bash
npm install -g @weasel-scripts/cli
```

Verify the installation

```bash
weasel --help
```

## Usage

Add a new command

```bash
weasel add [command] [path]
```

- command: Name your custom command.
- path: Path to the directory, where to execute your command.

Edit your command

```bash
weasel edit [command]
```

- command: (Optional) Name your custom command. If not set, it will prompt a selectlist with tour commands.

Delete your command

```bash
weasel delete [command]
```

- command: (Optional) Name your custom command. If not set, it will prompt a selectlist with tour commands.

Add a subcommand to your custom command

```bash
weasel [command] addsub [subcommand] --description <description> --options <options> --argument <argument>
```

- command: Name of your custom command.
- subcommand: Name of the subcommand
- description: (Optional) Description of the subcommand.
- options: (Optional) Options for the subcommand.
- argument: (Optional) Argument for the subcommand.

Execute a subcommand

```bash
weasel <command> <subcommand>
```

Delete a subcommand

```bash
weasel <command> deletesub <subcommand>
```

## License

This project is licensed under the GNU Affero General Public License v3.0.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the CLI.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
