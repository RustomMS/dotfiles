# Personal Dotfiles

This repository contains Rustom's personal macOS configuration.

## Current setup

`./setup` is the installation entry point for Apple Silicon macOS. It uses the current `$HOME` and hostname rather than assuming a particular account or machine.

- `./setup --check` simulates Stow and validates the mise configuration without changing the live home directory.
- `./setup` stows configuration and then installs the tools declared in mise.
- `./setup --brew` installs the tools and applications listed in `Brewfile` without stowing configuration.
- `./setup --check --brew` checks the Homebrew bundle without installing it.

GNU Stow links these packages into the home directory:

- `stow/common/` — portable shell, Git, editor, tmux, SSH, and tool configuration
- `stow/macos/` — macOS application configuration
- `stow/pi/` — personal Pi configuration
- `stow/host-<hostname>/` — optional host-specific configuration selected automatically

Stow conflicts stop setup without moving existing paths. Configuration stays in each tool's native format.

Inspect `./setup` before changing its behaviour. Keep personal Git identity, private SSH hosts, secrets, and machine-local shell settings in the local files described by the examples at the repository root.

## Scope

Keep this repository personal and macOS-first.

Add only reusable configuration suitable for personal machines. Do not commit credentials, tokens, private keys, machine-specific secrets, or sensitive host details.

## Configuration style

Prefer each tool's readable native format:

- Shell configuration in shell files
- Git configuration in Git config files
- tmux configuration in `tmux.conf`
- Neovim configuration in Lua
- Terminal configuration in its native format
- XDG config paths when the tool officially supports them

Do not rewrite readable configuration into another format without a clear benefit.

## Safe changes

- Inspect existing files before editing them.
- Keep changes small and focused.
- Do not change unrelated configuration.
- Do not incorporate untracked files without reviewing them first.
- Do not run `./setup` unless the user asks to change the live home directory.
- Never delete credentials, private keys, or user data.
- Do not use Stow's `--adopt` option automatically; use it only after explicitly reviewing the existing target.

## Validation

Validate the behaviour affected by the change:

- Always run `git diff --check`.
- For shell changes, run `bash -n` and ShellCheck when available.
- For Stow package changes, run `./setup --check`; do not run apply mode merely to validate.
- Run the affected tool's native checks when available.
- For setup changes, confirm conflicts leave existing paths untouched.

Do not claim behaviour was tested unless the corresponding command was run successfully.

## Commits

Use small, focused Conventional Commits, for example:

- `docs: update repository instructions`
- `feat: add shell aliases`
- `refactor: simplify setup links`
- `chore: update editor configuration`
