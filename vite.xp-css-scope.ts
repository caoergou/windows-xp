/**
 * Scopes xp.css under the library root so embedding <WindowsXP /> cannot
 * restyle the host page (issue #73).
 *
 * xp.css ships bare element selectors (body, *, button, input, select, ...)
 * that would otherwise repaint every form control of the embedding app.
 * This PostCSS plugin rewrites them to descendants of the library scope.
 *
 * The prefix is a zero-specificity :where() matching both the main root
 * (.windows-xp-root) and portal roots (.windows-xp-portal — context menus and
 * dialogs rendered into document.body), so portal content keeps its XP look
 * without inheriting the main root's layout styles.
 */
import prefixer from 'postcss-prefix-selector';

const SCOPE = ':where(.windows-xp-root, .windows-xp-portal)';

/**
 * Files whose bare element selectors get scoped. Defaults to xp.css; kept a
 * parameter (#135, seam 2) so a second theme's sheet — the 98.css/XP.css/7.css
 * family shares xp.css's class conventions — can be scoped identically by
 * passing e.g. `[/xp\.css/, /7\.css/]`.
 */
const DEFAULT_INCLUDE = [/xp\.css/];

export const xpCssScopePlugin = (includeFiles: RegExp[] = DEFAULT_INCLUDE) =>
  prefixer({
    prefix: SCOPE,
    includeFiles,
    transform: (prefix: string, selector: string, prefixedSelector: string) => {
      // Page-level selectors become the scope roots themselves.
      if (selector === 'html' || selector === 'body' || selector === ':root') {
        return prefix;
      }
      return prefixedSelector;
    },
  });
