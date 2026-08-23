# Personal Dotfiles

This repository contains Rustom's personal macOS configuration.

## Current setup

Mise is the installation entry point for Apple Silicon macOS:

- `mise bootstrap --dry-run` previews tools, packages, and configuration without changing the live home directory.
- `mise bootstrap --yes` applies the declarative workstation configuration.
- `mise bootstrap status --missing` checks whether declared resources converge.
- `./setup --brew` installs the GUI applications retained in `Brewfile`.
- `./setup --check --brew` checks those Homebrew applications without installing them.

Mise manages the repository's tools, dotfiles, shell configuration, host-specific laptop environment, and Pi configuration. Homebrew retains ownership of GUI casks listed in `Brewfile`. The `setup` helper is only the Homebrew cask interface.

Configuration sources live under `home/` and use each tool's native format. `mise.toml` contains common bootstrap declarations; `mise.laptop.toml` contains laptop-specific declarations; `.miserc.toml` selects the laptop environment by default; and `home/.config/mise/config.toml` contains global workstation tools.

Inspect `setup` before changing its behaviour. Keep personal Git identity, private SSH hosts, secrets, and machine-local shell settings in the local files described by the examples at the repository root.

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
- Do not run `mise bootstrap` unless the user asks to change the live home directory.
- Never delete credentials, private keys, or user data.
- Use Mise's conflict-safe dotfile behavior; review `--dry-run` before an explicit force operation.

## Validation

Validate the behaviour affected by the change:

- Always run `git diff --check`.
- For shell changes, run `bash -n` and ShellCheck when available.
- For Mise configuration changes, run `mise bootstrap plan`, `mise bootstrap status --missing`, and the affected tool's native checks.
- For Homebrew cask changes, run `./setup --check --brew`.
- Confirm unmanaged local files and Pi state remain untouched when changing additive mappings.

Do not claim behaviour was tested unless the corresponding command was run successfully.

## Commits

Use small, focused Conventional Commits, for example:

- `docs: update repository instructions`
- `feat: add shell aliases`
- `refactor: simplify bootstrap configuration`
- `chore: update editor configuration`
