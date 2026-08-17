-- wezterm.lua

local wezterm = require 'wezterm'
local config = wezterm.config_builder()

config.color_scheme = 'Everforest Dark (Gogh)'
config.font_size = 14
config.font = wezterm.font("FiraCode Nerd Font Mono", { weight = "Regular" })
config.initial_cols = 160
config.initial_rows = 48
config.window_decorations = 'RESIZE'
config.window_frame = {
  font = wezterm.font({ family = 'FiraCode Nerd Font Mono', weight = 'Regular' }),
  font_size = 12,
}
config.prefer_to_spawn_tabs = true
config.enable_scroll_bar = true
config.scrollback_lines = 3500

config.audible_bell = "SystemBeep"
config.visual_bell = {
  fade_in_duration_ms = 150,
  fade_out_duration_ms = 150,
  fade_in_function = 'EaseIn',
  fade_out_function = 'EaseOut',
  target = 'BackgroundColor',
}
config.colors = {
  visual_bell = '#202020',
}

wezterm.on('update-status', function(window)
  local solidLeftArrow = utf8.char(0xe0b2)
  local colorScheme = window:effective_config().resolved_palette
  local background = colorScheme.background
  local foreground = colorScheme.foreground

  window:set_right_status(wezterm.format({
    { Background = { Color = 'none' } },
    { Foreground = { Color = background } },
    { Text = solidLeftArrow },
    { Background = { Color = background } },
    { Foreground = { Color = foreground } },
    { Text = ' ' .. wezterm.hostname() .. ' ' },
  }))

  local paneTitle = window.active_tab.active_pane.title
  local windowTitle = wezterm.hostname()
  local filename = string.match(paneTitle, '([^/\\]+)$')

  if filename then
    filename = string.gsub(filename, ' %(.+%)', '')
    filename = string.gsub(filename, '^NVIM: ', '')
    if filename ~= 'zsh' and filename ~= 'bash' and filename ~= 'fish' then
      windowTitle = filename
    end
  elseif paneTitle ~= 'zsh' and paneTitle ~= 'bash' and paneTitle ~= 'fish' then
    windowTitle = paneTitle
  end

  window:set_title(windowTitle)
end)

return config
