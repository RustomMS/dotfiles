# Personal Dotfiles

Personal macOS configuration managed with GNU Stow, mise, and Homebrew.

## Requirements

- macOS on Apple Silicon
- GNU Stow
- mise
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

Apply the configuration:

```bash
./setup
```

Setup is repeatable and non-destructive. It previews Stow changes first, warns about conflicts, and stops without moving existing paths. Resolve, remove, or intentionally adopt conflicts yourself, then rerun `./setup`. It does not use Stow's `--adopt` mode automatically.

## Configuration

Stow packages are grouped by responsibility:

- `stow/common/` — shell, Git, tmux, Vim, Neovim, SSH, and shared tools
- `stow/macos/` — AeroSpace and terminal applications
- `stow/pi/` — Pi.dev configuration
- `stow/host-<hostname>/` — optional host-specific files for the current machine

When a matching `stow/host-<hostname>/` package exists, `setup` stows it automatically. Host packages can provide `.bashrc.<hostname>` without competing with the shared `.bashrc`. Keep secrets and private paths in ignored local files instead.

Configurations use XDG paths where the application supports them, including Git, tmux, Vim, Neovim, Rustfmt, and terminal applications. Native paths remain for Bash, SSH, and Pi.dev where those tools expect them.

`stow/common/.config/mise/config.toml` declares global runtimes and portable developer tools. Project-specific versions belong in each project's own `mise.toml`. mise owns versioned runtimes and portable binaries; Homebrew owns macOS applications and CLI tools with native integration. Avoid declaring the same tool in both.

Homebrew owns the macOS tools and GUI applications listed in `Brewfile`. Hunk, Herdr, and delta are mise-managed through Aqua. Pi.dev remains npm-managed.

Machine-local settings stay outside the Stow packages. Copy `localrc.example` to `~/.localrc` for shell overrides, `gitconfig.local.example` to `~/.gitconfig.local` for Git identity, and `sshConfig.local.example` to `~/.ssh/config.local` for private SSH hosts. Keep secrets and machine-specific paths out of Git.

## Development

Run the checks before committing:

```bash
bash -n setup
shellcheck setup stow/common/.bashrc stow/common/.bash_aliases
stow --simulate --no-folding --target "$HOME" --dir "$PWD/stow" common macos pi
git diff --check
```

Use small Conventional Commits.
