/**
 * Reference Deduction Sheet content (#219). A small two-group form showing the
 * Obra-Dinn batched-verification shape: the three "crime" slots judge together,
 * the "lookout" slot on its own. Open it with
 * `ref.openApp('DeductionSheet', demoDeduction)` or wire it into a scenario.
 */
import type { DeductionSheetProps } from '../../apps/DeductionSheet';

export const demoDeduction: DeductionSheetProps = {
  formId: 'county-finale',
  prompt:
    '那年夏天，凶手是 [who]，凶器是 [weapon]，案发地点在 [where]。\n那天晚上负责望风的，是 [lookout]。',
  wordBank: ['阿哲', '水晶女孩', '老板', '球棒', '网线', '网吧', '录像厅', '小卖部'],
  slots: [{ id: 'who' }, { id: 'weapon' }, { id: 'where' }, { id: 'lookout' }],
  groups: [
    { id: 'the-crime', slots: ['who', 'weapon', 'where'] },
    { id: 'the-lookout', slots: ['lookout'] },
  ],
  solution: { who: '阿哲', weapon: '球棒', where: '网吧', lookout: '水晶女孩' },
};

export default demoDeduction;
