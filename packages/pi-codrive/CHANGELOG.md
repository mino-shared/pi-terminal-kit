# Changelog

## Unreleased

- Subagents now spawn as detached background tmux windows (`tmux new-window -d`) by default instead of splitting the orchestrator's visible pane. Opt back into the old visible-split behavior with `tmux.background: false`.
- Added `/agents`: a selector listing live subagents (status + one-line output preview) that switches full tmux focus to the chosen one via `tmux select-window`.
- Added `/back`: switches tmux focus from inside a subagent session back to the orchestrator's window, via a new `PI_CODRIVE_PARENT_WINDOW` env var passed at spawn time.
- Added `tmux.windowNamePrefix` config option for naming background windows.

## 0.1.1 - 2026-07-16

- Explicitly inherit the parent model and thinking level when configuration values are null.
- Scrub child IPC environment variables so nested Pi processes cannot report to the parent socket.

## 0.1.0 - 2026-07-16

- Initial release candidate with authenticated Unix socket reports, shared tmux panes, report history, waiting widget, and compact completion rendering.
