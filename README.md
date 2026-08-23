# Personal Dotfiles

Personal macOS configuration managed by mise bootstrap, with Homebrew for GUI applications.

## Requirements

- macOS on Apple Silicon
- mise
- Homebrew for GUI applications

## Setup

Trust the repository and preview the declarative bootstrap:

```bash
mise trust
mise bootstrap --dry-run
```

Apply Mise-managed tools, packages, and configuration:

```bash
mise bootstrap --yes
```

Inspect convergence and missing resources:

```bash
mise bootstrap plan
mise bootstrap status --missing
mise bootstrap dotfiles status
```

Install or check the Homebrew-managed GUI applications separately:

```bash
./setup --brew
./setup --check --brew
```

Mise manages the workstation configuration. The small `setup` helper remains only for the GUI casks intentionally retained in `Brewfile`; it does not manage dotfiles or tools. Pi configuration is managed additively by Mise while authentication, sessions, history, and other user state remain in `~/.pi/agent`.

## Configuration

- `home/` — Mise-managed home configuration, including XDG config, Bash, SSH, local utilities, and Pi configuration
- `mise.toml` — common Mise bootstrap and dotfile declarations
- `mise.laptop.toml` — laptop-specific packages and application configuration
- `.miserc.toml` — selects the `laptop` environment by default
- `Brewfile` — GUI casks retained under Homebrew ownership

`home/.config/mise/config.toml` declares global runtimes and portable developer tools. The repository-root `mise.toml` declares common Mise-managed bootstrap resources, and `mise.laptop.toml` declares laptop-specific resources. Project-specific versions belong in each project's own `mise.toml`. Mise owns versioned runtimes, portable binaries, and configuration; Homebrew owns the GUI casks listed in `Brewfile`. Avoid declaring the same tool in both.

Machine-local settings stay outside the repository. Copy `localrc.example` to `~/.localrc` for shell overrides, `gitconfig.local.example` to `~/.gitconfig.local` for Git identity, and `sshConfig.local.example` to `~/.ssh/config.local` for private SSH hosts. Keep secrets and machine-specific paths out of Git.

## Development

Run the checks before committing:

```bash
bash -n setup
shellcheck setup home/.bashrc home/.bashrc.laptop home/.bash_aliases
mise bootstrap plan
mise bootstrap status --missing
mise bootstrap dotfiles status
git diff --check
```

Use small Conventional Commits.
