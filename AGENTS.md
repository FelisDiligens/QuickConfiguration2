# AGENTS.md

## Project Overview

A configurator and mod manager for the video game Fallout 76. Primarily supports Windows and Linux, but also has some code paths for macOS (only secondary support).

It's a Tauri 2.0 desktop application that is split into two parts:

- Rust-based core of the app that exposes "commands" and "events" to the frontend code via IPC. It's code lives in `./src-tauri/src`.
- TypeScript/React frontend of the app that facilitates user interaction. It's code lives in `./src`.

**Project quirks:**
- Bindings to Tauri commands and events are generated with `tauri-specta` into `./src/commands/bindings.ts` upon running `pnpm export-bindings`.
- Only commands and events added in `./tauri-src/src/main.rs` using `collect_commands!` and `collect_events!` are accessable from the frontend.

## Development Commands

Please use the following commands while working on the code base:

**Rust**
- Checking for errors: `pnpm cargo:check`
- Run clippy (linting): `pnpm cargo:clippy`
- Run unit tests and generate coverage: `pnpm cargo:nextest`
- Format code: `pnpm cargo:fmt`

**Typescript**
- Checking for type errors (tsc): `pnpm ui:tsc`
- Run ESLint (linting): `pnpm ui:eslint`
- Run unit tests and generate coverage: `pnpm ui:vitest`
- Format code with prettier: `pnpm ui:format`

**Entire codebase**
- Checking for errors and linting: `pnpm lint`
- Run unit tests and generate coverage: `pnpm test`
- Format code: `pnpm format`

## Code Style Guidelines and Notes

**General**
- Follow the code style of the existing files.
- Avoid deeply nested code, keep logic as flat as possible.
- Don't use comments in the code. The code should be self-documentating.
- If the unit tests you wrote are failing due to bugs in the tested code, let them fail. Don't comment out asserts, just to make the test work.

**Rust**
- Prefer to split up imports in Rust code.
- Never use `unwrap` or `expect`. Always try to propagate errors with `?` operator.
- Always log errors (e.g. with `tap_err`) and add additional log messages where it might be informative.
- Create test functions (`#[test]`) and run nextest to check if code works. Don't compile code with `rustc` to run tests.

**TypeScript**
- Use `pnpm`, not `npm` when running scripts.
- Use scripts in `package.json` instead of running `npx` etc.
- Use strict typing, never use `any` or any exemptions (no disabling checks), avoid `unknown` if possible.

## Task Completion Requirements

- **Use the commands mentioned above such as `pnpm lint` to check / lint for types and errors as you're working on your task and when you're finished.**
- **Run the formatter (`pnpm format`) after you're finished with your task.**