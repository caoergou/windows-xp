# 贴吧数据结构设计

*版本：1.0*
*日期：2026-01-31*

---

## 一、概述

贴吧系统模拟2015-2016年的百度贴吧论坛，主要用于展示针对林晓宇的网络暴力（"偷拍狂"谣言）。贴吧内容是红鲱鱼#1（情绪自杀）的重要组成部分。

### 设计目的

1. **展示网络暴力**：通过帖子和回复展现林晓宇遭受的舆论攻击
2. **红鲱鱼铺垫**：让玩家前20分钟以为是"网络暴力导致自杀"
3. **时间线索**：帖子发布时间与事件时间线对应
4. **删帖痕迹**：部分回复被删除，暗示舆论操控

---

## 二、贴吧数据结构

### 文件位置

`src/data/tieba/yunshan_yizhong/index.json` - 贴吧信息
`src/data/tieba/yunshan_yizhong/tiezi/{post_id}.json` - 帖子内容

### 2.1 贴吧信息结构

```json
{
  "forumId": "yunshan_yizhong",
  "forumName": "云山一中吧",
  "description": "云山县第一中学贴吧",
  "avatar": "/avatars/forum_yunshan_yizhong.jpg",
  "memberCount": 3421,
  "postCount": 15678,
  "posts": [
    {
      "id": "post_001",
      "title": "【爆料】高一某男生偷拍女生，被当场抓获",
      "author": "正义路人甲",
      "authorId": "user_anonymous_001",
      "publishTime": "2015-12-20 18:30:00",
      "replyCount": 156,
      "viewCount": 2341,
      "status": "deleted",
      "path": "/tieba/yunshan_yizhong/tiezi/post_001.json"
    },
    {
      "id": "post_002",
      "title": "那个偷拍的人还在学校吗？",
      "author": "匿名用户",
      "authorId": "user_anonymous_002",
      "publishTime": "2016-01-10 20:15:00",
      "replyCount": 89,
      "viewCount": 1523,
      "status": "active",
      "path": "/tieba/yunshan_yizhong/tiezi/post_002.json"
    },
    {
      "id": "post_003",
      "title": "听说那个人是摄影社的？",
      "author": "吃瓜群众",
      "authorId": "user_anonymous_003",
      "publishTime": "2016-01-25 14:20:00",
      "replyCount": 67,
      "viewCount": 1102,
      "status": "active",
      "path": "/tieba/yunshan_yizhong/tiezi/post_003.json"
    }
  ]
}
```

### 2.2 帖子详情结构

```json
{
  "id": "post_001",
  "title": "【爆料】高一某男生偷拍女生，被当场抓获",
  "author": "正义路人甲",
  "authorId": "user_anonymous_001",
  "authorAvatar": "/avatars/anonymous.jpg",
  "publishTime": "2015-12-20 18:30:00",
  "content": "今天在学校看到一个男生拿着相机偷拍女生，被学姐当场抓住了。听说是高一的，经常在校园里拍照。\n\n这种人太恶心了，学校应该严肃处理！\n\n大家小心点，看到拿相机的男生离远点。",
  "images": [],
  "replyCount": 156,
  "viewCount": 2341,
  "status": "deleted",
  "deleteReason": "违反社区规定",
  "deleteTime": "2016-02-20 10:00:00",
  "replies": [
    {
      "floor": 1,
      "author": "路过的学生",
      "authorId": "user_student_001",
      "authorAvatar": "/avatars/student_001.jpg",
      "time": "2015-12-20 18:45:00",
      "content": "卧槽，真的假的？",
      "likes": 23,
      "status": "active"
    },
    {
      "floor": 2,
      "author": "知情人士",
      "authorId": "user_insider_001",
      "authorAvatar": "/avatars/anonymous.jpg",
      "time": "2015-12-20 19:00:00",
      "content": "我也听说了，好像是摄影社的。平时总是拿着相机到处拍。",
      "likes": 45,
      "status": "active"
    },
    {
      "floor": 3,
      "author": "正义使者",
      "authorId": "user_justice_001",
      "authorAvatar": "/avatars/anonymous.jpg",
      "time": "2015-12-20 19:15:00",
      "content": "这种人渣应该开除！",
      "likes": 67,
      "status": "active"
    },
    {
      "floor": 23,
      "author": "[已删除]",
      "authorId": "deleted",
      "authorAvatar": "/avatars/deleted.jpg",
      "time": "2015-12-21 10:30:00",
      "content": "[该回复已被删除]",
      "likes": 0,
      "status": "deleted",
      "deleteReason": "用户主动删除"
    },
    {
      "floor": 45,
      "author": "理性分析",
      "authorId": "user_rational_001",
      "authorAvatar": "/avatars/student_002.jpg",
      "time": "2015-12-22 14:20:00",
      "content": "有没有证据？不要随便污蔑别人。",
      "likes": 12,
      "status": "active"
    },
    {
      "floor": 46,
      "author": "正义路人甲",
      "authorId": "user_anonymous_001",
      "authorAvatar": "/avatars/anonymous.jpg",
      "time": "2015-12-22 14:30:00",
      "content": "回复45楼：我亲眼看到的，还需要什么证据？",
      "likes": 34,
      "status": "active"
    },
    {
      "floor": 78,
      "author": "[已删除]",
      "authorId": "deleted",
      "authorAvatar": "/avatars/deleted.jpg",
      "time": "2015-12-25 16:00:00",
      "content": "[该回复已被删除]",
      "likes": 0,
      "status": "deleted",
      "deleteReason": "违反社区规定"
    }
  ]
}
```

---

## 三、字段说明

### 贴吧信息对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| forumId | string | 是 | 贴吧唯一标识符 |
| forumName | string | 是 | 贴吧名称 |
| description | string | 否 | 贴吧描述 |
| avatar | string | 否 | 贴吧头像 |
| memberCount | number | 否 | 成员数量 |
| postCount | number | 否 | 帖子总数 |
| posts | array | 是 | 帖子列表（摘要） |

### 帖子摘要对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子唯一标识符 |
| title | string | 是 | 帖子标题 |
| author | string | 是 | 作者昵称 |
| authorId | string | 是 | 作者ID |
| publishTime | string | 是 | 发布时间（YYYY-MM-DD HH:mm:ss） |
| replyCount | number | 是 | 回复数量 |
| viewCount | number | 是 | 浏览量 |
| status | string | 是 | 状态（active/deleted） |
| path | string | 是 | 帖子详情文件路径 |

### 帖子详情对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子唯一标识符 |
| title | string | 是 | 帖子标题 |
| author | string | 是 | 作者昵称 |
| authorId | string | 是 | 作者ID |
| authorAvatar | string | 是 | 作者头像 |
| publishTime | string | 是 | 发布时间 |
| content | string | 是 | 帖子内容 |
| images | array | 否 | 配图列表 |
| replyCount | number | 是 | 回复数量 |
| viewCount | number | 是 | 浏览量 |
| status | string | 是 | 状态（active/deleted） |
| deleteReason | string | 否 | 删除原因（如果status=deleted） |
| deleteTime | string | 否 | 删除时间（如果status=deleted） |
| replies | array | 是 | 回复列表 |

### 回复对象

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| floor | number | 是 | 楼层号 |
| author | string | 是 | 作者昵称 |
| authorId | string | 是 | 作者ID |
| authorAvatar | string | 是 | 作者头像 |
| time | string | 是 | 回复时间 |
| content | string | 是 | 回复内容 |
| likes | number | 否 | 点赞数 |
| status | string | 是 | 状态（active/deleted） |
| deleteReason | string | 否 | 删除原因（如果status=deleted） |

---

## 四、关键设计要点

### 4.1 时间线对应

帖子发布时间与事件时间线对应：

| 帖子 | 发布时间 | 对应事件 |
|------|---------|---------|
| post_001 | 2015-12-20 | 林晓宇举报后3天，谣言开始传播 |
| post_002 | 2016-01-10 | 网络暴力持续 |
| post_003 | 2016-01-25 | 林晓宇坠楼前20天 |

### 4.2 删帖痕迹

部分回复被删除，暗示舆论操控：

- **楼层23**：可能是为林晓宇辩护的回复，被删除
- **楼层78**：可能揭露真相的回复，被删除
- **整个帖子**：post_001在林晓宇坠楼后被删除（2016-02-20）

### 4.3 匿名用户

大部分发帖和回复者使用匿名账号，增加真实感：

- `user_anonymous_001` - 正义路人甲
- `user_anonymous_002` - 匿名用户
- `user_anonymous_003` - 吃瓜群众

### 4.4 内容真实性

帖子内容刻意模糊，没有具体证据：

- ✅ "听说"、"好像"、"据说"
- ✅ 没有照片证据
- ✅ 没有具体时间地点
- ❌ 不要出现具体的"偷拍照片"

---

## 五、前端集成说明

### 1. 贴吧列表加载

```javascript
const TiebaApp = () => {
  const [forumData, setForumData] = useState(null);

  useEffect(() => {
    import('../data/tieba/yunshan_yizhong/index.json')
      .then(module => setForumData(module.default));
  }, []);

  if (!forumData) return <div>加载中...</div>;

  return (
    <ForumContainer>
      <ForumHeader>
        <ForumAvatar src={forumData.avatar} />
        <ForumInfo>
          <h1>{forumData.forumName}</h1>
          <p>{forumData.description}</p>
          <Stats>
            <span>成员：{forumData.memberCount}</span>
            <span>帖子：{forumData.postCount}</span>
          </Stats>
        </ForumInfo>
      </ForumHeader>

      <PostList>
        {forumData.posts.map(post => (
          <PostItem key={post.id} post={post} />
        ))}
      </PostList>
    </ForumContainer>
  );
};
```

### 2. 帖子详情加载

```javascript
const PostDetail = ({ postId }) => {
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    import(`../data/tieba/yunshan_yizhong/tiezi/${postId}.json`)
      .then(module => setPostData(module.default));
  }, [postId]);

  if (!postData) return <div>加载中...</div>;

  // 如果帖子已删除，显示删除提示
  if (postData.status === 'deleted') {
    return (
      <DeletedPost>
        <p>该帖子已被删除</p>
        <p>删除原因：{postData.deleteReason}</p>
        <p>删除时间：{postData.deleteTime}</p>
      </DeletedPost>
    );
  }

  return (
    <PostContainer>
      <PostHeader>
        <h1>{postData.title}</h1>
        <AuthorInfo>
          <Avatar src={postData.authorAvatar} />
          <span>{postData.author}</span>
          <span>{postData.publishTime}</span>
        </AuthorInfo>
      </PostHeader>

      <PostContent>{postData.content}</PostContent>

      <ReplyList>
        {postData.replies.map(reply => (
          <ReplyItem key={reply.floor} reply={reply} />
        ))}
      </ReplyList>
    </PostContainer>
  );
};
```

### 3. 删除回复显示

```javascript
const ReplyItem = ({ reply }) => {
  if (reply.status === 'deleted') {
    return (
      <DeletedReply>
        <FloorNumber>{reply.floor}楼</FloorNumber>
        <DeletedContent>
          <span>[该回复已被删除]</span>
          {reply.deleteReason && (
            <span className="reason">原因：{reply.deleteReason}</span>
          )}
        </DeletedContent>
      </DeletedReply>
    );
  }

  return (
    <Reply>
      <FloorNumber>{reply.floor}楼</FloorNumber>
      <AuthorInfo>
        <Avatar src={reply.authorAvatar} />
        <span>{reply.author}</span>
        <span>{reply.time}</span>
      </AuthorInfo>
      <Content>{reply.content}</Content>
      <Likes>👍 {reply.likes}</Likes>
    </Reply>
  );
};
```

### 4. 动态加载所有帖子

```javascript
// 使用 import.meta.glob 动态加载
const allPosts = import.meta.glob('../data/tieba/**/tiezi/*.json');

const loadAllPosts = async (forumId) => {
  const posts = [];

  for (const path in allPosts) {
    if (path.includes(`/${forumId}/`)) {
      const module = await allPosts[path]();
      posts.push(module.default);
    }
  }

  return posts;
};
```

---

## 六、完整示例

### 示例帖子：post_002.json

```json
{
  "id": "post_002",
  "title": "那个偷拍的人还在学校吗？",
  "author": "匿名用户",
  "authorId": "user_anonymous_002",
  "authorAvatar": "/avatars/anonymous.jpg",
  "publishTime": "2016-01-10 20:15:00",
  "content": "上个月看到有人发帖说学校有个偷拍狂，现在还在学校吗？\n\n学校有没有处理？\n\n感觉很不安全。",
  "images": [],
  "replyCount": 89,
  "viewCount": 1523,
  "status": "active",
  "replies": [
    {
      "floor": 1,
      "author": "知情人",
      "authorId": "user_insider_002",
      "authorAvatar": "/avatars/anonymous.jpg",
      "time": "2016-01-10 20:30:00",
      "content": "好像还在，我上周还看到他拿着相机。",
      "likes": 34,
      "status": "active"
    },
    {
      "floor": 2,
      "author": "路过",
      "authorId": "user_passerby_001",
      "authorAvatar": "/avatars/student_003.jpg",
      "time": "2016-01-10 20:45:00",
      "content": "学校应该严肃处理这种事情！",
      "likes": 56,
      "status": "active"
    },
    {
      "floor": 3,
      "author": "同学A",
      "authorId": "user_student_002",
      "authorAvatar": "/avatars/student_004.jpg",
      "time": "2016-01-10 21:00:00",
      "content": "听说是摄影社的，平时看起来挺老实的。",
      "likes": 23,
      "status": "active"
    },
    {
      "floor": 15,
      "author": "[已删除]",
      "authorId": "deleted",
      "authorAvatar": "/avatars/deleted.jpg",
      "time": "2016-01-11 10:00:00",
      "content": "[该回复已被删除]",
      "likes": 0,
      "status": "deleted",
      "deleteReason": "用户主动删除"
    },
    {
      "floor": 30,
      "author": "理性讨论",
      "authorId": "user_rational_002",
      "authorAvatar": "/avatars/student_005.jpg",
      "time": "2016-01-12 14:00:00",
      "content": "有没有人真的看到他偷拍？还是只是传言？",
      "likes": 8,
      "status": "active"
    },
    {
      "floor": 31,
      "author": "匿名用户",
      "authorId": "user_anonymous_002",
      "authorAvatar": "/avatars/anonymous.jpg",
      "time": "2016-01-12 14:15:00",
      "content": "回复30楼：这么多人都在说，肯定不是空穴来风。",
      "likes": 45,
      "status": "active"
    }
  ]
}
```

---

## 七、数据验证清单

创建贴吧数据时，请确保：

- [ ] 所有必填字段都已填写
- [ ] 时间格式正确（YYYY-MM-DD HH:mm:ss）
- [ ] 时间顺序符合逻辑（回复晚于帖子）
- [ ] 楼层号连续递增
- [ ] 删除的回复标记为status: "deleted"
- [ ] 匿名用户使用统一的头像
- [ ] 帖子内容模糊，没有具体证据
- [ ] 回复数量与replies数组长度一致
- [ ] JSON格式正确，无语法错误

---

**文档完成日期**: 2026-01-31

**下一步**: 创建investigation-notes-structure.md（夏灯调查笔记）
