
# Weasel CLI

Weasel CLI is a powerful command-line tool designed to help you manage and execute custom commands for your projects. It simplifies project workflows by allowing you to define, organize, and run project-specific commands with ease.

## Features

- **Project Management**: Add, update, and delete projects.
- **Command Management**: Define and execute custom commands for each project.
- **Interactive Prompts**: User-friendly prompts for seamless interaction.
- **Cross-Platform**: Works on macOS, Linux, and Windows.

## Installation

Install the package globally using npm:

```bash
npm install -g weasel
```

Verify the installation

```bash
weasel --help
```

## Usage

Add a New Project

```bash
weasel project add <project-name> --path <project-path>
```

- project-name: Name of the project.
- project-path: Path to the project directory.

Add a Command to a Project

```bash
weasel project <project-name> add command <command-name> --alias <alias> --description <description> --argument <argument> --options <options> --command <command>
```

- command-name: Name of the command.
- alias: (Optional) Alias for the command.
- description: (Optional) Description of the command.
- argument: Argument for the command.
- options: (Optional) Options for the command (comma-separated).
- command: The actual command to execute.

Execute a Command

```bash
weasel project <project-name> <command-name>
```

Delete a Command

```bash
weasel project <project-name> delete command <command-name>
```

## License

This project is licensed under the GNU Affero General Public License v3.0.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the CLI.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
