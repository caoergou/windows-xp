# 夏灯调查笔记数据结构设计

*版本：1.0*
*日期：2026-01-31*

---

## 一、概述

夏灯调查笔记系统是游戏中的自动叙事推动机制。当玩家完成关键进度时，记事本窗口会自动打开并逐字输入夏灯的思考和推理过程，展现她的情感变化和认知递进。

### 设计理念

1. **主动推理**：不依赖陈默邮件，而是通过夏灯的主动分析推动剧情
2. **情感递进**：从怀疑→愤怒→理解→决心
3. **沉浸感**：打字机效果让玩家感觉"夏灯正在思考"
4. **进度可视化**：桌面上的笔记文件显示调查进展
5. **避免弹窗出戏**：所有内心独白都通过文本编辑器的自动打字实现

---

## 二、调查笔记数据结构

### 文件位置

`src/data/investigation_notes/notes.json`

### 完整数据结构

```json
{
  "notes": [
    {
      "id": "note_001",
      "filename": "我的回忆.txt",
      "trigger": "first_login_qq",
      "typingSpeed": 40,
      "content": "**2016年2月**\n我收到了林晓宇的最后一条QQ消息：\n\"夏灯，你还记得山顶事务所的约定吗？\"\n\n我看到了。\n但我没有回复。\n\n第二天，他就死了。\n\n十年了，我每次打开QQ，那条未读消息还在那里。\n像一个永远无法关闭的窗口。\n\n今天，我终于有勇气打开它。\n晓宇，对不起，我来晚了。"
    },
    {
      "id": "note_002",
      "filename": "调查笔记-01.txt",
      "trigger": "unlock_album",
      "typingSpeed": 50,
      "content": "**我看到了什么？**\n- 照相馆门口的陌生男子（2015.11.20）\n- 城西工地的现金交易（2015.12.15）\n- 机房深夜亮灯（2015.12.02 凌晨3:10）\n- 图书馆对峙（2016.02.14）\n\n**疑问：**\n晓宇在调查什么？这些照片指向谁？\n12月2日凌晨，谁会在机房？\n\n晓宇，你拍到了这些...\n你一个人面对这一切，而我在做什么？\n\n**我需要：**\n查看爸爸的工作日志，看看他知道什么。"
    },
    {
      "id": "note_003",
      "filename": "调查笔记-02.txt",
      "trigger": "read_father_diary_layer1",
      "typingSpeed": 50,
      "content": "**爸爸的记录：**\n- 2015.12.02 深夜路过学校，机房灯亮\n- 2016.02.14 林晓宇和陈默在图书馆吵架，陈默哭了\n- 爸爸写：\"我不敢深究\"\n\n**时间吻合：**\n林晓宇拍到机房亮灯：12.02 凌晨3:10\n爸爸看到机房亮灯：12.02 深夜\n图书馆对峙：2.14 下午\n林晓宇坠楼：2.15\n\n**陈默？**\n他在机房做什么？\n为什么和晓宇吵架？\n第二天晓宇就死了...\n\n原来爸爸也知道...他也在痛苦。\n但为什么我们都选择了沉默？\n\n**我需要：**\n找到林晓宇的日志，看看他怎么说。"
    },
    {
      "id": "note_004",
      "filename": "调查笔记-03.txt",
      "trigger": "read_linxiaoyu_diary",
      "typingSpeed": 50,
      "content": "**林晓宇的话：**\n\"陈默是被迫的，奶奶手术费。\"\n\"我理解他，但我不能停下。\"\n\"王虎在操作高考移民。\"\n\n**真相反转：**\n陈默不是主谋，他也是受害者。\n但他参与了，他在机房篡改数据。\n他知道晓宇在调查，他警告过晓宇。\n\n**2月15日发生了什么？**\n陈默在现场吗？\n他的眼镜为什么在现场？\n他是去阻止，还是...\n\n晓宇，你理解陈默，你理解所有人。\n但谁来理解你呢？\n\n**我需要：**\n看看爸爸还藏了什么。那个加密文件夹，密码是什么？"
    },
    {
      "id": "note_005",
      "filename": "调查笔记-04.txt",
      "trigger": "read_father_letter",
      "typingSpeed": 50,
      "content": "**爸爸的坦白：**\n2015.11.23，他签署了第一份虚假证明。\n之后两年，他又签了十几份。\n他看到林晓宇求助，但他说\"不要声张\"。\n他看到陈默深夜在机房，但他装作不知道。\n\n**高考移民产业链：**\n每年约6人，持续多年\n保护伞：教育局+公安局+学校\n受害者：张雨（589分→二本）、周磊、方欣...\n\n**爸爸说：**\n\"有一张看不见的网。你敢挣扎，网就收紧。\"\n\"你的名字是'灯'，我希望你能照亮我不敢照亮的黑暗。\"\n\n爸爸说\"有一张看不见的网\"。\n但如果我们都不敢挣脱，这张网就永远存在。\n\n**我明白了：**\n晓宇不是一个人在战斗。\n他面对的是整个系统。\n陈默、爸爸、我...我们都选择了沉默。\n\n**现在：**\n陈默说他要自首。\n我要等他的消息。\n这次，真相不能再被掩盖。"
    }
  ]
}
```

---

## 三、字段说明

### 调查笔记对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 笔记唯一标识符 |
| filename | string | 是 | 文件名（保存到桌面） |
| trigger | string | 是 | 触发条件 |
| typingSpeed | number | 是 | 打字速度（字符/秒） |
| content | string | 是 | 笔记内容（支持Markdown格式） |

---

## 四、触发机制

### 触发条件表

| 触发条件 | 说明 | 触发的笔记 |
|---------|------|-----------|
| `first_login_qq` | 首次登录QQ | note_001（我的回忆） |
| `unlock_album` | 破解林晓宇加密相册 | note_002（调查笔记-01） |
| `read_father_diary_layer1` | 看完父亲第一层日志 | note_003（调查笔记-02） |
| `read_linxiaoyu_diary` | 读完林晓宇日志 | note_004（调查笔记-03） |
| `read_father_letter` | 看完父亲的信 | note_005（调查笔记-04） |

### 自动打字流程

```
玩家完成关键进度
    ↓
系统检测触发条件
    ↓
自动打开记事本窗口
    ↓
窗口置顶并聚焦
    ↓
逐字输入内容（打字机效果）
    ↓
输入完成后自动保存到桌面
    ↓
更新游戏进度标记
```

---

## 五、前端集成说明

### 1. 触发调查笔记

```javascript
// utils/investigationNotes.js

export const triggerInvestigationNote = async (noteId) => {
  // 加载笔记数据
  const notesData = await import('../data/investigation_notes/notes.json');
  const note = notesData.default.notes.find(n => n.id === noteId);

  if (!note) {
    console.error(`Note ${noteId} not found`);
    return;
  }

  // 打开记事本窗口
  const notepadWindow = openNotepad({
    title: note.filename,
    content: '', // 初始为空
    readOnly: true, // 自动打字时只读
    autoSave: true,
    saveToDesktop: true
  });

  // 开始打字机效果
  await typeText(notepadWindow, note.content, note.typingSpeed);

  // 打字完成后允许编辑（可选）
  notepadWindow.setReadOnly(false);

  // 更新游戏进度
  updateGameProgress(`note_${noteId}_completed`);
};
```

### 2. 打字机效果实现

```javascript
// utils/typewriter.js

export const typeText = async (window, text, speed = 50) => {
  const chars = text.split('');
  let currentText = '';

  for (let i = 0; i < chars.length; i++) {
    currentText += chars[i];
    window.setContent(currentText);

    // 计算延迟
    const delay = 1000 / speed; // speed是字符/秒

    // 如果是换行符，稍微延迟长一点
    if (chars[i] === '\n') {
      await sleep(delay * 2);
    } else {
      await sleep(delay);
    }

    // 可选：添加打字音效
    if (chars[i] !== ' ' && chars[i] !== '\n') {
      playTypingSound();
    }
  }

  // 打字完成，保存到桌面
  window.saveToDesktop();
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

### 3. 记事本窗口组件

```javascript
// components/Notepad.jsx

const Notepad = ({ title, initialContent, readOnly, autoSave, saveToDesktop }) => {
  const [content, setContent] = useState(initialContent);
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef(null);

  const handleSave = () => {
    if (saveToDesktop) {
      // 保存到桌面（虚拟文件系统）
      saveFileToDesktop(title, content);
      setIsSaved(true);

      // 显示保存提示
      showNotification({
        title: '文件已保存',
        message: `${title} 已保存到桌面`,
        icon: 'notepad'
      });
    }
  };

  useEffect(() => {
    if (autoSave && content && !isSaved) {
      // 自动保存
      const timer = setTimeout(handleSave, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, autoSave, isSaved]);

  return (
    <NotepadContainer>
      <NotepadToolbar>
        <span>{title}</span>
        {!readOnly && (
          <button onClick={handleSave}>保存</button>
        )}
      </NotepadToolbar>

      <NotepadTextarea
        ref={textareaRef}
        value={content}
        onChange={(e) => !readOnly && setContent(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
      />
    </NotepadContainer>
  );
};
```

### 4. 游戏进度检测

```javascript
// utils/progressTracker.js

export const checkAndTriggerNotes = () => {
  const progress = getGameProgress();

  // 检查各个触发条件
  if (progress.firstLoginQQ && !progress.note_note_001_completed) {
    triggerInvestigationNote('note_001');
  }

  if (progress.unlockedAlbum && !progress.note_note_002_completed) {
    triggerInvestigationNote('note_002');
  }

  if (progress.readFatherDiaryLayer1 && !progress.note_note_003_completed) {
    triggerInvestigationNote('note_003');
  }

  if (progress.readLinxiaoyuDiary && !progress.note_note_004_completed) {
    triggerInvestigationNote('note_004');
  }

  if (progress.readFatherLetter && !progress.note_note_005_completed) {
    triggerInvestigationNote('note_005');
  }
};
```

---

## 六、UI设计要点

### 1. Windows XP记事本样式

```javascript
const NotepadContainer = styled.div`
  width: 600px;
  height: 400px;
  background: white;
  border: 1px solid #0054e3;
  font-family: 'Courier New', monospace;
  font-size: 12px;
`;

const NotepadToolbar = styled.div`
  background: linear-gradient(to bottom, #0054e3, #0041c2);
  color: white;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotepadTextarea = styled.textarea`
  width: 100%;
  height: calc(100% - 30px);
  border: none;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  outline: none;

  &:read-only {
    background: #f0f0f0;
    cursor: default;
  }
`;
```

### 2. 打字音效（可选）

```javascript
const playTypingSound = () => {
  const audio = new Audio('/sounds/keyboard_click.mp3');
  audio.volume = 0.1;
  audio.play();
};
```

### 3. 光标闪烁效果

```javascript
// 在打字过程中显示闪烁光标
const CursorBlink = styled.span`
  display: inline-block;
  width: 8px;
  height: 16px;
  background: black;
  animation: blink 1s infinite;

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
`;
```

---

## 七、叙事作用

### 1. 主动推理

不是被动接受陈默的邮件，而是夏灯主动分析证据：

- **note_002**：分析照片内容，提出疑问
- **note_003**：对比时间线，怀疑陈默
- **note_004**：理解陈默动机，真相反转
- **note_005**：揭示系统性腐败，决心行动

### 2. 红鲱鱼强化

**note_003**明确表达对陈默的怀疑，增强误导效果：

> "陈默？\n他在机房做什么？\n为什么和晓宇吵架？\n第二天晓宇就死了..."

### 3. 情感递进

从怀疑→愤怒→理解→决心：

- **note_001**：愧疚、怀旧
- **note_002**：困惑、自责
- **note_003**：怀疑、愤怒
- **note_004**：理解、同情
- **note_005**：决心、希望

### 4. 进度可视化

玩家可以通过桌面上的4个笔记文件看到调查进展：

```
桌面/
├─ 我的回忆.txt
├─ 调查笔记-01.txt
├─ 调查笔记-02.txt
├─ 调查笔记-03.txt
└─ 调查笔记-04.txt
```

---

## 八、与邮件系统的配合

### 双重叙事推动

- **调查笔记**：夏灯的主动推理（内部视角）
- **陈默邮件**：外部信息补充（外部视角）

### 时间线对应

| 进度 | 调查笔记 | 陈默邮件 |
|------|---------|---------|
| 首次登录QQ | note_001（我的回忆） | email_001（惊闻噩耗） |
| 破解相册 | note_002（调查笔记-01） | email_004（关于林晓宇） |
| 看完父亲日志 | note_003（调查笔记-02） | - |
| 读完林晓宇日志 | note_004（调查笔记-03） | email_006（我看到了日志） |
| 看完父亲的信 | note_005（调查笔记-04） | email_007（真相） |

---

## 九、数据验证清单

创建调查笔记数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 触发条件与游戏进度匹配
- [ ] 打字速度合理（40-60字符/秒）
- [ ] 内容符合夏灯的性格和情感状态
- [ ] 内容展现认知递进（怀疑→理解）
- [ ] 文件名清晰易懂
- [ ] 内容使用\n表示换行
- [ ] JSON格式正确，无语法错误

---

## 十、扩展功能（可选）

### 1. 可编辑笔记

允许玩家在自动打字完成后编辑笔记：

```javascript
// 打字完成后
notepadWindow.setReadOnly(false);
notepadWindow.showMessage('您现在可以编辑这份笔记了');
```

### 2. 笔记搜索

在桌面文件管理器中搜索笔记内容：

```javascript
const searchNotes = (keyword) => {
  const notes = getAllNotesFromDesktop();
  return notes.filter(note =>
    note.content.includes(keyword)
  );
};
```

### 3. 笔记导出

允许玩家导出所有笔记为一个文件：

```javascript
const exportAllNotes = () => {
  const notes = getAllNotesFromDesktop();
  const combined = notes.map(n => n.content).join('\n\n---\n\n');

  saveFile('完整调查笔记.txt', combined);
};
```

---

**文档完成日期**: 2026-01-31

**下一步**: 完成data-specification.md的最终更新
