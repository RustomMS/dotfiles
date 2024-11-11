-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

vim.g.mapleader = ','
vim.g.maplocalleader = ','

-- Remap jk to ESC
vim.keymap.set('i', 'jk', "<ESC>", { silent = true })

-- Install package manager
--    https://github.com/folke/lazy.nvim
--    `:help lazy.nvim.txt` for more info
local lazypath = vim.fn.stdpath 'data' .. '/lazy/lazy.nvim'
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system {
    'git',
    'clone',
    '--filter=blob:none',
    'https://github.com/folke/lazy.nvim.git',
    '--branch=stable', -- latest stable release
    lazypath,
  }
end
vim.opt.rtp:prepend(lazypath)

-- Plugins
-- NOTE: Here is where you install your plugins.
--  You can configure plugins using the `config` key.
--
--  You can also configure plugins after the setup call,
--    as they will be available in your neovim runtime.
require('lazy').setup({
  -- Git related plugins
  'tpope/vim-fugitive',
  'tpope/vim-rhubarb',

  -- Detect tabstop and shiftwidth automatically
  'tpope/vim-sleuth',
  'tpope/vim-endwise',
  'tpope/vim-surround',

  -- 'chrisbra/vim-autoread',
  'nvimtools/none-ls.nvim',

  -- NOTE: This is where your plugins related to LSP can be installed.
  --  The configuration is done below. Search for lspconfig to find it below.
  {
    -- LSP Configuration & Plugins
    'neovim/nvim-lspconfig',
    dependencies = {
      -- Automatically install LSPs to stdpath for neovim
      'williamboman/mason.nvim',
      'williamboman/mason-lspconfig.nvim',

      -- Useful status updates for LSP
      -- NOTE: `opts = {}` is the same as calling `require('fidget').setup({})`
      { 'j-hui/fidget.nvim', tag = 'legacy', opts = {} },

      -- Additional lua configuration, makes nvim stuff amazing!
      'folke/neodev.nvim',
    },
  },

  {
    -- Autocompletion
    'hrsh7th/nvim-cmp',
    dependencies = {
      -- Snippet Engine & its associated nvim-cmp source
      'L3MON4D3/LuaSnip',
      'saadparwaiz1/cmp_luasnip',

      -- Adds LSP completion capabilities
      'hrsh7th/cmp-nvim-lsp',
      'hrsh7th/cmp-path',
      'hrsh7th/cmp-buffer',

      -- Adds a number of user-friendly snippets
      'rafamadriz/friendly-snippets',
    },
  },

  -- Useful plugin to show you pending keybinds.
  { 'folke/which-key.nvim',      opts = {} },
  {
    -- Adds git related signs to the gutter, as well as utilities for managing changes
    'lewis6991/gitsigns.nvim',
    opts = {
      -- See `:help gitsigns.txt`
      signs = {
        add = { text = '+' },
        change = { text = '~' },
        delete = { text = '_' },
        topdelete = { text = '‾' },
        changedelete = { text = '~' },
      },
      on_attach = function(bufnr)
        vim.keymap.set('n', '<leader>hp', require('gitsigns').preview_hunk, { buffer = bufnr, desc = 'Preview git hunk' })

        -- don't override the built-in and fugitive keymaps
        local gs = package.loaded.gitsigns
        vim.keymap.set({ 'n', 'v' }, ']c', function()
          if vim.wo.diff then
            return ']c'
          end
          vim.schedule(function()
            gs.next_hunk()
          end)
          return '<Ignore>'
        end, { expr = true, buffer = bufnr, desc = 'Jump to next hunk' })
        vim.keymap.set({ 'n', 'v' }, '[c', function()
          if vim.wo.diff then
            return '[c'
          end
          vim.schedule(function()
            gs.prev_hunk()
          end)
          return '<Ignore>'
        end, { expr = true, buffer = bufnr, desc = 'Jump to previous hunk' })
      end,
    },
  },
  { 'sainnhe/everforest', priority = 1000 },

  { 'rose-pine/neovim', name = 'rose-pine', priority = 1000 },

  { "luisiacc/gruvbox-baby",     priority = 1000 },

  { "gruvbox-community/gruvbox", priority = 1000 },

  {
    -- Theme inspired by Atom
    'navarasu/onedark.nvim',
    priority = 1000,
    config = function()
      vim.cmd.colorscheme 'onedark'
    end,
  },

  { 'kyazdani42/nvim-web-devicons' },

  {
    -- Set lualine as statusline
    'nvim-lualine/lualine.nvim',
    -- See `:help lualine.txt`
    opts = {
      options = {
        icons_enabled = true,
        theme = 'everforest',
        component_separators = '|',
        section_separators = '',
      },
    },
  },

  {
    -- Add indentation guides even on blank lines
    'lukas-reineke/indent-blankline.nvim',
    -- Enable `lukas-reineke/indent-blankline.nvim`
    -- See `:help ibl`
    main = 'ibl',
    opts = {},
  },

  { 'github/copilot.vim' },

  -- "gc" to comment visual regions/lines
  { 'numToStr/Comment.nvim', opts = {} },

  -- Fuzzy Finder (files, lsp, etc)
  {
    'nvim-telescope/telescope.nvim',
    branch = '0.1.x',
    dependencies = {
      'nvim-lua/plenary.nvim',
      -- Fuzzy Finder Algorithm which requires local dependencies to be built.
      -- Only load if `make` is available. Make sure you have the system
      -- requirements installed.
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        -- NOTE: If you are having trouble with this installation,
        --       refer to the README for telescope-fzf-native for more instructions.
        build = 'make',
        cond = function()
          return vim.fn.executable 'make' == 1
        end,
      },
    },
  },

  {
    -- Highlight, edit, and navigate code
    'nvim-treesitter/nvim-treesitter',
    dependencies = {
      'nvim-treesitter/nvim-treesitter-textobjects',
    },
    build = ':TSUpdate',
  },

  -- NOTE: Next Step on Your Neovim Journey: Add/Configure additional "plugins" for kickstart
  --       These are some example plugins that I've included in the kickstart repository.
  --       Uncomment any of the lines below to enable them.
  -- require 'kickstart.plugins.autoformat',
  -- require 'kickstart.plugins.debug',

  -- NOTE: The import below can automatically add your own plugins, configuration, etc from `lua/custom/plugins/*.lua`
  --    You can use this folder to prevent any conflicts with this init.lua if you're interested in keeping
  --    up-to-date with whatever is in the kickstart repo.
  --    Uncomment the following line and add your plugins to `lua/custom/plugins/*.lua` to get going.
  --
  --    For additional information see: https://github.com/folke/lazy.nvim#-structuring-your-plugins
  -- { import = 'custom.plugins' },
}, {})

-- [[ Setting options ]]
-- Disable swap files
vim.opt.swapfile = false
vim.opt.backup = false

-- Appearance
vim.o.background = "dark" -- or "light" for light mode
vim.g.everforest_background = 'soft'
vim.cmd("let g:everforest_background = 'soft'")
vim.cmd.colorscheme('everforest')
vim.opt.colorcolumn = "80,120"
vim.opt.cursorline = true
vim.opt.showmatch = true
-- Scroll off settings
vim.opt.scrolloff = 2
vim.opt.sidescrolloff = 10
vim.opt.sidescroll = 1
-- Use spaces instead of tabs defualt being 4
vim.opt.expandtab = true
vim.opt.shiftwidth = 4
vim.opt.tabstop = 4
vim.opt.softtabstop = 4

-- Ask for confirmation before saving a read-only file or quiting with unsaved changes
vim.opt.confirm = true

-- Set highlight on search
vim.o.hlsearch = true

-- Make line numbers default
vim.wo.number = true
vim.wo.relativenumber = true

-- Enable mouse mode
vim.o.mouse = 'a'

-- Sync clipboard between OS and Neovim.
--  Remove this option if you want your OS clipboard to remain independent.
--  See `:help 'clipboard'`
-- vim.o.clipboard = 'unnamedplus'

-- Enable break indent
vim.o.breakindent = true

-- Save undo history
vim.o.undofile = true

-- Case-insensitive searching UNLESS \C or capital in search
vim.o.ignorecase = true
vim.o.smartcase = true

-- Keep signcolumn on by default
vim.wo.signcolumn = 'yes'

-- Decrease update time
vim.o.updatetime = 250
vim.o.timeoutlen = 300

-- Set completeopt to have a better completion experience
vim.o.completeopt = 'menuone,noselect'

-- Split windows to the right and below
vim.opt.splitright = true
vim.opt.splitbelow = true

-- NOTE: You should make sure your terminal supports this
vim.o.termguicolors = true

-- [[ Basic Keymaps ]]
vim.keymap.set('n', ';', ':')

-- Prevent space from moving a character over
vim.keymap.set({ 'n', 'v' }, '<Space>', '<Nop>', { silent = true })
-- Prevent Q from quitting vim
vim.keymap.set("n", "Q", "<nop>")

-- Remap for dealing with word wrap
vim.keymap.set('n', 'k', "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })
vim.keymap.set('n', 'j', "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
-- Join lines but keep cursor at the same place
vim.keymap.set('n', 'J', 'mzJ`z')
-- When moving or searching keep screen centered
vim.keymap.set('n', '<C-d>', '<C-d>zz')
vim.keymap.set('n', '<C-u>', '<C-u>zz')
vim.keymap.set('n', 'n', 'nzzzv')
vim.keymap.set('n', 'N', 'Nzzzv')

vim.g.netrw_browse_split = 0
vim.g.netrw_banner = 0
vim.g.netrw_winsize = 25

vim.keymap.set('n', '<leader>n', ':bn<Return>', { desc = 'Move to [n]ext buffer' })
vim.keymap.set('n', '<leader>p', ':bp<Return>', { desc = 'Move to [p]revious buffer' })
vim.keymap.set('n', '<leader>l', ':b#<Return>', { desc = 'Move to [l]ast buffer' })

vim.keymap.set('n', '<leader>wv', vim.cmd.Ex, { desc = '[W]orkspace [v]iew' })
-- up and down can switch buffers
vim.keymap.set('n', '<up>', ':bn<Return>')
vim.keymap.set('n', '<down>', ':bp<Return>')
-- left and right can switch tabs
vim.keymap.set('n', '<left>', 'gT')
vim.keymap.set('n', '<right>', ':gt')

-- Not working due to lazy.nvim
-- Quickly source and edit init.lua
-- vim.keymap.set('n', '<leader>sv', ":source $MYVIMRC<Return>", { desc = '[s]ource [v]imrc' })
-- vim.keymap.set('n', '<leader>fv', ":tabe $MYVIMRC<Return>", { desc = '[F]ile edit [v]imrc' })
vim.keymap.set('n', '<leader>ve', ":tabe $MYVIMRC<Return>", { desc = '[V]im: [E]dit vimrc' })
vim.keymap.set('n', '<leader>vs', ":source $MYVIMRC<Return>", { desc = '[V]im: [S]ource vimrc' })
vim.keymap.set('n', '<leader>vp', '"+p"', { desc = '[V]im: [P]aste from clipboard' })
vim.keymap.set('v', '<leader>vc', '"+y"', { desc = '[V]im: [C]opy to clipboard' })


-- File keymaps
vim.keymap.set('n', '<leader>fb', ':let &background = ( &background == "dark"? "light" : "dark" )<Return>', { desc = '[F]ile Toggle [b]ackground color' })
vim.keymap.set('n', '<leader>fd', ':let @+ = expand("%:h")<Return>', { desc = 'yank [f]ile [d]irectory' })
vim.keymap.set('n', '<leader>ff', ':set foldmethod=syntax<Return>', { desc = '[F]ile [F]fold methods' })
vim.keymap.set('n', '<leader>fm', ':set nomodifiable!<Return>', { desc = '[F]ile toggle [m]odifiable state' })
vim.keymap.set('n', '<leader>fn', ':let @+ = expand("%:t")<Return>', { desc = 'yank [f]ile [n]ame' })
vim.keymap.set('n', '<leader>fo', ':set readonly!<Return>', { desc = '[F]ile toggle read-[o]nly state' })
-- Yank current file path/dir/name into system clipboard
vim.keymap.set('n', '<leader>fp', ':let @+ = expand("%:p")<Return>', { desc = 'yank [f]ile [p]ath' })
vim.keymap.set('n', '<leader>fr', [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]], { desc = '[F]ile search and [r]eplace' })
vim.keymap.set('n', '<leader>fs', ":set noscb!<Return>", { desc = '[F]ile toggle [s]croll[b]ind' })
vim.keymap.set('n', '<leader>fw', ':set wrap!<Return>', { desc = '[F]ile toggle [w]rap' })
vim.keymap.set('n', '<leader>fx', '<cmd>!chmod +x %<CR>', { silent = true, desc = 'Set current [f]ile as e[x]ecutable' })

-- Split tab
vim.keymap.set('n', '<leader>t', ':tab split<Return>', { desc = '[t]ab [s]plit' })

-- Search selected text
vim.keymap.set('n', '<leader>sc', ':nohlsearch<Return>', { desc = '[S]earch: [C]lear highlight' })
vim.keymap.set('v', '<leader>sb', 'y/\\<<C-R>"\\><CR>', { desc = '[S]earch [S]election with word boundries' })
vim.keymap.set('v', '<leader>ss', 'y/<C-R>"<CR>', { desc = '[S]earch [S]election' })
vim.keymap.set('v', '<leader>se', 'y/\\<<C-R>"\\><CR>', { desc = '[S]earch [S]election with word boundries' })
vim.keymap.set('n', '<leader>se', ':vimgrep /\\<ERROR\\>\\C/g %<CR>:copen<CR>', { noremap = true, silent = true, desc = '[S]earch for [E]rrors' })


-- Move chunks in visual mode
vim.keymap.set('v', 'J', ":move '>+1<CR>gv=gv")
vim.keymap.set('v', 'K', ":move '<-2<CR>gv=gv")

vim.keymap.set('n', '<leader>cf', vim.lsp.buf.format, { desc = '[C]ode [f]ormat buffer' })
-- Yank/copy into system clipboard
vim.keymap.set({ 'n', 'v' }, '<leader>y', [["+y]], { desc = '[Y]ank into clipboard' })
vim.keymap.set('n', '<leader>Y', [["+Y]], { desc = '[Y]ank into clipboard' })


-- Paste over text without saving to register
vim.keymap.set('x', '<leader>P', [['_dP]], { desc = '[P]aste over' })


-- Yank text and sync to clipboard using OSC 52
-- noremap <silent> <Leader>y y:<C-U>call Yank(@0)<CR>
-- " copy to attached terminal using the yank(1) script:
-- " https://github.com/sunaku/home/blob/master/bin/yank
-- function! Yank(text) abort
--     let escape = system('yank', a:text)
--     if v:shell_error
--         echoerr escape
--     else
--         call writefile([escape], '/dev/tty', 'b')
--     endif
-- endfunction
--
-- " automatically run yank(1) whenever yanking in Vim
-- " (this snippet was contributed by Larry Sanderson)
-- function! CopyYank() abort
--     call Yank(join(v:event.regcontents, "\n"))
-- endfunction

-- Git keymaps
vim.keymap.set('n', '<leader>gs', vim.cmd.Git, { desc = '[g]it [s]tatus' })

-- [[ Highlight on yank ]]
-- See `:help vim.highlight.on_yank()`
local highlight_group = vim.api.nvim_create_augroup('YankHighlight', { clear = true })
vim.api.nvim_create_autocmd('TextYankPost', {
  callback = function()
    vim.highlight.on_yank()
  end,
  group = highlight_group,
  pattern = '*',
})

-- [[ Autocommands ]]
-- Clean up trailing whitespace only on edited lines
-- autocmd InsertEnter * :call <SID>SetupTrailingWhitespaces()
-- autocmd InsertLeave * :call <SID>StripTrailingWhitespaces()
-- autocmd CursorMovedI * :call <SID>UpdateTrailingWhitespace()

vim.api.nvim_create_autocmd(
  { "FileType" },
  { pattern = { "markdown", "gitcommit" },
    callback = function()
      vim.opt_local.spell = true
      vim.keymap.set('v', '<leader>cb', 'c`<C-r>"`<Esc>', { desc = '[C]ode: Surround with [B]ackticks' })
      vim.keymap.set('n', '<leader>cb', 'ciw`<C-r>"`<Esc>', { desc = '[C]ode: Surround with [B]ackticks' })
      vim.keymap.set('v', '<leader>c`', 'c`<C-r>"`<Esc>', { desc = '[C]ode: Surround with [`]:backticks' })
      vim.keymap.set('n', '<leader>c`', 'ciw`<C-r>"`<Esc>', { desc = '[C]ode: Surround with [`]:backticks' })
    end
  }
)
vim.api.nvim_create_autocmd(
  { "FileType" },
  {
    pattern = { "gitconfig" },
    command = "setlocal noexpandtab tabstop=2 shiftwidth=2 softtabstop=2 textwidth=72"
  }
)
vim.api.nvim_create_autocmd(
  { "FileType" },
  {
    pattern = { "sh" },
    command = "setlocal tabstop=2 shiftwidth=2 softtabstop=2"
  }
)
vim.api.nvim_create_autocmd(
  { "FileType" },
  { pattern = { "rust" }, command = "setlocal colorcolumn=100" }
)
vim.api.nvim_create_autocmd(
  "BufEnter",
  {
    pattern = "*.{log,out,err}",
    command = "setlocal nomodifiable readonly"
  }
)

vim.api.nvim_create_autocmd(
  { "BufRead", "BufNewFile" },
  { pattern = { "*.txt", "*.md", "*.tex" }, command = "setlocal spell" }
)

vim.api.nvim_create_autocmd(
  { "BufRead", "BufNewFile" },
  { pattern = { "~/cargo/*" }, command = "setlocal nomodifiable readonly" }
)

vim.api.nvim_create_autocmd(
  { "InsertLeave" },
  { pattern = { "*" }, command = "set nopaste" }
)


-- [[ Configure Telescope ]]
-- See `:help telescope` and `:help telescope.setup()`
require('telescope').setup {
  defaults = {
    mappings = {
      i = {
        ['<C-u>'] = false,
        ['<C-d>'] = false,
      },
    },
  },
}

-- Enable telescope fzf native, if installed
pcall(require('telescope').load_extension, 'fzf')

-- See `:help telescope.builtin`
vim.keymap.set('n', '<leader>?', require('telescope.builtin').oldfiles, { desc = '[?] Find recently opened files' })
vim.keymap.set('n', '<leader><space>', require('telescope.builtin').buffers, { desc = '[ ] Find existing buffers' })
vim.keymap.set('n', '<leader>/', function()
  -- You can pass additional configuration to telescope to change theme, layout, etc.
  require('telescope.builtin').current_buffer_fuzzy_find(require('telescope.themes').get_dropdown {
    winblend = 10,
    previewer = false,
  })
end, { desc = '[/] Fuzzily search in current buffer' })

vim.keymap.set('n', '<leader>gf', require('telescope.builtin').git_files, { desc = 'Search [G]it [F]iles' })
vim.keymap.set('n', '<leader>sf', require('telescope.builtin').find_files, { desc = '[S]earch [F]iles' })
vim.keymap.set('n', '<leader>sh', require('telescope.builtin').help_tags, { desc = '[S]earch [H]elp' })
vim.keymap.set('n', '<leader>sw', require('telescope.builtin').grep_string, { desc = '[S]earch current [W]ord' })
vim.keymap.set('n', '<leader>sg', require('telescope.builtin').live_grep, { desc = '[S]earch by [G]rep' })
vim.keymap.set('n', '<leader>sd', require('telescope.builtin').diagnostics, { desc = '[S]earch [D]iagnostics' })
vim.keymap.set('n', '<leader>sr', require('telescope.builtin').resume, { desc = '[S]earch [R]esume' })

-- [[ Configure Treesitter ]]
-- See `:help nvim-treesitter`
-- Defer Treesitter setup after first render to improve startup time of 'nvim {filename}'
vim.defer_fn(function()
  require('nvim-treesitter.configs').setup {
    -- Add languages to be installed here that you want installed for treesitter
    ensure_installed = { 'c', 'cpp', 'lua', 'python', 'rust', 'vimdoc', 'vim', 'bash'},

    -- Autoinstall languages that are not installed. Defaults to false (but you can change for yourself!)
    auto_install = false,

    highlight = { enable = true },
    indent = { enable = true },
    incremental_selection = {
      enable = true,
      keymaps = {
        init_selection = '<c-space>',
        node_incremental = '<c-space>',
        scope_incremental = '<c-s>',
        node_decremental = '<M-space>',
      },
    },
    textobjects = {
      select = {
        enable = true,
        lookahead = true, -- Automatically jump forward to textobj, similar to targets.vim
        keymaps = {
          -- You can use the capture groups defined in textobjects.scm
          ['aa'] = '@parameter.outer',
          ['ia'] = '@parameter.inner',
          ['af'] = '@function.outer',
          ['if'] = '@function.inner',
          ['ac'] = '@class.outer',
          ['ic'] = '@class.inner',
        },
      },
      move = {
        enable = true,
        set_jumps = true, -- whether to set jumps in the jumplist
        goto_next_start = {
          [']m'] = '@function.outer',
          [']]'] = '@class.outer',
        },
        goto_next_end = {
          [']M'] = '@function.outer',
          [']['] = '@class.outer',
        },
        goto_previous_start = {
          ['[m'] = '@function.outer',
          ['[['] = '@class.outer',
        },
        goto_previous_end = {
          ['[M'] = '@function.outer',
          ['[]'] = '@class.outer',
        },
      },
      swap = {
        enable = true,
        swap_next = {
          ['<leader>a'] = '@parameter.inner',
        },
        swap_previous = {
          ['<leader>A'] = '@parameter.inner',
        },
      },
    },
  }
end, 0)

-- Diagnostic keymaps
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, { desc = 'Go to previous diagnostic message' })
vim.keymap.set('n', ']d', vim.diagnostic.goto_next, { desc = 'Go to next diagnostic message' })
vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float, { desc = 'Open floating diagnostic message' })
vim.keymap.set('n', '<leader>q', vim.diagnostic.setloclist, { desc = 'Open diagnostics list' })

-- [[ Configure LSP ]]
--  This function gets run when an LSP connects to a particular buffer.
local on_attach = function(_, bufnr)
  -- NOTE: Remember that lua is a real programming language, and as such it is possible
  -- to define small helper and utility functions so you don't have to repeat yourself
  -- many times.
  --
  -- In this case, we create a function that lets us more easily define mappings specific
  -- for LSP related items. It sets the mode, buffer and description for us each time.
  local nmap = function(keys, func, desc)
    if desc then
      desc = 'LSP: ' .. desc
    end

    vim.keymap.set('n', keys, func, { buffer = bufnr, desc = desc })
  end

  nmap('<leader>rn', vim.lsp.buf.rename, '[R]e[n]ame')
  nmap('<leader>ca', vim.lsp.buf.code_action, '[C]ode [A]ction')

  nmap('gd', require('telescope.builtin').lsp_definitions, '[G]oto [D]efinition')
  nmap('gr', require('telescope.builtin').lsp_references, '[G]oto [R]eferences')
  nmap('gI', require('telescope.builtin').lsp_implementations, '[G]oto [I]mplementation')
  nmap('gy', require('telescope.builtin').lsp_type_definitions, '[G]oto T[y]pe Definition')
  nmap('<leader>ds', require('telescope.builtin').lsp_document_symbols, '[D]ocument [S]ymbols')
  nmap('<leader>ws', require('telescope.builtin').lsp_dynamic_workspace_symbols, '[W]orkspace [S]ymbols')

  -- See `:help K` for why this keymap
  nmap('K', vim.lsp.buf.hover, 'Hover Documentation')
  nmap('<C-k>', vim.lsp.buf.signature_help, 'Signature Documentation')

  -- Lesser used LSP functionality
  nmap('gD', vim.lsp.buf.declaration, '[G]oto [D]eclaration')
  nmap('<leader>wa', vim.lsp.buf.add_workspace_folder, '[W]orkspace [A]dd Folder')
  nmap('<leader>wr', vim.lsp.buf.remove_workspace_folder, '[W]orkspace [R]emove Folder')
  nmap('<leader>wl', function()
    print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
  end, '[W]orkspace [L]ist Folders')

  -- Create a command `:Format` local to the LSP buffer
  vim.api.nvim_buf_create_user_command(bufnr, 'Format', function(_)
    vim.lsp.buf.format()
  end, { desc = 'Format current buffer with LSP' })
end

-- document existing key chains
local wk = require('which-key')

wk.add({
    { "<leader>c", group = "[C]ode" },
    { "<leader>d", group = "[D]ocument" },
    { "<leader>f", group = "[F]ile" },
    { "<leader>g", group = "[G]it" },
    { "<leader>h", group = "More git" },
    { "<leader>r", group = "[R]ename" },
    { "<leader>s", group = "[S]earch" },
    { "<leader>w", group = "[W]orkspace" },
})

-- mason-lspconfig requires that these setup functions are called in this order
-- before setting up the servers.
require('mason').setup()
require('mason-lspconfig').setup()

-- Enable the following language servers
local servers = {
  -- clangd = {},
  -- gopls = {},
  -- pyright = {},
  -- rust_analyzer = {},
  -- tsserver = {},
  -- html = { filetypes = { 'html', 'twig', 'hbs'} },

  lua_ls = {
    Lua = {
      workspace = { checkThirdParty = false },
      telemetry = { enable = false },
    },
  },
}

-- Setup neovim lua configuration
require('neodev').setup()

-- nvim-cmp supports additional completion capabilities, so broadcast that to servers
local capabilities = vim.lsp.protocol.make_client_capabilities()
capabilities = require('cmp_nvim_lsp').default_capabilities(capabilities)

-- Ensure the servers above are installed
local mason_lspconfig = require 'mason-lspconfig'

mason_lspconfig.setup {
  ensure_installed = vim.tbl_keys(servers),
}

mason_lspconfig.setup_handlers {
  function(server_name)
    require('lspconfig')[server_name].setup {
      capabilities = capabilities,
      on_attach = on_attach,
      settings = servers[server_name],
      filetypes = (servers[server_name] or {}).filetypes,
    }
  end,
}

-- [[ Configure nvim-cmp ]]
-- See `:help cmp`
local cmp = require 'cmp'
local luasnip = require 'luasnip'
require('luasnip.loaders.from_vscode').lazy_load()
luasnip.config.setup {}

cmp.setup {
  snippet = {
    expand = function(args)
      luasnip.lsp_expand(args.body)
    end,
  },
  mapping = cmp.mapping.preset.insert {
    ['<C-n>'] = cmp.mapping.select_next_item(),
    ['<C-p>'] = cmp.mapping.select_prev_item(),
    ['<C-d>'] = cmp.mapping.scroll_docs(-4),
    ['<C-f>'] = cmp.mapping.scroll_docs(4),
    ['<C-Space>'] = cmp.mapping.complete {},
    ['<CR>'] = cmp.mapping.confirm {
      behavior = cmp.ConfirmBehavior.Replace,
      select = true,
    },
    ['<Tab>'] = cmp.mapping(function(fallback)
      if cmp.visible() then
        cmp.select_next_item()
      elseif luasnip.expand_or_locally_jumpable() then
        luasnip.expand_or_jump()
      else
        fallback()
      end
    end, { 'i', 's' }),
    ['<S-Tab>'] = cmp.mapping(function(fallback)
      if cmp.visible() then
        cmp.select_prev_item()
      elseif luasnip.locally_jumpable(-1) then
        luasnip.jump(-1)
      else
        fallback()
      end
    end, { 'i', 's' }),
  },
  sources = {
    { name = 'nvim_lsp' },
    { name = 'luasnip' },
    { name = 'path' },
    { name = 'buffer' },
  },
}

-- Configure null-ls
local null_ls = require("null-ls")

null_ls.setup({
  sources = {
    null_ls.builtins.diagnostics.sqlfluff.with({
      extra_args = { "--dialect", "trino" },
    }),
    null_ls.builtins.formatting.sqlfluff.with({
      extra_args = { "--dialect", "trino" },
    }),
  },
})

-- The line beneath this is called `modeline`. See `:help modeline`
-- vim: ts=2 sts=2 sw=2 et
