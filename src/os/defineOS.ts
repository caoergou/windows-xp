import type { OSPackage } from './contract';

const REQUIRED_CHROME = [
  'WindowDecoration',
  'shellSurfaces',
  'SystemDialogs',
  'BootScreen',
  'LoginScreen',
  'MenuBar',
] as const;

/** Author and validate an OS package without giving it arbitrary engine hooks. */
export function defineOS<const TPackage extends OSPackage>(os: TPackage): TPackage {
  if (import.meta.env?.DEV ?? true) {
    if (!os.id) console.warn('[windows-xp] defineOS: `id` is required.');
    if (!os.name) console.warn(`[windows-xp] defineOS("${os.id}"): \`name\` is required.`);
    if (os.theme.id !== os.id) {
      console.warn(
        `[windows-xp] defineOS("${os.id}"): theme id "${os.theme.id}" should match the OS id.`
      );
    }
    for (const slot of REQUIRED_CHROME) {
      if (!os.chrome[slot]) {
        console.warn(`[windows-xp] defineOS("${os.id}"): chrome.${slot} is required.`);
      }
    }
  }
  return os;
}
