# @isaaclins/pi-fish-bridge

Portable Fish function shims for Pi without making Fish execute Bash syntax.

After publication:

```sh
pi install npm:@isaaclins/pi-fish-bridge@0.1.0
```

Test now with `pi -e ./packages/pi-fish-bridge`.

## Behavior and requirements

On macOS/Linux, the extension finds Fish from an absolute configured path or `PATH`, reads valid autoload function names and simple abbreviations, applies include/exclude lists, rejects names Bash already resolves, and atomically replaces an isolated mode-0700 XDG cache. Symlink cache targets are rejected. `/fish-bridge-refresh` rebuilds shims and `/fish-bridge-status` reports status. Refresh also runs at session start. Windows is unsupported.

Pi's stable `user_bash` hook safely bridges `!` and `!!` without settings changes. Pi currently has no public hook that changes PATH only for every model `bash` tool invocation without replacing that tool. If model tool calls must resolve Fish shims, add the smallest explicit setting, replacing the path if `XDG_CACHE_HOME` is set:

```json
{
  "shellCommandPrefix": "PATH=\"${XDG_CACHE_HOME:-$HOME/.cache}/pi-fish-bridge/shims:$PATH\""
}
```

The default uses `fish -ic`, so interactive Fish startup files run for every shim call and may have side effects or emit output. Set `"interactive": false` only if your functions load without interactive startup.

Configuration is `$XDG_CONFIG_HOME/pi-fish-bridge/config.json` or `~/.config/pi-fish-bridge/config.json`:

```json
{
  "fishPath": null,
  "include": [],
  "exclude": ["dangerous-command"],
  "interactive": true
}
```

Only names matching `[A-Za-z][A-Za-z0-9_-]*` are accepted. Included names still cannot shadow Bash commands, builtins, or keywords. Shims contain no function bodies and invoke Fish with positional arguments.

Troubleshooting: run `/fish-bridge-status`, verify Fish is on `PATH`, then `/fish-bridge-refresh`. Uninstall with `pi remove npm:@isaaclins/pi-fish-bridge`; the isolated cache can then be deleted. Source: [packages/pi-fish-bridge](https://github.com/isaaclins/pi-terminal-kit/tree/main/packages/pi-fish-bridge).
