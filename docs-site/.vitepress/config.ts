import { defineConfig } from 'vitepress';

// The docs site is served under the same GitHub Pages domain as the landing
// page (#160), one level down at /windows-xp/docs/ (#214).
export default defineConfig({
  base: '/windows-xp/docs/',
  title: 'Windows XP Desktop Engine',
  description:
    'Docs for @caoergou/windows-xp — an embeddable, scriptable Windows XP desktop engine for React.',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/windows-xp/favicon.ico' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Events', link: '/guide/events' },
      { text: 'Components', link: '/components' },
      { text: 'API', link: '/api/' },
      { text: 'Live demo', link: '/windows-xp/demo/en/' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@caoergou/windows-xp' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Installation & quick start', link: '/guide/getting-started' },
            { text: 'Props reference', link: '/guide/props' },
            { text: 'Keyboard shortcuts', link: '/guide/keyboard' },
          ],
        },
        {
          text: 'Content & scripting',
          items: [
            { text: 'Make the desktop yours', link: '/guide/content' },
            { text: 'Build a blog on the desktop', link: '/guide/blog' },
            { text: 'Events & imperative control', link: '/guide/events' },
            { text: 'Scenario system', link: '/guide/scenarios' },
            { text: 'Guided lessons', link: '/guide/lessons' },
          ],
        },
        {
          text: 'Embedding',
          items: [
            { text: 'Embedding in a host app', link: '/guide/embedding' },
            { text: 'SSR / Next.js', link: '/guide/ssr' },
            { text: 'Subpath imports & primitives', link: '/guide/subpaths' },
            { text: 'Styling', link: '/guide/styling' },
            { text: 'Performance', link: '/guide/performance' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Component gallery', link: '/components' },
            { text: 'API (TypeDoc)', link: '/api/' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/caoergou/windows-xp' }],
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/caoergou/windows-xp/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub',
    },
  },

  // Chinese locale mirrors the README.zh-CN convention (#214). Content pages are
  // English-primary; the zh home + guide index are translated, and the rest
  // fall back gracefully while the translation fills in.
  locales: {
    root: { label: 'English', lang: 'en' },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '快速开始', link: '/zh/guide/getting-started' },
          { text: '事件', link: '/guide/events' },
          { text: '组件', link: '/zh/components' },
          { text: 'API', link: '/api/' },
          { text: '在线演示', link: '/windows-xp/demo/zh/' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@caoergou/windows-xp' },
        ],
        // Chinese pages are being migrated page-by-page (like README.zh-CN);
        // topics without a zh page yet link to the English guide.
        sidebar: {
          '/zh/': [
            {
              text: '开始',
              items: [
                { text: '安装与快速开始', link: '/zh/guide/getting-started' },
                { text: '打造你的专属桌面', link: '/zh/guide/content' },
                { text: '在桌面上搭建博客', link: '/zh/guide/blog' },
                { text: '组件画廊', link: '/zh/components' },
              ],
            },
            {
              text: '核心概念',
              items: [
                { text: '事件与命令式控制', link: '/zh/guide/events' },
                { text: '嵌入宿主应用', link: '/zh/guide/embedding' },
              ],
            },
            {
              text: '更多参考',
              items: [
                { text: 'Props 参考', link: '/guide/props' },
                { text: '键盘快捷键', link: '/guide/keyboard' },
                { text: '场景系统', link: '/guide/scenarios' },
                { text: '引导式教程', link: '/guide/lessons' },
                { text: 'SSR / Next.js', link: '/guide/ssr' },
                { text: '子路径导入与基础组件', link: '/guide/subpaths' },
                { text: '样式定制', link: '/guide/styling' },
                { text: '性能', link: '/guide/performance' },
                { text: '故障排查', link: '/guide/troubleshooting' },
                { text: 'API 参考', link: '/api/' },
              ],
            },
          ],
        },
        docFooter: { prev: '上一页', next: '下一页' },
        outline: { label: '本页目录' },
        lastUpdatedText: '最后更新',
        editLink: {
          pattern: 'https://github.com/caoergou/windows-xp/edit/main/docs-site/:path',
          text: '在 GitHub 上编辑此页',
        },
      },
    },
  },

  // Cross-page anchors carried over from the single USAGE.md and links into the
  // repo's /docs/*.md and the sibling Pages routes (/windows-xp/…) aren't part
  // of this VitePress graph — don't fail the build on them.
  ignoreDeadLinks: true,
});
