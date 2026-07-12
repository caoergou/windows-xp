/**
 * Reference Evidence Board content (#219). A small pool of clues from the 序章
 * fiction. Open with `ref.openApp('EvidenceBoard', demoEvidence)`; a scenario can
 * then gate on `linked('diary', 'chatlog')` etc.
 */
import type { EvidenceBoardProps } from '../../apps/EvidenceBoard';

export const demoEvidence: EvidenceBoardProps = {
  boardId: 'county-board',
  items: [
    { id: 'diary', label: '写给未来的信' },
    { id: 'chatlog', label: '聊天记录' },
    { id: 'password', label: '密码便签' },
    { id: 'crystal', label: '水晶女孩' },
    { id: 'cafe', label: '网吧' },
  ],
};

export default demoEvidence;
