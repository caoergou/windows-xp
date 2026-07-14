/**
 * #207 engine completion: `flag:change` triggers and the documented same-event
 * trigger order (declaration order), exercised headlessly through the solver so
 * the runtime and the solver stay consistent.
 */
import { describe, it, expect } from 'vitest';
import { solveScenario } from '../src/scenario/solver';
import type { Scenario } from '../src/scenario/types';
import type { XPEvent } from '../src/events';

const exec: XPEvent = { type: 'cmd:exec', command: 'go' };

describe('flag:change (solver)', () => {
  it('a setFlag emits flag:change that another trigger reacts to', () => {
    const s: Scenario = {
      id: 'fc',
      triggers: [
        { on: 'cmd:exec', do: [{ setFlag: 'have_key' }] },
        { on: 'flag:change', when: { event: { flag: 'have_key' } }, do: [{ setFlag: 'reacted' }] },
      ],
    };
    const r = solveScenario(s, [exec]);
    expect(r.flags).toMatchObject({ have_key: true, reacted: true });
  });

  it('does not emit flag:change when the value is unchanged', () => {
    const s: Scenario = {
      id: 'fc-noop',
      initialFlags: { x: true },
      triggers: [
        { on: 'cmd:exec', do: [{ setFlag: 'x', value: true }] },
        { on: 'flag:change', do: [{ setFlag: 'sawChange' }] },
      ],
    };
    const r = solveScenario(s, [exec]);
    expect(r.flags.sawChange).toBeUndefined();
  });

  it('incFlag emits flag:change with the new numeric value', () => {
    const s: Scenario = {
      id: 'fc-inc',
      triggers: [
        { on: 'cmd:exec', do: [{ incFlag: 'n' }] },
        {
          on: 'flag:change',
          when: { event: { flag: 'n', value: 1 } },
          do: [{ setFlag: 'sawOne' }],
        },
      ],
    };
    const r = solveScenario(s, [exec]);
    expect(r.flags).toMatchObject({ n: 1, sawOne: true });
  });
});

describe('same-event trigger order (declaration order)', () => {
  it("triggers fire in array order — a later trigger sees an earlier one's flag", () => {
    const inOrder: Scenario = {
      id: 'order',
      triggers: [
        { id: 'A', on: 'cmd:exec', do: [{ setFlag: 'x' }] },
        { id: 'B', on: 'cmd:exec', when: { flag: 'x' }, do: [{ setFlag: 'y' }] },
      ],
    };
    // A declared first → sets x → B (gated on x) fires in the same event.
    expect(solveScenario(inOrder, [exec]).flags).toMatchObject({ x: true, y: true });

    const reversed: Scenario = {
      id: 'order-rev',
      triggers: [
        { id: 'B', on: 'cmd:exec', when: { flag: 'x' }, do: [{ setFlag: 'y' }] },
        { id: 'A', on: 'cmd:exec', do: [{ setFlag: 'x' }] },
      ],
    };
    // B declared first → x not yet set → B does not fire; only x ends up set.
    const r = solveScenario(reversed, [exec]);
    expect(r.flags.x).toBe(true);
    expect(r.flags.y).toBeUndefined();
  });
});
