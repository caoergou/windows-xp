# AGENTS.md

This file provides guidance for AI coding agents working on the 山月无声 (Silent Mountain Moon) project.

## Project Overview

Interactive mystery game built with React 18 + Vite 5. Players investigate a 2015-2016 tragedy through a simulated Windows XP desktop environment.

**Current phase**: Content creation (story framework complete, filling game assets)

## Quick Start

```bash
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm test             # Run tests
```

## Essential Reading Before Creating Content

**You MUST read these files before creating any game content:**

1. **`docs/人物.md`** - Character personalities, voice, QQ numbers, relationships
   - Read this to understand how each character speaks and behaves
   - Contains character backgrounds and psychological profiles

2. **`docs/data-specs/data-specification.md`** - Complete JSON format specifications
   - Authoritative reference for all data structures
   - Includes QQ Space, Tieba, Email, Chat log formats
   - Contains validation rules and required fields

3. **`docs/大纲.md`** - Story outline and 4-stage spoiler management
   - Critical for understanding what to reveal/hide at each stage
   - Contains the complete narrative structure
   - Explains the "red herring" system

4. **`docs/设计.md`** - Content design specifications and player perspective control
   - Guidelines for creating content that fits each investigation stage
   - Material design principles

5. **`docs/时间线.md`** - Detailed event timeline (2014-2026)
   - Use this to ensure timestamp accuracy
   - Contains all key events and their dates

6. **`docs/解密.md`** - Puzzle and decryption mechanism design
   - Password systems (photography parameters, birthdays)
   - Cross-platform evidence synthesis

## Project Structure

```
src/data/            # Game data (JSON) - PRIMARY WORK AREA
  ├── qzone/         # QQ Space content by user ID
  ├── tieba/         # Forum posts by forum name
  ├── email/         # Email messages (inbox/sent/spam)
  └── qq/            # QQ chat logs

docs/                # Design documents - READ THESE FIRST
  ├── 大纲.md         # Story outline ⭐⭐⭐
  ├── 人物.md         # Character profiles ⭐⭐⭐
  ├── 设计.md         # Design specs ⭐⭐
  ├── 时间线.md       # Timeline ⭐⭐
  ├── 解密.md         # Puzzle design ⭐
  └── data-specs/    # JSON format specs ⭐⭐⭐
      ├── data-specification.md
      └── exif-metadata-structure.md

assets/              # Content drafts (markdown, not used in game)
  └── 清单.md         # Content checklist

CLAUDE.md            # Detailed architecture documentation
```

## Content Creation Workflow

### Step 1: Read Core Design Documents (ALWAYS)

**You MUST read these 3 files before creating ANY content:**

```bash
1. docs/大纲.md    # Story structure, 4-stage spoiler management, narrative framework
2. docs/设计.md    # Design principles, player perspective control, content guidelines
3. docs/解密.md    # Puzzle mechanics, password systems, evidence synthesis
```

These documents contain the fundamental design principles that govern ALL content creation.

### Step 2: Read Task-Specific Documents (AS NEEDED)

Based on what you're creating, read:

```bash
# Creating character content (QQ Space, chat logs)?
→ docs/人物.md              # Character voice, personality, relationships

# Need specific dates/timestamps?
→ docs/时间线.md            # Detailed event timeline

# Creating JSON data files?
→ docs/data-specs/data-specification.md  # Complete format specifications
```

### Step 3: Create Content

- Respect spoiler boundaries from `docs/大纲.md`
- Follow design principles from `docs/设计.md`
- Consider puzzle integration from `docs/解密.md`
- Match character voice from `docs/人物.md` (if applicable)
- Use accurate timestamps from `docs/时间线.md` (if applicable)
- Follow JSON format from `docs/data-specs/data-specification.md` (if applicable)

### Step 4: Place Files

```bash
# QQ Space content
src/data/qzone/{user_id}/
  ├── index.json       # User profile
  ├── shuoshuo.json    # Posts array
  ├── blog.json        # Blogs array
  └── pictures/        # Photo albums

# Forum content
src/data/tieba/{forum_name}/
  ├── index.json       # Forum info
  └── tiezi/{id}.json  # Individual threads

# Email
src/data/email/{inbox|sent|spam}/{id}.json

# Chat logs
src/data/qq/{conversation_id}.json
```

### Step 5: Validate

- ✅ JSON syntax valid
- ✅ Timestamp within valid range (see `docs/时间线.md`)
- ✅ Character voice matches `docs/人物.md`
- ✅ No premature spoilers (check `docs/大纲.md` stage boundaries)
- ✅ Era-appropriate language (2015-2016, see `docs/设计.md`)

## Quick Reference

### Character QQ Numbers

See `docs/人物.md` for complete profiles.

- Lin Xiaoyu (林晓宇): 809261392
- Chen Mo (陈默): TBD
- Xia Deng (夏灯): TBD

### Timeline Boundaries

See `docs/时间线.md` for detailed events.

```
2014.09 - High school starts
2015.09 - Sophomore year begins
2016.04 - Lin Xiaoyu's death
2016.06 - Gaokao
2026.XX - Investigation timeline
```

### Spoiler Management

See `docs/大纲.md` for complete stage breakdown.

| Stage | Duration | Read Section in 大纲.md |
|-------|----------|------------------------|
| Stage 1 | 60min | 阶段一：个体悬疑 |
| Stage 2 | 70min | 阶段二：证据指向 |
| Stage 3 | 50min | 阶段三：真相反转 |
| Stage 4 | 40min | 阶段四：系统揭露 |

**Critical**: Always check which stage your content belongs to and what information should be hidden.

## Data Format Reference

**Do NOT duplicate format specs here.** Always refer to:

- **`docs/data-specs/data-specification.md`** - Complete JSON schemas
- **`docs/data-specs/exif-metadata-structure.md`** - Photo metadata format

Quick links to common formats:

- QQ Space posts: See `data-specification.md` § QQ空间说说
- QQ Space blogs: See `data-specification.md` § QQ空间日志
- Forum posts: See `data-specification.md` § 贴吧帖子
- Emails: See `data-specification.md` § 邮件
- Chat logs: See `data-specification.md` § QQ聊天记录

## Code Style

- **React**: Functional components with hooks
- **Styling**: styled-components (XP theme via xp.css)
- **State**: React Context (no Redux)
- **File naming**: PascalCase for components, camelCase for utilities

## Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

## Git Conventions

```bash
# Commit message format
feat(qzone): add Lin Xiaoyu posts for Dec 2015
fix(tieba): correct timestamp in thread 12345
content(email): add investigation emails for stage 2
docs: update character profile for Chen Mo
```

## Common Tasks

**Prerequisites for ALL tasks**: Read the 3 core docs (`docs/大纲.md`, `docs/设计.md`, `docs/解密.md`) first.

### Add QQ Space Content

1. Read `docs/人物.md` for character voice
2. Verify timestamp in `docs/时间线.md`
3. Follow format in `docs/data-specs/data-specification.md`
4. Edit `src/data/qzone/{user_id}/shuoshuo.json` or `blog.json`

### Add Forum Post

1. Follow format in `docs/data-specs/data-specification.md`
2. Create `src/data/tieba/{forum}/tiezi/{id}.json`
3. Update `src/data/tieba/{forum}/index.json` thread list

### Add Email

1. Verify sender/recipient in `docs/人物.md`
2. Check timeline in `docs/时间线.md`
3. Follow format in `docs/data-specs/data-specification.md`
4. Create JSON in `src/data/email/{folder}/`

## Critical Rules

### Communication

- ✅ **ALWAYS** respond in Chinese (中文) when working on this project
- ✅ **ALWAYS** use Chinese for explanations, summaries, and documentation
- ✅ Code comments can be in English, but all communication with the user must be in Chinese

### Content Creation

- ❌ **NEVER** create content without reading the 3 core docs first (`docs/大纲.md`, `docs/设计.md`, `docs/解密.md`)
- ❌ **NEVER** reveal information early (stage boundaries are in `docs/大纲.md`)
- ❌ **NEVER** violate design principles (all principles are in `docs/设计.md`)
- ❌ **NEVER** use timestamps outside valid ranges (see `docs/时间线.md`)
- ❌ **NEVER** guess JSON format (always check `docs/data-specs/`)
- ❌ **NEVER** use post-2016 language/culture (era requirements in `docs/设计.md`)

### Code Modification

- ❌ **NEVER** modify `src/context/*` without understanding the architecture
- ❌ **NEVER** change window management system without reading `CLAUDE.md`
- ❌ **NEVER** break component restoration logic in `WindowFactory.jsx`

## Architecture Notes

For detailed technical architecture, see `CLAUDE.md`.

Key systems:

- **Window persistence**: localStorage + WindowFactory
- **Dynamic loading**: `import.meta.glob` for content files
- **Context hierarchy**: UserSession → FileSystem → WindowManager → Modal

## When in Doubt

1. **Character voice?** → Read `docs/人物.md`
2. **What to reveal?** → Read `docs/大纲.md`
3. **When did this happen?** → Read `docs/时间线.md`
4. **JSON format?** → Read `docs/data-specs/data-specification.md`
5. **Design principles?** → Read `docs/设计.md`
6. **Technical architecture?** → Read `CLAUDE.md`

## Content Checklist

Before submitting any content, verify:

**Core Documents (MANDATORY)**:

- [ ] Read `docs/大纲.md` - Understand story structure and stage boundaries
- [ ] Read `docs/设计.md` - Follow design principles and era requirements
- [ ] Read `docs/解密.md` - Consider puzzle integration

**Task-Specific Documents (AS NEEDED)**:

- [ ] Read `docs/人物.md` - Match character voice (if character content)
- [ ] Read `docs/时间线.md` - Verify timestamp accuracy (if dated content)
- [ ] Read `docs/data-specs/data-specification.md` - Follow JSON format (if creating data files)

**Validation**:

- [ ] JSON syntax is valid
- [ ] No premature spoilers (stage boundaries respected)
- [ ] Character voice is consistent
- [ ] No anachronisms (2015-2016 era only)
- [ ] Design principles followed
