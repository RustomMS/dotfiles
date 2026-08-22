# Personal Dotfiles

Personal macOS configuration migrating from GNU Stow to mise bootstrap, with Homebrew.

## Requirements

- macOS on Apple Silicon
- GNU Stow for the remaining configuration
- mise for migrated configuration and tools
- Homebrew

## Setup

Install the tools and GUI applications declared in `Brewfile`:

```bash
./setup --brew
```

Check Stow conflicts and validate the mise configuration without changing files:

```bash
./setup --check
```

Check the Homebrew bundle without installing or updating anything:

```bash
./setup --check --brew
```

Apply the remaining Stow-managed configuration:

```bash
./setup
```

Inspect the migrated Mise-managed configuration:

```bash
mise bootstrap dotfiles status
```

The repository is migrating incrementally from Stow to Mise. Mise now manages the migrated configuration listed below; the remaining configuration still uses `./setup`. Setup is repeatable and non-destructive. It previews Stow changes first, warns about conflicts, and stops without moving existing paths. Resolve, remove, or intentionally adopt conflicts yourself, then rerun `./setup`. It does not use Stow's `--adopt` mode automatically. Pi configuration is managed additively by Mise while authentication, sessions, history, and other user state remain in `~/.pi/agent`.

## Configuration

Stow packages are grouped by responsibility:

- `home/` — Mise-managed home configuration, including XDG config, Bash, SSH, local utilities, and Pi configuration
- `stow/common/` — remaining shared configuration, currently aliases, Mise's global tool config, and macOS-independent leftovers
- `stow/macos/` — remaining AeroSpace and terminal application configuration
- `stow/host-<hostname>/` — optional host-specific files for the current machine

Named Mise environments own machine-specific resources; the current environment is `laptop`. Keep secrets and private paths in ignored local files instead.

Configurations use XDG paths where the application supports them, including Git, tmux, Vim, Neovim, Rustfmt, and terminal applications. Native paths remain for Bash, SSH, and Pi.dev where those tools expect them.

`stow/common/.config/mise/config.toml` declares global runtimes and portable developer tools. The repository-root `mise.toml` declares Mise-managed bootstrap resources, and `mise.laptop.toml` declares laptop-specific resources. Project-specific versions belong in each project's own `mise.toml`. mise owns versioned runtimes, portable binaries, and migrated configuration; Homebrew owns macOS applications and GUI casks. Avoid declaring the same tool in both.

Homebrew owns the macOS tools and GUI applications listed in `Brewfile`. Hunk, Herdr, and delta are mise-managed through Aqua. Pi.dev remains npm-managed.

Machine-local settings stay outside the Stow packages. Copy `localrc.example` to `~/.localrc` for shell overrides, `gitconfig.local.example` to `~/.gitconfig.local` for Git identity, and `sshConfig.local.example` to `~/.ssh/config.local` for private SSH hosts. Keep secrets and machine-specific paths out of Git.

## Development

Run the checks before committing:

```bash
bash -n setup
shellcheck setup home/.bashrc home/.bashrc.laptop stow/common/.bash_aliases
stow --simulate --no-folding --target "$HOME" --dir "$PWD/stow" common macos
git diff --check
```

Use small Conventional Commits.
