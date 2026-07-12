import { WindowsXP } from '@caoergou/windows-xp';
// A `/components` subpath import — proves the secondary export entry resolves
// and type-checks from a real consumer (#206).
import { StartButton } from '@caoergou/windows-xp/components';
// The `style.css` subpath — proves the published stylesheet resolves in a
// consumer build (one of the two exports entries for it).
import '@caoergou/windows-xp/style.css';

// Referencing the subpath symbol at module scope keeps the import in the graph,
// so a broken `./components` export would fail the build, not silently drop.
const componentsKind = typeof StartButton;

export default function App() {
  return (
    <>
      <WindowsXP autoLogin skipBoot />
      <div
        data-testid="components-probe"
        data-kind={componentsKind}
        style={{ position: 'fixed', bottom: 0, right: 0, width: 1, height: 1, opacity: 0 }}
      />
    </>
  );
}
