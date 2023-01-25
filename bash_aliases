#!/usr/bin/env bash
# Aliases
# =======================
alias ls='ls $LS_OPTIONS'

alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

alias ll="ls -alF"
alias la="ls -A"
alias l="ls -CF"

# Rust related
alias clippy="cargo +stable clippy --all-features -- --deny warnings"
alias clippy-nightly="cargo +nightly clippy --all-features -- --deny warnings"
alias rfmt="rustfmt +nightly --check --config-path ~/Developer/rustfmt.toml"
alias rfmtchanges="rustfmt +nightly --check --config-path ~/Developer/rustfmt.toml \$({ git diff --name-only ; git diff --name-only --staged ; } | sort | uniq)"
alias rfmtfix="rustfmt +nightly --config-path ~/Developer/rustfmt.toml"
alias rfmtfixchanges="rustfmt +nightly --config-path ~/Developer/rustfmt.toml \$({ git diff --name-only ; git diff --name-only --staged ; } | sort | uniq)"

# Git related
alias gr='cd $(git rev-parse --show-toplevel)'
