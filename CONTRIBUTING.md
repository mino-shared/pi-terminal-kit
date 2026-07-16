# Contributing

Use Node 20 or 22 and pnpm 10. Run:

```sh
pnpm install
pnpm format:check
pnpm typecheck
pnpm test
pnpm pack:check
```

Keep packages independently versioned under SemVer 2.0.0. Add user-facing changes to the package changelog. Tests must avoid paid model calls and use a private tmux socket. Do not commit generated archives, screenshots that were not truthfully captured, secrets, or machine-specific paths.
