# Personal Dotfiles

This repository contains Rustom's personal macOS configuration.

## Current setup

Mise is the installation entry point for Apple Silicon macOS:

- `mise bootstrap --dry-run` previews tools, packages, casks, and configuration without changing the live home directory.
- `mise bootstrap --yes` applies the declarative workstation configuration.
- `mise bootstrap status --missing` checks whether declared resources converge.
- `./setup --brew` installs the AeroSpace cask retained in `Brewfile`.
- `./setup --check --brew` checks that Homebrew exception without installing it.

Mise manages the repository's tools, dotfiles, shell configuration, host-specific laptop environment, Pi configuration, and supported Homebrew casks through its native `brew-cask` backend. Existing casks must be released from Homebrew ownership before applying this migration; review the dry run rather than allowing two managers to own an app. AeroSpace remains Homebrew-managed because its custom tap does not publish the API metadata required by mise. The `setup` helper is only the Homebrew interface for that exception.

Configuration sources live under `home/` and use each tool's native format. `mise.toml` contains common bootstrap declarations; `mise.laptop.toml` contains laptop-specific declarations; `.miserc.toml` selects the laptop environment by default; and `home/.config/mise/config.toml` contains global workstation tools.

Inspect `setup` before changing its behaviour. Keep personal Git identity, private SSH hosts, secrets, and machine-local shell settings in the local example files beside their expected targets: `home/.config/git/config.local.example`, `home/.ssh/config.local.example`, and `home/.localrc.example`.

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
- Use Mise's conflict-safe package and dotfile behavior; review `--dry-run` before an explicit force operation.
- Do not let Homebrew and Mise own the same cask. Release Homebrew ownership deliberately before migrating a cask.

## Validation

Validate the behaviour affected by the change:

- Always run `git diff --check`.
- For shell changes, run `bash -n` and ShellCheck when available.
- For Mise configuration changes, run `mise bootstrap plan`, `mise bootstrap status --missing`, and the affected tool's native checks.
- For Homebrew exception changes, run `./setup --check --brew`.
- Confirm unmanaged local files, application data, and Pi state remain untouched when changing mappings.

Do not claim behaviour was tested unless the corresponding command was run successfully.

## Commits

Use small, focused Conventional Commits, for example:

- `docs: update repository instructions`
- `feat: add shell aliases`
- `refactor: simplify bootstrap configuration`
- `chore: update editor configuration`
