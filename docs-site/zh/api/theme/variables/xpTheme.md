[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [theme](/windows-xp/docs/zh/api/theme/index.md) / xpTheme

# Variable: xpTheme

&gt; `const` **xpTheme**: [`OSTheme`](/windows-xp/docs/zh/api/theme/interfaces/OSTheme.md)

Defined in: src/themes/xp/index.ts:12

The Windows XP (Luna) theme — the single [OSTheme](/windows-xp/docs/zh/api/theme/interfaces/OSTheme.md) implementation
today (#135). Everything XP-specific (tokens, assets, styles) resolves through
this module, so a future theme is a sibling under `src/themes/` rather than a
change to the engine.
