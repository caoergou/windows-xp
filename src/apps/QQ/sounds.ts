// Authentic QQ2006 sound effects (extracted from the original installer via
// mengkunsoft/QQ2006 — see src/apps/QQ/assets/NOTICE.md). Wired into the QQ
// Messenger (#119). These are APP sounds, not OS-theme sounds: they register
// themselves into the soundManager when the QQ module graph loads, and stay
// with QQ if the OS theme is ever swapped (#143/#213).
import { registerSounds } from '../../utils/soundManager';
import qqMessageUrl from './assets/audio/message.mp3';
import qqOnlineUrl from './assets/audio/online.mp3';
import qqSystemUrl from './assets/audio/system.mp3';

registerSounds({
  // QQ message notification sound (original msg.wav: pager "beep beep")
  qqMessage: qqMessageUrl,
  // QQ online notification sound (original Global.wav: knock "dong dong")
  qqOnline: qqOnlineUrl,
  // QQ system message / add-friend notification sound (original system.wav: "ahem, ahem")
  qqSystem: qqSystemUrl,
});
