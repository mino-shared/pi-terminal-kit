# Migration

## From personal spawn-agent files

Remove or disable the old `spawn-agent.ts` before loading pi-codrive to avoid duplicate tool names. The public package uses namespaced `PI_CODRIVE_*` environment variables and `@pi_codrive_role`. Model and thinking now inherit unless configured.

## From personal fish shims

Remove or disable `fish-shims.ts`. The cache moves to `$XDG_CACHE_HOME/pi-fish-bridge/shims`. Add the documented `shellCommandPrefix` only when model `bash` calls need shims. User `!` commands need no setting.

## Theme

Select `arcoiris-refined` after package installation. Its theme name is unchanged.
