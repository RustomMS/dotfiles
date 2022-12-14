"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Rustom Shareef
" 2013-01-05
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" General
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
set nocompatible        " Use gVim defaults
filetype off

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Plugins
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
call plug#begin()
" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
Plug 'junegunn/vim-easy-align'

" Plugin outside ~/.vim/plugged with post-update hook
" Not needed since we can just use setup script to update
" Plug 'junegunn/fzf', { 'dir': '~/.local/fzf', 'do': { -> fzf#install() } }
Plug '~/.local/fzf'
Plug 'junegunn/fzf.vim'

Plug 'rust-lang/rust.vim'

" Airline
" Plug 'vim-airline/vim-airline'
" Plug 'vim-airline/vim-airline-themes'

" Inline linter and language server integration
" if v:version >= 800
"     Plug 'dense-analysis/ale'
" endif

" Plugin to display git branch
Plug 'itchyny/vim-gitbranch'

" Plugin to jump language based keywords
if v:version >= 704
    Plug 'andymass/vim-matchup'
endif

" Use release branch (recommend)
Plug 'neoclide/coc.nvim', {'branch': 'release'}
let g:coc_global_extensions = ['coc-rust-analyzer', 'coc-sh']

" Initialize plugin system
call plug#end()

" let g:airline_theme='gruvbox'
let g:gruvbox_contrast_dark = "medium"
let g:gruvbox_bold = 0
let g:rustfmt_autosave = 1

" let g:ale_linters = {'rust': ['analyzer']}

""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" General
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
syntax enable
set history=1000         " # of lines VIM remembers
set showcmd             " show partial cmds
"Allows backspacing over eol or indentation
set backspace=indent,eol,start
set mouse=a             " allow mouse for all modes
"set autochdir           " change directory to current file
set nospell             " turn off spell check
set hidden              "something about bufers

let mapleader=","     " makes <leader> comma

""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" UI
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

set encoding=utf8
set fileencoding=utf-8
set termencoding=utf-8

if has('gui_running')
    set guifont=inconsolata:h10
    set guioptions-=T
    set guioptions-=l
    set guioptions-=L
endif

if exists('+termguicolors')
    let &t_8f = "\<Esc>[38;2;%lu;%lu;%lum"
    let &t_8b = "\<Esc>[48;2;%lu;%lu;%lum"
    set termguicolors
else
    set t_Co=256
endif

syntax enable " Enable syntax highlighting
set background=dark
try
    colorscheme gruvbox
catch /^Vim\%((\a\+)\)\=:E185/
    try
        colorscheme desert
    catch /^Vim\%((\a\+)\)\=:E185/
    endtry
endtry

set background=dark
set ruler               " Show current position
set report=0
" Completion
" Better completion
" menuone: popup even when there's only one match
" noinsert: Do not insert text until a selection is made
" noselect: Do not select, force user to select one from the menu
set completeopt=menuone
if v:version >= 705
    set completeopt+=noinsert
    set completeopt+=noselect
endif
set cmdheight=1         " cmd bar height 1 lines
set laststatus=2        " always display status line
set updatetime=300

" To keep coc sign number always there
" set signnumber=yes
if &diff
    set statusline=%f\ [%{strlen(&fenc)?&fenc:'none'},\ %{&ff}]\ %h%y%r%m%=%c%V,\ %l/%L\ %P
    set diffopt+=iwhite
    set diffopt+=algorithm:patience
    set diffopt+=indent-heuristic
else
    "Display only tail of file path
    set statusline=\|
    set statusline+=\ %t
    set statusline+=%{GitBranch()}
    set statusline+=\ [%{strlen(&fenc)?&fenc:'none'},\ %{&ff}]\ %h%y%r%m
    set statusline+=\ \|
    set statusline+=%=
    set statusline+=\ \|
    set statusline+=\ %{FileSize()}buf:\ %n\ \|\ col:\ %c%V,\ %l/%L\ %P
    set statusline+=\ \|
    if exists('+relativenumber')
        set relativenumber
        nnoremap <leader>nu :set number!<CR>:set relativenumber!<CR>
    else
        nnoremap <leader>nu :set number!<CR>
    endif
    set number           " display line numbers
endif
set showmode            " show current mode
set nostartofline       " When using movement cmds keep cursor at position
set smartcase           " smart about cases during search
set hlsearch            " highlight search results
noh
set ignorecase          " ignores case during search
set showmatch           " shows matching set of brackets
set confirm             " raise dialog during error

" when saving files
"set number              " display line numbers
set cursorline          " shows current line
if exists('+colorcolumn')
    set colorcolumn=80
endif
"set listchars=eol:$,tab:>\ ,trail:.
set listchars=eol:¬,tab:»\ ,trail:·
" No annoying sound on errors
set notitle
set novisualbell
set t_vb=""
set tm=1000
set wildmenu
set wildmode=list:longest
set scrolloff=2
set sidescrolloff=10
set sidescroll=1
"set clipboard=unnamed
"set clipboard^=unnamed,unamedplus
"set ttyfast
set tabpagemax=20

" Sane splits
set splitright
set splitbelow

" Permanent undo
if exists('+undodir')
    if !isdirectory($HOME. "/.vim/undo")
        call mkdir($HOME. "/.vim/undo", "p", 0700)
    endif
    set undodir=~/.vim/undo
    set undofile
endif

" Cscope Setup
"set tags=
if has("cscope")
    "set csprg=
    set cscopetag
    set csto=0
    set cst
    set nocsverb

    " add any database in current directory
    if filereadable("cscope.out")
        cs add cscope.out
    " else add database pointed to by environment
    elseif $CSCOPE_DB != ""
        cs add $CSCOPE_DB
    endif
    set csverb
    set cscopepathcomp=3
    "set cscopequickfix=s-,c-,d-,i-,t-,e-
    " Using 'CTRL-spacebar' (intepreted as CTRL-@ by vim) then a search type
    " makes the vim window split horizontally, with search result displayed in
    " the new window.
    "
    " (Note: earlier versions of vim may not have the :scs command, but it
    " can be simulated roughly via:
    "    nmap <C-@>s <C-W><C-S> :cs find s <C-R>=expand("<cword>")<CR><CR>

    nnoremap <C-@>s :cs find s <C-R>=expand("<cword>")<CR><CR>
    nnoremap <C-@>g :cs find g <C-R>=expand("<cword>")<CR><CR>
    nnoremap <C-@>c :cs find c <C-R>=expand("<cword>")<CR><CR>
    nnoremap <C-@>t :cs find t <C-R>=expand("<cword>")<CR><CR>
    nnoremap <C-@>e :cs find e <C-R>=expand("<cword>")<CR><CR>
    nnoremap <C-@>f :cs find f <C-R>=expand("<cfile>")<CR><CR>
    nnoremap <C-@>i :cs find i ^<C-R>=expand("<cfile>")<CR>$<CR>
    nnoremap <C-@>d :cs find d <C-R>=expand("<cword>")<CR><CR> s
else
    echo "no cscope"
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
set tw=0
set formatoptions=tcrnlq

set ai "Auto indent
set si "Smart indent
set wrap "Wrap lines


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Auto commands
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

" Markdown settings
"au FileType markdown setlocal textwidth=0 formatoptions=aqnlw spell
au FileType markdown setlocal spell
let g:markdown_fenced_languages = ['bash=sh', 'ksh=sh', 'sh', 'c', 'cpp', 'perl', 'vim', 'python', 'diff', 'xml']
let g:markdown_minlines = 500
au CursorHold,CursorHoldI *.md :checktime
au FocusGained,BufEnter *.md :checktime
autocmd BufNewFile,BufRead *.md setlocal filetype=markdown

"Asciidoc settings
"au FileType asciidoc setlocal spell textwidth=0 formatoptions=aqnlw
au FileType asciidoc setlocal spell
au CursorHold,CursorHoldI *.asciidoc *.adoc :checktime
au FocusGained,BufEnter *.asciidoc *.adoc :checktime
autocmd BufNewFile,BufRead *.asciidoc *.adoc setlocal formatoptions=qnl filetype=asciidoc

autocmd BufRead,BufNewFile *.C,*.c,*.cpp,*.h setlocal formatoptions=cljprq  cindent  comments=sr:/*,mb:*,el:*/,:// expandtab
autocmd Filetype python setlocal expandtab tabstop=4 shiftwidth=4 softtabstop=4
autocmd Filetype go setlocal noexpandtab tabstop=4 shiftwidth=4 softtabstop=4
autocmd Filetype gitconfig setlocal noexpandtab tabstop=2 shiftwidth=2 softtabstop=2
let g:markdown_fenced_languages = ['bash=sh', 'ksh=sh', 'sh', 'c', 'cpp', 'perl', 'vim', 'python', 'diff', 'xml']
autocmd InsertEnter * :call <SID>SetupTrailingWhitespaces()
autocmd InsertLeave * :call <SID>StripTrailingWhitespaces()
autocmd CursorMovedI * :call <SID>UpdateTrailingWhitespace()

autocmd BufNewFile,BufRead ~/.cargo/* set nomodifiable

" if has('TextYankPost')
"    augroup ClipboardSync
"       autocmd!
"       autocmd TextYankPost * call CopyYank()
"    augroup END
" endif

" Leave paste mode when leaving insert mode
autocmd InsertLeave * set nopaste

" Rust settings
au Filetype rust set colorcolumn=100

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Mappings
"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" remap ; to : in normal mode
nnoremap ; :
" insert mode make it easy to get to normal
inoremap jk <Esc>
nnoremap <leader>ss :set nolist!<Return>
nnoremap <leader>sc :set nospell!<Return>
nnoremap <silent> <leader><Space> :noh<Return>
" Easy window navigation blah
vnoremap <C-j> <C-w>j
vnoremap <C-k> <C-w>k
vnoremap <C-h> <C-w>h
vnoremap <C-l> <C-w>l
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k

" Open hotkeys
map <C-p> :Files<CR>
nmap <leader>; :Buffers<CR>

" Paste mode toggle
set pastetoggle=<C-T>

" In diff mode move windows with C-h and C-l otherwise move tabs
if &diff
    nnoremap <leader>iw :set diffopt+=iwhite<Return>
    nnoremap <leader>sw :set diffopt-=iwhite<Return>
    nnoremap <C-h> <C-w>h
    nnoremap <C-l> <C-w>l
else
    nnoremap <C-h> gT
    nnoremap <C-l> gt
endif

nnoremap <leader>w :w<Return>
nnoremap <leader>ro :set ro!<Return>
nnoremap <leader>bg :let &background = ( &background == "dark"? "light" : "dark" )<CR>
nnoremap <leader>ex :Ex<CR>
nnoremap <leader>te :Te<CR>
nnoremap <leader>ve :set ve=all<CR>
nnoremap <leader>cve :set ve=<CR>

nnoremap <leader>n :bn<Return>
nnoremap <leader>p :bp<Return>
nnoremap <leader>l :b#<Return>

" up and down can switch buffers
nnoremap <up> :bn<CR>
nnoremap <down> :bp<CR>
" Left and right can switch tabs
nnoremap <left> gT
nnoremap <right> gt

nnoremap <leader>sv :source $HOME/.vimrc<Return>
nnoremap <leader>ev :tabe $HOME/.vimrc<Return>
nnoremap <leader>wp :set wrap!<Return>
nnoremap <leader>sb :set noscb!<Return>
nnoremap <leader>m :set nomodifiable!<Return>
nnoremap <leader>t :tab split<Return>
nnoremap <leader>fd :set foldmethod=syntax<Return>
noremap <silent> <leader>vs :<C-u>let @z=&so<CR>:set so=0 noscb<CR>:set nowrap<CR>:bo vs<CR>Ljzt:setl scb<CR><C-w>p:setl scb<CR>:let &so=@z<CR>
vnoremap <leader>f y/<C-R>"<CR>
vnoremap <leader>ff y/\<<C-R>"\><CR>
noremap <leader>pf :call Yank(expand("%:p"))<CR>
noremap <leader>ph :call Yank(expand("%:h"))<CR>
noremap <leader>pt :call Yank(expand("%:t"))<CR>

" Press <leader>cc to toggle color column
"nnoremap <leader>cc :call <SID>ToggleColorColumn74()<cr>
nnoremap <leader>cc :call <SID>ToggleColorColumn80()<cr>

nnoremap j gj
nnoremap k gk

nnoremap <F3> :tabe $HOME/.vimrc<Return>
nnoremap <F2> :source $HOME/.vimrc<Return>

" lhs comments -- select a range then hit <leader># to insert hash comments
" or <leader>/ for // comments, or <leader>c to clear comments.
noremap <leader># :s/^\s*/&# /<CR> <Esc>:nohlsearch <CR>
noremap <leader>/ :s/^\s*/&\/\/ /<CR> <Esc>:nohlsearch <CR>
noremap <leader>c :s/\(^\s*\)\(\/\/\\|--\\|> \\|[#"%!;]\)\s\?/\1/<CR> <Esc>:nohlsearch<CR>

" wrapping comments -- select a range then hit <leader>* to put  /* */ around
" selection, or <leader>d to clear them
noremap <leader>* :s/^\(.*\)$/\/\* \1 \*\//<CR> <Esc>:nohlsearch<CR>
noremap <leader>d :s/^\([/(]\*\\|<!--\) \(.*\) \(\*[/)]\\|-->\)$/\2/<CR> <Esc>:nohlsearch<CR>

" Delete trailing whitespace
nnoremap <leader>tw :let _s=@/ <Bar> :%s/\s\+$//e <Bar> :let @/=_s <Bar> :nohl <Bar> :unlet _s <CR>

" Yank text and sync to clipboard using OSC 52
noremap <silent> <Leader>y y:<C-U>call Yank(@0)<CR>

""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" MULTIPURPOSE TAB KEY
" Indent if we're at the beginning of a line. Else, do completion.
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
function! InsertTabWrapper()
    let col = col('.') - 1
    if !col || getline('.')[col - 1] !~ '\k'
        return "\<tab>"
    else
        return "\<c-p>"
    endif
endfunction
"inoremap <expr> <tab> InsertTabWrapper()
"inoremap <s-tab> <c-n>

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
" Function Key Mappings
""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
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

"https://stackoverflow.com/a/30549330
function! <SID>SetupTrailingWhitespaces()
    let curline = line('.')
    let b:insert_top = curline
    let b:insert_bottom = curline
endfunction

function! <SID>UpdateTrailingWhitespace()
    let curline = line('.')
    if b:insert_top > curline
        let b:insert_top = curline
    elseif b:insert_bottom < curline
        let b:insert_bottom = curline
    endif
endfunction

function! <SID>StripTrailingWhitespaces()
    let original_cursor = getpos('.')
    exe b:insert_top ',' b:insert_bottom 's/\s\+$//e'
    call setpos('.', original_cursor)
endfunction

" copy to attached terminal using the yank(1) script:
" https://github.com/sunaku/home/blob/master/bin/yank
function! Yank(text) abort
    let escape = system('yank', a:text)
    if v:shell_error
        echoerr escape
    else
        call writefile([escape], '/dev/tty', 'b')
    endif
endfunction

" automatically run yank(1) whenever yanking in Vim
" (this snippet was contributed by Larry Sanderson)
function! CopyYank() abort
    call Yank(join(v:event.regcontents, "\n"))
endfunction

function! FileSize() abort
    let l:bytes = getfsize(expand('%p'))
    if (l:bytes >= 1024)
        let l:kbytes = l:bytes / 1025
    endif
    if (exists('kbytes') && l:kbytes >= 1000)
        let l:mbytes = l:kbytes / 1000
    endif

    if l:bytes <= 0
        return '0'
    endif

    if (exists('mbytes'))
        return l:mbytes . 'MB '
    elseif (exists('kbytes'))
        return l:kbytes . 'KB '
    else
        return l:bytes . 'B '
    endif
endfunction

function! GitBranch() abort
    if exists('gitbranch#name()')
        let l:gbr=gitbranch#name()
    else
        let l:gbr=''
    endif
    if strlen(l:gbr) > 0
        return ' '. '['.l:gbr.']'
    else
        return ''
    endif
endfunction

" Use tab for trigger completion with characters ahead and navigate.
" NOTE: There's always complete item selected by default, you may want to enable
" no select by `"suggest.noselect": true` in your configuration file.
" NOTE: Use command ':verbose imap <tab>' to make sure tab is not mapped by
" other plugin before putting this into your config.
inoremap <silent><expr> <TAB>
            \ coc#pum#visible() ? coc#pum#next(1) :
            \ CheckBackspace() ? "\<Tab>" :
            \ coc#refresh()
inoremap <expr><S-TAB> coc#pum#visible() ? coc#pum#prev(1) : "\<C-h>"

" Make <CR> to accept selected completion item or notify coc.nvim to format
" <C-g>u breaks current undo, please make your own choice.
inoremap <silent><expr> <CR> coc#pum#visible() ? coc#pum#confirm()
            \: "\<C-g>u\<CR>\<c-r>=coc#on_enter()\<CR>"

function! CheckBackspace() abort
    let col = col('.') - 1
    return !col || getline('.')[col - 1]  =~# '\s'
endfunction


" Use `[g` and `]g` to navigate diagnostics
" Use `:CocDiagnostics` to get all diagnostics of current buffer in location list.
nmap <silent> [g <Plug>(coc-diagnostic-prev)
nmap <silent> ]g <Plug>(coc-diagnostic-next)

" GoTo code navigation.
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gy <Plug>(coc-type-definition)
nmap <silent> gi <Plug>(coc-implementation)
nmap <silent> gr <Plug>(coc-references)

" Use K to show documentation in preview window.
nnoremap <silent> K :call ShowDocumentation()<CR>

function! ShowDocumentation()
    if CocAction('hasProvider', 'hover')
        call CocActionAsync('doHover')
    else
        call feedkeys('K', 'in')
    endif
endfunction

" Highlight the symbol and its references when holding the cursor.
autocmd CursorHold * silent call CocActionAsync('highlight')

" Symbol renaming.
nmap <leader>rn <Plug>(coc-rename)

" Formatting selected code.
"xmap <leader>f  <Plug>(coc-format-selected)
nmap <leader>f  <Plug>(coc-format-selected)

augroup mygroup
    autocmd!
    " Setup formatexpr specified filetype(s).
    autocmd FileType typescript,json setl formatexpr=CocAction('formatSelected')
    " Update signature help on jump placeholder.
    autocmd User CocJumpPlaceholder call CocActionAsync('showSignatureHelp')
augroup end

" Applying codeAction to the selected region.
" Example: `<leader>aap` for current paragraph
xmap <leader>a  <Plug>(coc-codeaction-selected)
nmap <leader>a  <Plug>(coc-codeaction-selected)

" Remap keys for applying codeAction to the current buffer.
nmap <leader>ac  <Plug>(coc-codeaction)
" Apply AutoFix to problem on the current line.
nmap <leader>qf  <Plug>(coc-fix-current)

" Run the Code Lens action on the current line.
nmap <leader>cl  <Plug>(coc-codelens-action)

" Map function and class text objects
" NOTE: Requires 'textDocument.documentSymbol' support from the language server.
xmap if <Plug>(coc-funcobj-i)
omap if <Plug>(coc-funcobj-i)
xmap af <Plug>(coc-funcobj-a)
omap af <Plug>(coc-funcobj-a)
xmap ic <Plug>(coc-classobj-i)
omap ic <Plug>(coc-classobj-i)
xmap ac <Plug>(coc-classobj-a)
omap ac <Plug>(coc-classobj-a)

" Remap <C-f> and <C-b> for scroll float windows/popups.
if has('nvim-0.4.0') || has('patch-8.2.0750')
    nnoremap <silent><nowait><expr> <C-f> coc#float#has_scroll() ? coc#float#scroll(1) : "\<C-f>"
    nnoremap <silent><nowait><expr> <C-b> coc#float#has_scroll() ? coc#float#scroll(0) : "\<C-b>"
    inoremap <silent><nowait><expr> <C-f> coc#float#has_scroll() ? "\<c-r>=coc#float#scroll(1)\<cr>" : "\<Right>"
    inoremap <silent><nowait><expr> <C-b> coc#float#has_scroll() ? "\<c-r>=coc#float#scroll(0)\<cr>" : "\<Left>"
    vnoremap <silent><nowait><expr> <C-f> coc#float#has_scroll() ? coc#float#scroll(1) : "\<C-f>"
    vnoremap <silent><nowait><expr> <C-b> coc#float#has_scroll() ? coc#float#scroll(0) : "\<C-b>"
endif

" Use CTRL-S for selections ranges.
" Requires 'textDocument/selectionRange' support of language server.
nmap <silent> <C-s> <Plug>(coc-range-select)
xmap <silent> <C-s> <Plug>(coc-range-select)

" Add `:Format` command to format current buffer.
command! -nargs=0 Format :call CocActionAsync('format')

" Add `:Fold` command to fold current buffer.
command! -nargs=? Fold :call     CocAction('fold', <f-args>)

" Add `:OR` command for organize imports of the current buffer.
command! -nargs=0 OR   :call     CocActionAsync('runCommand', 'editor.action.organizeImport')

" Add (Neo)Vim's native statusline support.
" NOTE: Please see `:h coc-status` for integrations with external plugins that
" provide custom statusline: lightline.vim, vim-airline.
set statusline^=%{coc#status()}%{get(b:,'coc_current_function','')}

" Mappings for CoCList
" Show all diagnostics.
nnoremap <silent><nowait> <space>a  :<C-u>CocList diagnostics<cr>
" Manage extensions.
nnoremap <silent><nowait> <space>e  :<C-u>CocList extensions<cr>
" Show commands.
nnoremap <silent><nowait> <space>c  :<C-u>CocList commands<cr>
" Find symbol of current document.
nnoremap <silent><nowait> <space>o  :<C-u>CocList outline<cr>
" Search workspace symbols.
nnoremap <silent><nowait> <space>s  :<C-u>CocList -I symbols<cr>
" Do default action for next item.
nnoremap <silent><nowait> <space>j  :<C-u>CocNext<CR>
" Do default action for previous item.
nnoremap <silent><nowait> <space>k  :<C-u>CocPrev<CR>
" Resume latest coc list.
nnoremap <silent><nowait> <space>p  :<C-u>CocListResume<CR>

if v:version >= 800
    " Put these lines at the very end of your vimrc file.

    " Load all plugins now.
    " Plugins need to be added to runtimepath before helptags can be generated.
    packloadall
    " Load all of the helptags now, after plugins have been loaded.
    " All messages and errors will be ignored.
    silent! helptags ALL
endif

" ~/.vimrc ends here
