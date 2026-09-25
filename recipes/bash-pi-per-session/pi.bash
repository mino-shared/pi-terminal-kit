# pi-per-session: Bash wrapper for Pi
# --------------------------------------------------------------------------
# Makes Pi behave Claude-Code-like in Bash:
#
#   * Each new terminal launches its OWN fresh, independent Pi in its own tmux
#     session. Opening a second terminal starts a new Pi instead of mirroring
#     into (attaching to) the existing one. The session name is derived from
#     the current directory, with a numeric suffix (-2, -3, ...) when that
#     name is already taken, so instances never collide.
#
#   * Ctrl+D exits Pi back to a SHELL PROMPT, not closing the whole terminal.
#     We deliberately do NOT `exec` tmux: Pi runs as a child of this shell, so
#     leaving Pi drops you back to the shell instead of killing the window.
#
#   * Pi always runs inside tmux, so pane-spawning extensions (e.g. pi-codrive
#     /spawn) can open sibling panes.
#
# Non-interactive invocations (print mode, package management, --help, etc.)
# are passed straight through untouched -- they exit on their own and don't
# need a persistent tmux pane.
#
# Install: source this file from your ~/.bashrc, e.g.
#     source /path/to/pi-per-session/pi.bash
# or paste the function below directly into ~/.bashrc. Then open a new terminal.

pi() {
	# Package/management subcommands: run directly, no tmux.
	case "$1" in
		install | remove | uninstall | update | list | config | --version | -v | --help | -h)
			command pi "$@"
			return
			;;
	esac

	# Non-interactive / print mode: run directly, no tmux.
	case " $* " in
		*" -p "* | *" --print "* | *" --mode "*)
			command pi "$@"
			return
			;;
	esac

	# Already inside tmux? Don't nest a session -- just run Pi.
	if [ -n "$TMUX" ]; then
		command pi "$@"
		return
	fi

	# No tmux available? Degrade gracefully to a plain Pi.
	if ! command -v tmux >/dev/null 2>&1; then
		command pi "$@"
		return
	fi

	# Fresh, uniquely-named tmux session derived from the current directory.
	local base session esc_args n
	base="pi-$(basename "$PWD" | tr -c 'a-zA-Z0-9_' '-')"
	session="$base"
	n=2
	while tmux has-session -t "$session" 2>/dev/null; do
		session="$base-$n"
		n=$((n + 1))
	done

	# Quote args safely, then run Pi as a child (no exec) so Ctrl+D -> shell.
	printf -v esc_args '%q ' "$@"
	tmux new-session -s "$session" "command pi $esc_args"
}
