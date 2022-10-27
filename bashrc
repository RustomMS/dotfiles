#!/usr/bin/env bash
# rustom's bashrc

function nonzero_return
{
   RETVAL=$?
   [ $RETVAL -ne 0 ] && echo " [0;31;7m$RETVAL"
}

function color_my_prompt
{
   # Some things should be done only in interactive shells.
   if [[ "$-" = *i* ]]; then
      local __nonzero_return='`nonzero_return`'
      local __user_and_host="\[\033[0;32m\]\u@\h"
      local __cur_location="\[\033[0;34m\]\w"
      local __git_branch_color="\[\033[0;31m\]"
      #local __git_branch="\`ruby -e \"print (%x{git branch 2> /dev/null}.grep(/^\*/).first || '').gsub(/^\* (.+)$/, '(\1) ')\"\`"
#      local __git_branch='`git branch 2> /dev/null | grep -e ^* | sed -E  s/^\\\\\*\ \(.+\)$/\(\\\\\1\)\ /`'
      local __git_branch='`git branch 2>/dev/null | grep "^*" | colrm 1 2`'
      local __prompt_tail="\[\033[0;32m\]$"
      local __last_color="\[\033[00m\]"

      export PS1="$__user_and_host $__cur_location$__nonzero_return$__git_branch_color $__git_branch\n$__prompt_tail$__last_color "
   fi
}
color_my_prompt

# Misc
export EDITOR=vim

if  [[ -d $HOME/dotfiles/bin ]]; then
   export PATH="$PATH:$HOME/dotfiles/bin"
fi

if  [[ -d $HOME/local/bin ]]; then
   export PATH="$PATH:$HOME/local/bin"
fi

if  [[ -f $HOME/.aliases ]]; then
   . "$HOME/.aliases"
fi

if  [[ -f $HOME/dotfiles/bashrc.$HOSTNAME ]]; then
   . "$HOME/dotfiles/bashrc.$HOSTNAME"
fi

if  [[ -f $HOME/.localrc ]]; then
   . "$HOME/.localrc"
fi

if [ -f ~/.bash_aliases ]; then
    . "$HOME/.bash_aliases"
fi

if  [[ -f "$HOME/.cargo/env" ]]; then
    . "$HOME/.cargo/env"
fi

if [[ "$-" = *i* ]]; then
   #export TERM=xterm
   #export TERM=xterm-256color
   #export TERM=screen-256color

   # History settings
   export HISTTIMEFORMAT="%y-%m-%d %T "
   export HISTCONTROL=ignoredups
   export HISTSIZE=100000
   export HISTFILESIZE=100000
   export HISTIGNORE="&:[ ]*:exit:ls:bg:fg:history:clear"
   shopt -s autocd
   shopt -s cdspell
   shopt -s checkjobs
   shopt -s checkwinsize
   shopt -s cmdhist
   shopt -s dirspell
   shopt -s dotglob
   shopt -s extglob
   shopt -s globstar
   shopt -s histappend

   export PROMPT_COMMAND="history -a; history -c; history -r; $PROMPT_COMMAND"

   # use github.com/rupa/z for directory history and quick access
   . "$HOME/local/z/z.sh"

   # Setup fzf for fuzzy seraching and auto complete
   [ -f ~/.fzf.bash ] && source ~/.fzf.bash

   # ls settings
   [ -f ~/dotfiles/dircolors.wsl ] && eval "$(dircolors ~/dotfiles/dircolors.wsl)"
   export LS_OPTIONS="--color=auto -F"
   export BLOCK_SIZE=human-readable

   # Less Settings
   #export LESS='--quit-if-one-screen --ignore-case --LONG-PROMPT --RAW-CONTROL-CHARS --tabs=4 --no-init --window=-4'
   export LESS='--ignore-case --LONG-PROMPT --RAW-CONTROL-CHARS --tabs=4 --window=-4'

   # Have less display colours
   export LESS_TERMCAP_mb=$(tput bold; tput setaf 2) # green
   export LESS_TERMCAP_md=$(tput bold; tput setaf 4) # blue
   export LESS_TERMCAP_me=$(tput sgr0)
   export LESS_TERMCAP_so=$(tput bold; tput setaf 3) # yellow
   export LESS_TERMCAP_se=$(tput rmso; tput sgr0)
   export LESS_TERMCAP_us=$(tput smul; tput bold; tput setaf 7) # white
   export LESS_TERMCAP_ue=$(tput rmul; tput sgr0)
   export LESS_TERMCAP_mr=$(tput rev)
   export LESS_TERMCAP_mh=$(tput dim)
   export LESS_TERMCAP_ZN=$(tput ssubm)
   export LESS_TERMCAP_ZV=$(tput rsubm)
   export LESS_TERMCAP_ZO=$(tput ssupm)
   export LESS_TERMCAP_ZW=$(tput rsupm)
   export GROFF_NO_SGR=1         # For Konsole and Gnome-terminal
fi
