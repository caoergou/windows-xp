# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Cultural packs: desktop shortcuts and sticky notes are now localized per language.
- Added English locale e2e smoke tests for Western cultural icons and Run Dialog app launching.
- CI quality gates: lint, typecheck, and unit tests now run before build/deploy and before npm publish.
- Added `CONTRIBUTING.md` and this changelog.

### Changed

- Replaced deprecated Prettier option `jsxBracketSameLine` with `bracketSameLine`.
- Expanded Prettier format globs to cover `e2e/`, `test/`, and root config files.
- Run Dialog now resolves localized app titles from registry `nameKey` entries.

### Fixed

- Removed hard-coded Chinese strings from IE toolbar, IE address bar, and login screen; they now use i18n keys.
- Fixed Run Dialog so `calc` launches Calculator with the correct localized title.

## [0.1.0] - 2024-XX-XX

### Added

- Initial Windows XP desktop simulator in React.
- Start menu, taskbar, draggable windows, and file explorer.
- Classic apps: Internet Explorer 6, Notepad, Calculator, Minesweeper, Solitaire, Paint, Windows Media Player, QQ Login, 360 Safe Guard, Thunder, Baofeng Player, Kugou Music, and more.
- i18n support for Simplified Chinese and English.
