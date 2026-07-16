# Minimal core. Keep startup side effects out of non-interactive Fish.
status is-interactive; or return
command -q tmux; or return
command -q pi; or return

function pi_tmux_here --description 'Open a collision-resistant tmux session for this cwd'
    set -l leaf (basename (pwd) | string replace -ra '[^A-Za-z0-9_.-]' '_')
    set -l digest (printf '%s' (pwd) | shasum -a 256 | string split ' ' | head -n 1 | string sub -l 10)
    set -l session "pi-$leaf-$digest"
    # Resume flags are intentionally omitted: session selection must remain explicit.
    tmux new-session -A -s "$session" -c (pwd) pi
end
