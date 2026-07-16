# Ghostty + tmux + Fish recipe

Copy only the minimal snippets you need. Back up existing configuration and reload each program separately. The optional Isaac preset is intentionally opinionated.

## Minimal core

### Ghostty

Append [`ghostty.conf`](./ghostty.conf) to `~/.config/ghostty/config`. Plain clicks are reported to tmux. Hold Shift while dragging, then press Cmd+C, to select and copy terminal text. Use Cmd+Shift+click for detected links. Link behavior still depends on macOS and Ghostty detection, so do not rely on it for destructive actions.

### tmux

Append [`tmux.conf`](./tmux.conf) to `~/.tmux.conf`, then run `tmux source-file ~/.tmux.conf`. It enables CSI-u extended keys, passes Ctrl+S explicitly, keeps the existing tmux prefix, enables mouse input, and colors ORCHESTRATOR, SUBAGENT, and SHELL panes through pi-codrive's configurable `@pi_codrive_role` option.

### Fish

Source [`config.fish`](./config.fish) from Fish. It resolves executables through `PATH`, guards non-interactive shells, and creates collision-resistant cwd-based session names. It never uses `--continue`; resuming the wrong Pi session silently is unsafe.

## Optional Isaac preset

[`isaac-preset.conf`](./isaac-preset.conf) contains denser visuals and shortcuts. Review every binding before use. It is not required by any package.
