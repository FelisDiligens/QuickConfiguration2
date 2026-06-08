## Building

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Prerequisites

See [tauri.app -> Guides -> Quick Start -> Prerequisites](https://tauri.app/start/prerequisites/)

### Build and run

```bash
# Download node_modules:
pnpm install
# Run debug:
pnpm dev
# Build release:
pnpm build
```

Currently, building the AppImage on Linux fails due to an upstream issue ([tauri#8929](https://github.com/tauri-apps/tauri/issues/8929), [linuxdeploy#272](https://github.com/linuxdeploy/linuxdeploy/issues/272)). Set the `NO_STRIP` environment variable:

```bash
# Build release (workaround on Linux):
NO_STRIP=true pnpm build
```

To sign a release and create a signature (`*.sig` file), run the `setup-build-env.sh` script before building:

```bash
# Export environment variables:
./scripts/setup-build-env.sh
# Build signed release with signature:
pnpm build
```

### Testing

To get test coverage (and nicer output) from the Rust side, `cargo-llvm-cov` and `cargo-nextest` is used, which is installed easily with [`binstall`](https://github.com/cargo-bins/cargo-binstall?tab=readme-ov-file#installation):

```bash
cargo binstall cargo-llvm-cov cargo-nextest
```

Then run:

```bash
# Test everything (with coverage):
pnpm test
# Test Core process only:
pnpm run cargo:nextest
# Test WebView process (React UI) only:
pnpm run ui:vitest
```

Coverage is generated under `./coverage/{llvm-cov,vitest}/index.html`.
