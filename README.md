# pi-terminal-kit

Portable terminal integrations for [Pi](https://github.com/earendil-works/pi-mono). This is a public release candidate. Packages are independently versioned and publishable.

## Choose a package

| Package                                                            | Purpose                                                                                                | Requirements                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`@isaaclins/pi-codrive`](./packages/pi-codrive)                   | Share the exact visible tmux pane with a child and receive authenticated structured completion reports | Pi 0.80.3+, Node 20/22, tmux, macOS/Linux |
| [`@isaaclins/pi-fish-bridge`](./packages/pi-fish-bridge)           | Expose selected Fish functions safely to Pi shell commands                                             | Pi 0.80.3+, Fish, Bash, macOS/Linux       |
| [`@isaaclins/pi-arcoiris-refined`](./packages/pi-arcoiris-refined) | Complete 51-token dark theme                                                                           | Pi 0.80.3+                                |
| [`ghostty-tmux-fish` recipe](./recipes/ghostty-tmux-fish)          | Copy-pasteable terminal integration                                                                    | Ghostty, tmux, Fish                       |

## Install after publication

These npm commands become available only after the packages are published:

```sh
pi install npm:@isaaclins/pi-codrive@0.1.0
pi install npm:@isaaclins/pi-fish-bridge@0.1.0
pi install npm:@isaaclins/pi-arcoiris-refined@1.0.0
```

Test this release candidate now without publishing:

```sh
git clone https://github.com/isaaclins/pi-terminal-kit.git
cd pi-terminal-kit
pnpm install
pi -e ./packages/pi-codrive
pi -e ./packages/pi-fish-bridge
pi --theme ./packages/pi-arcoiris-refined/themes/arcoiris-refined.json
```

Or register a local package persistently:

```sh
pi install "$PWD/packages/pi-codrive"
```

Remove a published package with `pi remove npm:@isaaclins/pi-codrive`, substituting the package name. Remove a local installation with the exact local source shown by `pi list`.

## Compatibility and security

Windows is unsupported. Co-drive requires tmux on macOS and Linux. Ghostty fallback is documented but intentionally user-driven. See [compatibility](./docs/compatibility.md), [threat model](./docs/threat-model.md), [migration](./docs/migration.md), and [SECURITY.md](./SECURITY.md).

## Screenshots

Screenshots are reserved for a verified post-publication capture. No synthetic preview is included.

## Development

```sh
pnpm install
pnpm format:check
pnpm typecheck
pnpm test
pnpm pack:check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md). Licensed under MIT.
