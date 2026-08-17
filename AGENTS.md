# Personal Dotfiles

This repository contains Rustom's personal macOS configuration.

## Current setup

- `./setup` is the installation entry point.
- GNU Stow creates links from the repository's `stow/` packages into the home directory.
- It preserves conflicting existing paths by renaming them with a `.rustom-backup` suffix.
- mise installs the declared language runtimes and project tools.
- Homebrew installs the tools and GUI applications listed in `Brewfile`.
- Configuration stays in each tool's native format.

Inspect `./setup` before changing its behaviour. It changes the live home directory and has no dry-run mode.

## Environment

The primary machine uses:

- Account: `rustom`
- Home: `/Users/rustom`
- Platform: `aarch64-darwin`

Keep personal Git identity in ignored, machine-local configuration rather than tracked files.

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
- Do not use Stow's `--adopt` option by default.

## Validation

Validate the behaviour affected by the change:

- Run `git diff --check`.
- Run `bash -n` on changed shell scripts.
- Run ShellCheck on changed shell scripts when available.
- Run `stow --simulate` for changed Stow packages.
- Run the affected tool's checks when available.
- Confirm setup changes preserve existing paths as documented.

Do not claim behaviour was tested unless the corresponding command was run successfully.

## Commits

Use small, focused Conventional Commits, for example:

- `docs: update repository instructions`
- `feat: add shell aliases`
- `refactor: simplify setup links`
- `chore: update editor configuration`
