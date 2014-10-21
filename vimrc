"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Rustom Shareef
" 2013-01-05
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" General
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
set nocompatible        " Use gVim defaults
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Bundles from Vundle
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Vundle manager
Plugin 'gmarik/vundle' 
" NERDTree a file explorer in Vim
Plugin 'scrooloose/nerdtree'

" Solarized colorscheme
Plugin 'altercation/vim-colors-solarized'
let g:solarized_termcolors = 16
let g:solarized_contrast  =   "high"
let g:solarized_visibility=   "high"
"g:solarized_termtrans =   1
"g:solarized_degrade   =   0       |   1
let g:solarized_hitrail = 1

" Powerline - improved status line in vim
Plugin 'Lokaltog/vim-powerline'

"let g:Powerline_symbols='fancy'

" Git Fugitive
Plugin 'tpope/vim-fugitive'

" LaTeX
Plugin 'git://git.code.sf.net/p/vim-latex/vim-latex.git'
set grepprg=grep\ -nH\ $*
let g:tex_flavor='latex'


" Python IDEish stuff
" Plugin 'klen/python-mode'
" Load run code plugin
" let g:pymode_run = 1

" Key for run python code
" let g:pymode_run_key = '<leader>r'

" Disable pylint checking every save
" let g:pymode_lint_write = 0

" Set key 'R' for run python code
" let g:pymode_run_key = 'R'

call vundle#end()
filetype plugin on
filetype indent on
filetype on

""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" UI
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

set history=500         " # of lines VIM remembers
set showcmd             " show partial cmds
"Allows backspacing over eol or indentation
set backspace=indent,eol,start
set mouse=a             " allow mouse for all modes
"set autochdir           " change directory to current file
set nospell             " turn off spell check
set hidden              "something about bufers

let mapleader=","     " makes <leader> comma

set encoding=utf8
"let &t_Co=16
let &t_Co=256
"try
"  lang en_US.utf8
"catch
"endtry

"if has("terminfo")
"    let &t_Co=256
"    let &t_AB="\<Esc>[%?%p1%{8}%<%t%p1%{40}%+%e%p1%{92}%+%;%dm"
"    let &t_AF="\<Esc>[%?%p1%{8}%<%t%p1%{30}%+%e%p1%{82}%+%;%dm"
"else
"    let &t_Co=256
"    let &t_Sf="\<Esc>[3%dm"
"    let &t_Sb="\<Esc>[4%dm"
"endif

syntax enable " Enable syntax highlighting
set background=dark
"colorscheme desert
colorscheme solarized
set ruler               " Show current position
set cmdheight=1         " cmd bar height 2 lines
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
"set listchars=eol:$,tab:>\ ,trail:.
set listchars=eol:¬,tab:»\ ,trail:·
" No annoying sound on errors
set notitle
set novisualbell
set t_vb=""
set tm=1000
set wildmenu
set wildmode=list:longest
set scrolloff=7
set sidescrolloff=15
set sidescroll=1
set clipboard=unnamed
"set ttyfast

if has('gui_running')
  set guifont=inconsolata:h10
  set guioptions-=T
  set guioptions-=l
  set guioptions-=L
endif

"set lazyredraw
au BufNewFile,BufRead *.hbs set filetype=html

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
set expandtab

" Be smart when using tabs ;)
set smarttab

" 1 tab == 4 spaces
set shiftwidth=4
set tabstop=4
set softtabstop=4

" Linebreak on 500 characters
"set lbr
""set tw=120
set formatoptions=tcq

set ai "Auto indent
set si "Smart indent
set wrap "Wrap lines
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Mappings
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
inoremap jk <Esc>
nnoremap <leader>ss :set nolist!<Return>
nnoremap <leader>sc :set nospell!<Return>
nnoremap <silent> <leader><Space> :noh<Return>
" Easy window navigation blah
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l
nnoremap <leader>w :w<Return>
nnoremap <leader>ro :set ro!<Return>

nnoremap <leader>n :bn<Return>
nnoremap <leader>p :bp<Return>

nnoremap <leader>sv :source $HOME/.vimrc<Return>
nnoremap <leader>ev :tabe $HOME/.vimrc<Return>
nnoremap <leader>wp :set wrap!<Return>
nnoremap <leader>sb :set noscb!<Return>
nnoremap <leader>m :set nomodifiable!<Return>

nnoremap <leader>t :NERDTree<cr>
nnoremap j gj
nnoremap k gk

nnoremap <F3> :tabe $HOME/.vimrc<Return>
nnoremap <F2> :source $HOME/.vimrc<Return>
" lhs comments -- select a range then hit <leader># to insert hash comments
" or <leader>/ for // comments, or <leader>c to clear comments.
noremap <leader># :s/^/#/<CR> <Esc>:nohlsearch <CR>
noremap <leader>/ :s/^/\/\//<CR> <Esc>:nohlsearch <CR>
noremap <leader>c :s/^\/\/\\|^--\\|^> \\|^[#"%!;]//<CR> <Esc>:nohlsearch<CR>

" wrapping comments -- select a range then hit <leader>* to put  /* */ around
" selection, or <leader>d to clear them
noremap <leader>* :s/^\(.*\)$/\/\* \1 \*\//<CR> <Esc>:nohlsearch<CR>
noremap <leader>d :s/^\([/(]\*\\|<!--\) \(.*\) \(\*[/)]\\|-->\)$/\2/<CR> <Esc>:nohlsearch<CR>
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

