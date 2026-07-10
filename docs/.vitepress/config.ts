import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const siteName = 'Cloudflare 实战手册';
const siteDescription = 'AI 编程时代的 Cloudflare 实战手册——用 AI 写代码，用 Cloudflare 部署到全球。';
const siteUrl = 'https://chendahuang.com/playbook/cloudflare/';

function getPageUrl(relativePath: string) {
  const path = relativePath
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '');

  return new URL(path, siteUrl).toString();
}

export default withMermaid(defineConfig({
  title: siteName,
  description: siteDescription,
  lang: 'zh-CN',
  // 子路径部署：把 Cloudflare 手册归到个人品牌主域的 playbook 栏目下。
  base: '/playbook/cloudflare/',
  outDir: './.vitepress/dist/playbook/cloudflare',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: siteUrl
  },
  markdown: {
    theme: {
      light: 'github-light-high-contrast',
      dark: 'github-dark-high-contrast'
    }
  },
  vite: {
    build: {
      // Mermaid's runtime and Wardley parser chunks are intentionally about 600 KB
      // uncompressed. Keep the warning close to that measured size so real growth
      // still shows up.
      chunkSizeWarningLimit: 700
    }
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/playbook/cloudflare/favicon.svg' }],
    ['meta', { name: 'impact-site-verification', value: '9a0987ea-1a38-4f72-9047-94b3928e3d80' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: siteName }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'theme-color', content: '#9a3412' }]
  ],
  transformPageData(pageData) {
    const canonicalUrl = getPageUrl(pageData.relativePath);
    const title = pageData.title === siteName ? siteName : `${pageData.title} | ${siteName}`;
    const description = String(pageData.frontmatter.description ?? siteDescription);

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    );
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: '手册', link: '/' },
      { text: 'Agents', link: '/agents' },
      { text: '域名', link: '/domain' },
      { text: '邮件', link: '/email' },
      { text: 'GitHub', link: 'https://github.com/realchendahuang/cloudflare-playbook' }
    ],
    search: {
      provider: 'local'
    },
    outline: {
      level: [2, 3],
      label: '目录'
    },
    lastUpdated: {
      text: '最后更新于'
    },
    editLink: {
      pattern: 'https://github.com/realchendahuang/cloudflare-playbook/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/realchendahuang/cloudflare-playbook' }
    ],
    footer: {
      message: 'Cloudflare Playbook',
      copyright: 'Content licensed under CC BY-SA 4.0'
    }
  }
}));
