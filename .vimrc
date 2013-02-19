"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Rustom Shareef
" 2013-01-05
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" General
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
set nocompatible        " Use gVim defaults
filetype on
filetype off
set rtp+=~/.vim/bundle/vundle/ 
call vundle#rc()

set history=500         " # of lines VIM remembers
set showcmd             " show partial cmds
"Allows backspacing over eol or indentation
set backspace=indent,eol,start
set mouse=a             " allow mouse for all modes
"set autochdir           " change directory to current file
set nospell             " turn off spell check
set hidden              "something about bufers

let mapleader=","     " makes <leader> comma
filetype plugin on
filetype indent on

set encoding=utf8
try
  lang en_US.utf8
catch
endtry

if has("terminfo")
    let &t_Co=256
"    let &t_AB="\<Esc>[%?%p1%{8}%<%t%p1%{40}%+%e%p1%{92}%+%;%dm"
    "let &t_AF="\<Esc>[%?%p1%{8}%<%t%p1%{30}%+%e%p1%{82}%+%;%dm"
else
    let &t_Co=256
"    let &t_Sf="\<Esc>[3%dm"
"    let &t_Sb="\<Esc>[4%dm"
endif

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Bundles from Vundle
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Vundle manager
Bundle 'gmarik/vundle'

" NERDTree a file explorer in Vim
Bundle 'scrooloose/nerdtree'

" Solarized colorscheme
Bundle 'altercation/vim-colors-solarized'

" Powerline - improved status line in vim
Bundle 'Lokaltog/vim-powerline'

" Git Fugitive
Bundle 'tpope/vim-fugitive'

let g:Powerline_symbols='unicode'

" Python IDEish stuff
" Bundle 'klen/python-mode'
" Load run code plugin
" let g:pymode_run = 1

" Key for run python code
" let g:pymode_run_key = '<leader>r'

" Disable pylint checking every save
" let g:pymode_lint_write = 0

" Set key 'R' for run python code
" let g:pymode_run_key = 'R'
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" UI
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
set ruler               " Show current position
set cmdheight=2         " cmd bar height 2 lines
set laststatus=2        " always display status line
"set showmode            " show current mode
set smartcase           " smart about cases during search
set hlsearch            " highlight search results
noh
set ignorecase          " ignores case during search
set showmatch           " shows matching set of brackets
set confirm             " raise dialog during error
                        " when saving files
set number              " display line numbers
set cursorline          " shows current line 
" No annoying sound on errors
set visualbell
set t_vb=""
set tm=1000
set wildmenu
set wildmode=list:longest
set scrolloff=7
set listchars=eol:¬,tab:»\ ,trail:·
" extends:>,precedes:<
syntax enable " Enable syntax highlighting
set background=dark
"colorscheme desert
colorscheme solarized
set ttyfast

if has('gui_running')
  set guifont=inconsolata:h10
  set guioptions-=T
  set guioptions-=l
  set guioptions-=L
endif

set lazyredraw


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Files, backups and undo
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Turn backup off, since most stuff is in SVN, git et.c anyway...
set nobackup
set nowb
set noswapfile

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Text, tab and indent related
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Use spaces instead of tabs
set noexpandtab

" Be smart when using tabs ;)
set smarttab

" 1 tab == 4 spaces
set shiftwidth=8
set tabstop=8
set softtabstop=8

" Linebreak on 500 characters
set lbr
set tw=80
set formatoptions=tcq

set ai "Auto indent
set si "Smart indent
set wrap "Wrap lines
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Mappings
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
inoremap jk <Esc>
nmap <leader>ss :set nolist!<Return>
nmap <leader>sc :set nospell!<Return>
nnoremap <silent> <leader><Space> :noh<Return> 
" Easy window navigation blah
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l
nnoremap ,w :w<Return>

nnoremap ,sv :source $HOME/.vimrc<Return>
nnoremap ,v :tabe $HOME/.vimrc<Return> 

nnoremap ,t :NERDTree<cr>

nnoremap <F3> :tabe $HOME/.vimrc<Return> 
nnoremap <F2> :source $HOME/.vimrc<Return>
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Function Key Mappings
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Set tabstop, softtabstop and shiftwidth to the same value
command! -nargs=* Stab call Stab()
function! Stab()
  let l:tabstop = 1 * input('set tabstop = softtabstop = shiftwidth = ')
  if l:tabstop > 0
    let &l:sts = l:tabstop
    let &l:ts = l:tabstop
    let &l:sw = l:tabstop
  endif
  call SummarizeTabs()
endfunction

function! SummarizeTabs()
  try
    echohl ModeMsg
    echon 'tabstop='.&l:ts
    echon ' shiftwidth='.&l:sw
    echon ' softtabstop='.&l:sts
    if &l:et
      echon ' expandtab'
    else
      echon ' noexpandtab'
    endif
  finally
    echohl None
  endtry
endfunction

