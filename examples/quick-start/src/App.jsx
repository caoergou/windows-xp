import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function App() {
  return <WindowsXP autoLogin skipBoot persistence="none" />;
}
