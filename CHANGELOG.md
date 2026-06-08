## What's new in v2.0.0-beta.1

This is the first beta release of version 2, a complete rewrite of the old Quick Configuration.

**New Features & Improvements**

- **Mod Manager:**
  - Redesigned mod order tab (new search bar, improved installation/import dialogs)
  - Overhauled resource list tab (displays associated mod title, file size, and whether the \*.ba2 file exists)
  - Multiple BA2 archives can be managed per mod now
  - Config files preserved (no longer overwritten)
  - Resource lists in ini file respected (no longer overwritten)
  - Additional Archive2 actions (create, extract, auto-bundle archives)
- **Linux:**
  - Native builds for Steam Deck and Linux (\*.AppImage recommended)
  - Full support and feature parity with Windows
  - Automatic detection of game installation and config paths
- **UI/UX:** Modernized, high DPI support, web-based interface
- **Translations:** Changed from XML to JSON format
- **Security:** Cryptographically signed updates
- **CI/CD:** GitHub Actions pipeline for automated and consistent release builds
- And more...

**Regressions & Removals**

- **Mod Manager:**
  - Drag-and-drop requires a new window due to technical limitations
  - Removed automatic bundling of archives (manual bundling via Archive2 menu in mod manager possible)
- **Custom Tweaks:** Removed custom tweaks page (please edit `.ini` files directly)
- **Gallery:** Limited to photos/screenshots (other features unavailable, e.g. custom folder paths)
- **Windows:** Dropped support for Windows 7 (Windows 10 untested, Windows 11 recommended)
- **Backups:** Removed automatic `.ini` backups (manual backups recommended)

**Compatibility**

- Drop-in replacement for v1.12.9 (most settings carried over)

For more details about the changes, see this wiki article: [What changed?](https://github.com/FelisDiligens/QuickConfiguration2/wiki/What-changed)
