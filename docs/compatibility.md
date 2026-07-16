# Compatibility

| Feature                 | macOS     | Linux      | Windows      |
| ----------------------- | --------- | ---------- | ------------ |
| pi-codrive in tmux      | Supported | Supported  | Unsupported  |
| Ghostty manual fallback | Supported | Not tested | Unsupported  |
| pi-fish-bridge          | Supported | Supported  | Unsupported  |
| theme                   | Supported | Supported  | Pi-dependent |

Pi 0.80.3+, Node 20 or 22, and current tmux/Fish releases are the release-candidate baseline. Unix socket paths are deliberately short to fit macOS limits. No Homebrew-specific paths are assumed.
