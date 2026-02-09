# 文档数据结构设计

*版本：1.0*
*日期：2026-01-31*

---

## 一、概述

文档系统包含两大类内容：
1. **夏父文件夹**：夏建国的工作日志、警方记录、忏悔信件（两层加密）
2. **调查报道**：省级媒体的深度调查报道（游戏结局呈现）

这些文档是游戏中揭示系统性腐败和完整真相的关键素材。

---

## 二、夏父文件夹结构

### 文件系统组织

```
D:\给小灯\ (🔒 密码: 19990315)
  ├─ README.txt
  ├─ 工作日志2015-2025.txt
  ├─ 网页截图\
  │   ├─ 贴吧诽谤帖.png
  │   └─ 学校公告.png
  └─ 爸爸的信\ (🔒 密码: 20151123)
      └─ 给夏灯.txt
```

### 2.1 第一层加密文件夹

#### 文件位置
`src/data/documents/father_folder_layer1/`

#### 加密信息

```json
{
  "folderName": "给小灯",
  "locked": true,
  "password": "19990315",
  "hint": "密码是你的生日",
  "files": [
    {
      "filename": "README.txt",
      "type": "text",
      "path": "/documents/father_folder_layer1/README.txt"
    },
    {
      "filename": "工作日志2015-2025.txt",
      "type": "text",
      "path": "/documents/father_folder_layer1/work_diary.txt"
    },
    {
      "filename": "网页截图",
      "type": "folder",
      "files": [
        {
          "filename": "贴吧诽谤帖.png",
          "type": "image",
          "path": "/documents/father_folder_layer1/screenshots/tieba_post.png"
        },
        {
          "filename": "学校公告.png",
          "type": "image",
          "path": "/documents/father_folder_layer1/screenshots/school_notice.png"
        }
      ]
    },
    {
      "filename": "爸爸的信",
      "type": "folder",
      "locked": true,
      "password": "20151123",
      "hint": "密码是那一天"
    }
  ]
}
```

#### README.txt 内容

```
小灯：

如果你看到这个文件夹，说明我已经走了。

这些年我一直想告诉你一些事情，但我没有勇气。现在，我把这些都留给你。

密码是你的生日。你一直问我为什么给你起名叫"灯"，答案在里面。

还有一个文件夹，密码是我灯熄灭的那一天。如果你准备好了，就打开它。

对不起，小灯。

爸爸
2025年12月
```

#### 工作日志2015-2025.txt 内容结构

```json
{
  "filename": "work_diary.txt",
  "content": "# 工作日志 2015-2025\n\n## 2015年11月23日\n\n今天校长拿来一份"就读证明"，让我签字。\n\n我问："这个学生我没见过。"\n\n他说："你只需要签字。"\n\n我签了。\n\n从今天起，我灯熄灭。\n\n---\n\n## 2015年12月2日\n\n深夜路过学校，看到机房灯还亮着。\n\n这个时间，谁会在机房？\n\n我没有进去看。\n\n---\n\n## 2015年12月18日\n\n林晓宇来找我。他拿着一些照片，问我："夏老师，被迫犯罪算犯罪吗？"\n\n我看到照片后，心里一沉。\n\n我告诉他："不要声张，这件事很复杂。"\n\n他眼中的光，就像年轻时的我。\n\n我是在保护他，还是在保护自己？\n\n---\n\n## 2016年2月14日\n\n今天下午，我看到林晓宇和陈默在图书馆吵架。\n\n陈默哭了。\n\n我装作没看见。\n\n---\n\n## 2016年2月15日\n\n林晓宇从楼上摔下来了。\n\n警方说是意外。\n\n我知道不是。\n\n我是懦夫。\n\n---\n\n## 2016年2月20日\n\n校长找我谈话，说"这件事到此为止"。\n\n我问："为什么？"\n\n他说："老夏，你有女儿，我有儿子，陈默有奶奶，我们都有软肋。"\n\n我突然明白了——沉默不是因为冷漠，而是因为恐惧。\n\n在这个县城，每个人都被一张无形的网困住。\n\n你敢说话，网就会收紧，勒死你爱的人。\n\n---\n\n## 2016年3月\n\n我被调离教导主任职位。\n\n理由是"工作调整"。\n\n我知道这是警告。\n\n---\n\n## 2020年3月\n\n看到新闻，王虎因金融诈骗被抓。\n\n我想过举报，但我还是没有勇气。\n\n---\n\n## 2025年11月\n\n确诊肝癌晚期。\n\n医生说只有几个月了。\n\n我终于有勇气把这些留给你。\n\n小灯，对不起。\n\n---\n\n（日志结束）"
}
```

### 2.2 第二层加密文件夹

#### 文件位置
`src/data/documents/father_folder_layer2/`

#### 加密信息

```json
{
  "folderName": "爸爸的信",
  "locked": true,
  "password": "20151123",
  "hint": "密码是那一天（工作日志中提到的日期）",
  "files": [
    {
      "filename": "给夏灯.txt",
      "type": "text",
      "path": "/documents/father_folder_layer2/letter_to_xiadeng.txt",
      "wordCount": 8000
    }
  ]
}
```

#### 给夏灯.txt 内容结构

这是一封约8000字的长信，分为四个部分：

```json
{
  "filename": "letter_to_xiadeng.txt",
  "sections": [
    {
      "title": "为什么叫你'灯'",
      "wordCount": 1000,
      "summary": "解释夏灯名字的由来，夏建国的教育理想和对女儿的希望"
    },
    {
      "title": "我做了什么",
      "wordCount": 2000,
      "summary": "详细记录签署虚假证明、看到林晓宇求助但让他'不要声张'、看到陈默被利用但装作不知道"
    },
    {
      "title": "我听到的、推测的",
      "wordCount": 2000,
      "summary": "教育局副局长的暗示、校长的话、高考移民产业链运作（每年约6人，持续多年）、保护伞网络、被挤占名额的孩子"
    },
    {
      "title": "我的教育理想是怎么死的",
      "wordCount": 2000,
      "summary": "'有一张看不见的网。你敢挣扎，网就收紧。你不挣扎，就会慢慢窒息'"
    },
    {
      "title": "我对你的希望",
      "wordCount": 1000,
      "summary": "'你的名字是灯，我希望你能照亮我不敢照亮的黑暗'"
    }
  ],
  "content": "小灯：\n\n当年给你起这个名字，是希望你能成为照亮黑暗的那束光...\n\n（完整内容约8000字，需要单独编写）"
}
```

---

## 三、调查报道结构

### 文件位置
`src/data/documents/investigation_report.json`

### 数据结构

```json
{
  "title": "被遗忘的少年：一桩十年悬案背后的高考移民产业链",
  "subtitle": "省级媒体深度调查报道",
  "author": "本报记者 张明",
  "publishDate": "2026-02-25",
  "readTime": "20分钟",
  "sections": [
    {
      "id": 1,
      "title": "一个少年的死亡",
      "wordCount": 2000,
      "content": "2016年2月15日下午，16岁的林晓宇从县城东郊一栋烂尾医院楼顶坠落身亡...\n\n【完整短信记录】\n2016年2月14日 22:37，陈默发给赵威：\n'千万别去烂尾医院。'\n\n2016年2月14日 23:52，陈默发给林晓宇：\n'求你别去，至少让我陪你。我不会让你出事的。'\n\n【陈默证词（关键情感段落）】\n'奶奶是我唯一的亲人。在我父母离婚后把我养大，每天早上5点起床去菜市场捡菜叶，只为了让我吃饱。2015年她住院时，我看着她在病床上说'默默，奶奶不想拖累你'。那一刻我就知道，我必须救她，哪怕用任何代价。'\n\n【2.15真相还原】\n下午3:50，陈默提前到达烂尾医院外...\n下午4:05，林晓宇到达...\n下午4:10左右，争夺中林晓宇失足坠楼..."
    },
    {
      "id": 2,
      "title": "一个产业链",
      "wordCount": 2500,
      "content": "【规模】\n2013-2015年，3年共操作18人（每年6人），总收益约1800-2000万\n\n【操作流程】\n1. 外省/外市中介招揽高分考生（收费80-120万/人）\n2. 王虎在本地运作（打通教育局、公安局、学校）\n3. 陈默篡改教务系统，伪造学籍\n4. 学校开具虚假就读证明\n5. 教育局副局长快速审批\n6. 外省考生以'本县考生'身份参加高考，利用国家专项降分政策录取\n\n【保护伞系统】\n- 教育局/招办：40%（约800万）\n- 公安局/户籍：30%（约600万）\n- 王虎/中介：20%（约400万）\n- 学校领导/具体执行：10%（约200万）"
    },
    {
      "id": 3,
      "title": "被挤占的未来",
      "wordCount": 2000,
      "content": "【张雨的故事】\n2015年高考589分，超国家专项线4分\n本应通过国家专项进入985大学\n因6个假学籍占用名额，专项落榜，只能录取二本\n母亲是县医院清洁工，月薪1500元，单亲家庭\n现状：某县城文员，月薪3000元\n\n【周磊的故事】\n2015年高考582分，超国家专项线\n因名额被占，录取二本师范\n现状：某乡村小学教师，月薪4500元\n'我不后悔当老师，但我后悔失去了选择的权利'\n\n【方欣的故事】\n2015年高考578分，本应通过专项进入一本\n因名额被占，录取三本民办\n父母农民，负债10万供她上学\n现状：打工还债"
    },
    {
      "id": 4,
      "title": "系统的沉默",
      "wordCount": 1500,
      "content": "【知情者的选择】\n夏建国（教导主任）：签署虚假证明，但在日记里记录\n其他教师：'我们都有家人，我们不敢说'\n\n【系统性掩盖】\n警方快速定性'意外坠楼'\n现场证据（眼镜）被忽略\n证人证词被删改\n林晓宇母亲的质疑被压制"
    },
    {
      "id": 5,
      "title": "迟到的正义",
      "wordCount": 1500,
      "content": "【重启调查】\n2026年2月18日，陈默在深圳市公安局自首\n2026年2月20日，县公安局重启调查\n2026年2月25日，王虎、教育局副局长等7人被刑事拘留\n\n【林晓宇母亲】\n'儿子，你没有做错，是妈妈来晚了'\n\n【陈默】\n因主动投案、配合调查，被判有期徒刑一年，缓刑一年"
    },
    {
      "id": 6,
      "title": "记者手记：扶贫政策的异化",
      "wordCount": 1500,
      "content": "【国家专项计划的初衷】\n2012年，国家启动'贫困地区定向招生专项计划'，旨在为贫困县考生提供进入重点大学的机会。\n\n【政策的异化】\n本县为国家级贫困县，2015年的6个国家专项名额中，有5个被外省富商子女占用。唯一的本地考生是张雨——她妈妈是县医院清洁工，月薪1500元，单亲家庭。\n\n张雨考了589分，超国家专项线4分，本应通过国家专项进入985大学。但因为5个假学籍占用名额，她的专项资格被取消，只能录取二本。\n\n【数字的讽刺】\n- 一个外省考生花120万买走一个国家专项名额\n- 120万，可以让张雨复读13年\n- 120万，可以救陈默奶奶40次\n- 120万，是张雨妈妈66年的工资\n\n但这些钱，流进了权力掮客的口袋。\n\n【更深的讽刺】\n那个花120万的家庭，孩子只考了560分，比张雨低29分。如果没有国家专项，这个孩子只能上二本。但通过伪造学籍，他以'本县考生'身份参加高考，利用国家专项降分政策，进入了985大学。\n\n而真正的本县考生张雨，589分，只能去二本。\n\n扶贫政策被权贵利用，真正的穷人被系统吞噬。"
    }
  ]
}
```

---

## 四、字段说明

### 文件夹对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| folderName | string | 是 | 文件夹名称 |
| locked | boolean | 是 | 是否加密 |
| password | string | 是（如果locked） | 密码 |
| hint | string | 是（如果locked） | 密码提示 |
| files | array | 是 | 文件列表 |

### 文件对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名 |
| type | string | 是 | 文件类型（text/image/folder） |
| path | string | 是（如果type不是folder） | 文件路径 |
| wordCount | number | 否 | 字数（仅文本文件） |

### 调查报道章节对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 章节ID |
| title | string | 是 | 章节标题 |
| wordCount | number | 是 | 字数 |
| content | string | 是 | 章节内容 |

---

## 五、前端集成说明

### 1. 文件夹解密

```javascript
const handleFolderClick = async (folder) => {
  if (folder.locked) {
    const success = await showPasswordDialog({
      title: "访问加密文件夹",
      message: folder.folderName,
      hint: folder.hint,
      correctPassword: folder.password
    });

    if (!success) {
      return;
    }
  }

  // 显示文件夹内容
  openFolder(folder);
};
```

### 2. 文本文件查看

```javascript
const openTextFile = async (filePath) => {
  try {
    const response = await fetch(filePath);
    const content = await response.text();

    // 在记事本窗口中显示
    openNotepad({
      title: filename,
      content: content
    });
  } catch (error) {
    showError('无法打开文件');
  }
};
```

### 3. 调查报道渲染

```javascript
const InvestigationReport = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    import('../data/documents/investigation_report.json')
      .then(module => setReport(module.default));
  }, []);

  if (!report) return <div>加载中...</div>;

  return (
    <ReportContainer>
      <ReportHeader>
        <h1>{report.title}</h1>
        <h2>{report.subtitle}</h2>
        <Meta>
          <span>{report.author}</span>
          <span>{report.publishDate}</span>
          <span>阅读时长：{report.readTime}</span>
        </Meta>
      </ReportHeader>

      {report.sections.map(section => (
        <Section key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>
          <SectionContent>{section.content}</SectionContent>
        </Section>
      ))}
    </ReportContainer>
  );
};
```

---

## 六、数据验证清单

创建文档数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 加密文件夹包含password和hint
- [ ] 文件路径正确且文件存在
- [ ] 文本内容使用\n表示换行
- [ ] 调查报道章节顺序正确
- [ ] 字数统计准确
- [ ] 内容符合叙事设计和信息分阶段释放原则
- [ ] JSON格式正确，无语法错误

---

**文档完成日期**: 2026-01-31

**下一步**: 创建tieba-structure.md（贴吧帖子结构）
