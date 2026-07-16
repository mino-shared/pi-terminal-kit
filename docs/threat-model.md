# Threat model

## pi-codrive

The trust boundary is the local Unix user. Pi extensions already execute with that user's permissions. Co-drive prevents accidental or opportunistic local injection from other users by creating a mode-0700 directory, mode-0600 Unix socket, and 256-bit nonce. The socket path and nonce are passed only to the child environment. Messages use a 4-byte length prefix, protocol version 1, schema validation, a configurable hard size cap, and duplicate event-ID suppression. Malformed, overlong, multiple-frame, oversized, stale, and unauthenticated clients are closed. Partial clients are closed by timeout. The server removes its short socket directory on graceful shutdown. A pre-existing or symlinked directory is never reused.

Reports travel directly from subagent `agent_end` to the orchestrator. Reports are capped to 50 KB and 2,000 lines before transport. Authenticated reports that arrive before pane registration enter a bounded, byte-limited, expiring in-memory queue and drain once ownership is registered. A full queue does not acknowledge the report, so the child's bounded retry policy applies. The full report is persisted through Pi's stable custom-message session API and rendered compactly. In-memory history is scoped to the parent runtime. If the parent is unavailable after bounded retries, delivery fails closed and the child continues. Crash recovery beyond Pi session persistence is deferred rather than introducing a second unauthenticated transport.

The nonce is not protection from a fully compromised same-user process that can inspect child environments or debug processes. Prompt arguments may be visible in process listings. tmux pane control can submit commands as the user. Ownership checks restrict tools to panes spawned by the current parent, but do not sandbox children.

## pi-fish-bridge

Only strict command names are accepted. Bash-resolvable names are excluded to avoid shadowing commands, builtins, and keywords. The cache and shims use mode 0700, are built in a fresh sibling directory, and replace the prior cache atomically. Symlink targets are rejected. Fish startup and user functions remain trusted user code. Interactive startup can have side effects.

## Theme and recipes

Themes contain data only. Recipes are examples and should be reviewed before copying. Optional opinionated settings are clearly separated from the minimal core.
