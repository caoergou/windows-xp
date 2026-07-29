# Roadmap

> Status: the original implementation roadmap is complete as of 2026-07-29.
> GitHub issue [#86](https://github.com/caoergou/windows-xp/issues/86)
> is retained as the historical planning record.

## Shipped baseline

The project has reached the product shape described by the original roadmap:

- an embeddable React desktop engine with scoped styles, isolated storage,
  persistence modes, typed events, an imperative handle, snapshots, deep links,
  and React 18/19 support;
- a fidelity-first Windows XP package with reusable React components, built-in
  system applications, Chinese and English culture packages, accessibility
  support, and visual-regression coverage;
- a declarative authoring stack for scenarios, lessons, content packs, puzzle
  graphs, deterministic rehearsal, and offline solving;
- the standalone `@caoergou/xp-scenario-tools` toolchain for linting, solving,
  graphing, packing, migrating, serving, and inspecting scenario projects;
- an OS-package contract with `defineOS()`, behavior profiles, chrome slots,
  app roles, menus-as-data, and the Paper OS reference package;
- a documentation site, live bilingual demos, clean-consumer release checks,
  starter projects, and a reproducible boot-to-story demo.

## Release state

| Package                       | Published version |
| ----------------------------- | ----------------- |
| `@caoergou/windows-xp`        | `0.4.0`           |
| `@caoergou/xp-scenario-tools` | `0.1.0`           |

Both versions were verified against the public npm registry on 2026-07-29.
Repository CI covers formatting, schemas, linting, type checking, unit tests,
scenario validation, library builds, package-size limits, Playwright end-to-end
tests, and micro-component visual regression.

## Product direction

The long-term direction remains an OS-simulation platform where XP is the first
and default OS package. The architecture and constraints for that direction live
in [OS-PLATFORM-VISION.md](OS-PLATFORM-VISION.md).

Future work is intentionally not kept as an always-open umbrella issue. Each
newly accepted improvement should have a bounded GitHub issue with its own
evidence and acceptance criteria, then close through its implementation PR.
This keeps the issue tracker representative of actionable work instead of
preserving stale roadmap checklists.

External community posting is an operational maintainer decision, not a
repository-verifiable engineering acceptance criterion.
