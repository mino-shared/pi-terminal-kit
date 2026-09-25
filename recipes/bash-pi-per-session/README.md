# bash-pi-per-session

A small Bash `pi()` wrapper that makes [Pi](https://github.com/earendil-works/pi-mono)
behave like Claude Code in a Bash terminal:

- **New terminal = new independent Pi.** Every interactive launch gets its own
  fresh tmux session named after the working directory (`pi-<dir>`, then
  `-2`, `-3`, ... if that name is taken). A second terminal starts a new Pi
  instead of attaching to / mirroring the first.
- **Ctrl+D returns you to a shell.** Pi runs as a child of your shell (no
  `exec`), so exiting Pi drops you back to a prompt rather than closing the
  whole terminal window.
- **Always runs inside tmux**, so pane-spawning extensions like
  [`pi-codrive`](../../packages/pi-codrive) (`/spawn`) can open sibling panes.
- **Pass-through for non-interactive use.** Print mode (`-p` / `--print` /
  `--mode`) and package commands (`install`, `remove`, `update`, `list`,
  `config`, `--version`, `--help`) run directly without tmux.

## Requirements

- Bash
- tmux (optional — without it the wrapper degrades to running Pi directly)
- Pi on your `PATH`

## Install

Source the snippet from your `~/.bashrc`:

```sh
echo 'source /path/to/pi-terminal-kit/recipes/bash-pi-per-session/pi.bash' >> ~/.bashrc
```

Or copy the `pi()` function out of [`pi.bash`](./pi.bash) directly into your
`~/.bashrc`. Then open a new terminal (or `source ~/.bashrc`).

## Verify

```sh
cd ~/some/project
pi                     # opens Pi in tmux session "pi-project"
# Ctrl+D               -> back at a shell prompt, terminal stays open
# open a second terminal, cd to the same dir, run pi
#                      -> new session "pi-project-2", independent of the first
```

Inside an existing tmux session, `pi` just runs Pi directly (it won't nest a
new session).

## Notes

- This is the Bash counterpart to the Fish-based
  [`ghostty-tmux-fish`](../ghostty-tmux-fish) recipe.
- The session name only uses `[A-Za-z0-9_]` from the directory basename; other
  characters become `-`.
