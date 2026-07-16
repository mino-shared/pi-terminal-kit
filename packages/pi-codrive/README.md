# @isaaclins/pi-codrive

Shared-control Pi sessions where the human and orchestrator use the exact same visible tmux pane. Each subagent reports every `agent_end` over a private authenticated Unix-domain socket. The orchestrator injects the capped report into the Pi session as a custom message while rendering only a compact SUBAGENT preview. `agent_report` is history/recovery, not the normal transport.

After publication:

```sh
pi install npm:@isaaclins/pi-codrive@0.1.1
```

Release-candidate test:

```sh
pi -e ./packages/pi-codrive
```

## Requirements

Pi 0.80.3+, Node 20 or 22, tmux, and macOS or Linux. Windows is unsupported. Outside tmux on macOS, open a second Ghostty window manually. Ghostty cannot provide parent steering or authenticated reports.

## Command and tools

- `/spawn <optional prompt>`: human-facing command that creates the same shared subagent pane and reports success or failure through the UI. It uses configured defaults, including model and thinking inheritance when they are `null`.
- `spawn_agent`: programmatic equivalent of `/spawn`, with an optional explicit model override. Model and thinking inherit from the parent Pi runtime when configuration values are `null` by passing explicit CLI flags.
- `agent_pane`: inspect capped terminal output or send literal text to a live owned pane.
- `agent_report`: retrieve capped in-memory history after direct completion delivery.

Delegation is one level deep. Child panes use `remain-on-exit` without changing global tmux configuration. Prompts are passed as safely single-quoted shell arguments. Like any command-line prompt, they may still be visible briefly to same-user process-list inspection.

## Configuration

Create `$XDG_CONFIG_HOME/pi-codrive/config.json`, defaulting to `~/.config/pi-codrive/config.json`:

```json
{
  "piCommand": "pi",
  "model": null,
  "thinking": null,
  "tmux": {
    "split": "horizontal",
    "size": null,
    "captureLines": 200,
    "roleOption": "@pi_codrive_role"
  },
  "notifications": {
    "connectTimeoutMs": 2000,
    "retryMs": 150,
    "retries": 3,
    "maxMessageBytes": 524288
  },
  "waitingWidget": { "enabled": true, "intervalMs": 600 }
}
```

The orchestrator creates a mode-0700 short temporary directory, a mode-0600 socket, and a high-entropy nonce. Frames are 4-byte big-endian length plus versioned JSON. Invalid, duplicate, unauthenticated, overlong, multiple-frame, and oversized messages are rejected. Reports are capped to Pi's 50 KB and 2,000-line contract before IPC and context injection. Authenticated reports that beat tmux pane registration are held in a bounded, expiring in-memory queue and drained exactly once after ownership is established. A subagent retries bounded delivery if the orchestrator is busy. If the orchestrator is gone after retries, the report is lost by design. Session custom messages provide normal Pi session persistence.

The current tmux pane is marked `orchestrator`, spawned panes are marked `subagent`, and the parent role is cleared on shutdown through the configured pane option. Dead-pane health checks stop the waiting widget and live steering while retaining report ownership and history. A delayed authenticated report remains accepted after pane death.

## Troubleshooting

- `tmux is required`: start Pi inside tmux.
- `IPC server is not ready`: wait for session startup or `/reload`.
- No report: confirm the subagent loaded the package and did not outlive orchestrator shutdown.
- `exited before delivering a report`: the pane health check detected death; delayed authenticated reports can still populate history.
- Pane output missing: dead panes keep report ownership and history but cannot be steered or captured reliably. Failed capture or send operations mark the pane dead, stop its health check, and return an actionable error without deleting history.

Uninstall with `pi remove npm:@isaaclins/pi-codrive`. Source: [packages/pi-codrive](https://github.com/isaaclins/pi-terminal-kit/tree/main/packages/pi-codrive). Review the [threat model](../../docs/threat-model.md) before use.
