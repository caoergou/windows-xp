[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / createXPEventBus

# Function: createXPEventBus()

&gt; **createXPEventBus**(): [`XPEventBus`](/windows-xp/docs/zh/api/index/classes/XPEventBus.md)

Defined in: src/events.ts:231

Create a fresh event bus. Advanced composers using the bare providers can
make one bus, pass it to `EventBusProvider`, and observe it via `subscribe`
— the same instance the desktop emits on (#122).

## Returns

[`XPEventBus`](/windows-xp/docs/zh/api/index/classes/XPEventBus.md)
