# Personal Dotfiles

Personal macOS configuration managed by mise bootstrap, with Homebrew retained for the AeroSpace cask.

## Requirements

- macOS on Apple Silicon
- mise
- Homebrew for the AeroSpace cask

## Setup

Trust the repository and preview the declarative bootstrap:

```bash
mise trust
mise bootstrap --dry-run
```

Apply Mise-managed tools, supported GUI casks, and configuration:

```bash
mise bootstrap --yes
```

Inspect convergence and missing resources:

```bash
mise bootstrap plan
mise bootstrap status --missing
mise bootstrap dotfiles status
```

Install or check the remaining Homebrew-managed application separately:

```bash
./setup --brew
./setup --check --brew
```

Mise manages the workstation configuration and the supported Homebrew casks through its native `brew-cask` bootstrap backend. The existing cask installations must be released from Homebrew ownership before applying this migration. AeroSpace remains in `Brewfile` because its custom tap does not publish the API metadata that mise requires. The `setup` helper is only the Homebrew interface for that exception. Pi configuration is managed additively by Mise while authentication, sessions, history, and other user state remain in `~/.pi/agent`.

## Configuration

- `home/` — Mise-managed home configuration, including XDG config, Bash, SSH, local utilities, and Pi configuration
- `mise.toml` — common Mise bootstrap and dotfile declarations
- `mise.laptop.toml` — laptop-specific packages, casks, and application configuration
- `.miserc.toml` — selects the `laptop` environment by default
- `Brewfile` — the AeroSpace cask retained under Homebrew ownership

`home/.config/mise/config.toml` declares global runtimes and portable developer tools. The repository-root `mise.toml` declares common Mise-managed bootstrap resources, and `mise.laptop.toml` declares laptop-specific resources. Project-specific versions belong in each project's own `mise.toml`. Mise owns versioned runtimes, portable binaries, configuration, and supported casks; Homebrew owns only the AeroSpace exception. Avoid declaring the same application in both.

Machine-local settings stay outside the repository. Copy `home/.localrc.example` to `~/.localrc` for shell overrides, `home/.config/git/config.local.example` to `~/.config/git/config.local` for Git identity, and `home/.ssh/config.local.example` to `~/.ssh/config.local` for private SSH hosts. Keep secrets and machine-specific paths out of Git.

## Development

Run the checks before committing:

```bash
bash -n setup
shellcheck setup home/.bashrc home/.bashrc.laptop home/.bash_aliases
mise bootstrap plan
mise bootstrap status --missing
mise bootstrap dotfiles status
./setup --check --brew
git diff --check
```

Use small Conventional Commits.
