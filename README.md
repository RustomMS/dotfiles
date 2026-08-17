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

Check the Stow and mise configuration without changing files:

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

Setup is repeatable and non-destructive. It previews Stow changes first, backs up conflicting paths with a `.rustom-backup` suffix, then creates the links and installs mise tools. It does not use Stow's `--adopt` mode.

## Configuration

Stow packages are grouped by responsibility:

- `stow/common/` — shell, Git, tmux, Vim, Neovim, SSH, and shared tools
- `stow/macos/` — AeroSpace and terminal applications
- `stow/pi/` — Pi.dev configuration

Configurations use XDG paths where the application supports them, including Git, tmux, Vim, Neovim, Rustfmt, and terminal applications. Native paths remain for Bash, SSH, and Pi.dev where those tools expect them.

`stow/common/.config/mise/config.toml` declares global runtimes. Project-specific versions belong in each project's own `mise.toml`. mise owns versioned development runtimes; Homebrew owns OS-level applications and CLI tools. Avoid declaring the same tool in both.

Homebrew owns the tools and GUI applications listed in `Brewfile`. Herdr and Hunk are Homebrew-managed. Pi.dev remains npm-managed.

Git identity stays machine-local. Copy `gitconfig.local.example` to `~/.gitconfig.local` and fill in your name and email.

## Development

Run the checks before committing:

```bash
bash -n setup
shellcheck setup stow/common/.bashrc stow/common/.bash_aliases
stow --simulate --no-folding --target "$HOME" --dir "$PWD/stow" common macos pi
git diff --check
```

Use small Conventional Commits.
