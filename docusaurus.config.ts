import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const clerkPublishableKey =
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  '';

const config: Config = {
  title: 'Engress',
  tagline: 'Tunnel local AI models over HTTPS',
  favicon: 'img/favicon.ico',

  url: 'https://engress.io',
  baseUrl: '/docs/',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    mermaid: true,
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        docsRouteBasePath: '/',
        docsDir: 'docs',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        // Public docs only — internal atlas is client-gated (G19) and must not ship in the index.
        ignoreFiles: [/^internal(\/|$)/],
      } satisfies import('@easyops-cn/docusaurus-search-local').PluginOptions,
    ],
  ],

  organizationName: 'engress-io',
  projectName: 'docs',

  customFields: {
    clerkPublishableKey,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          id: 'public',
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'internal',
        path: 'internal',
        routeBasePath: 'internal',
        sidebarPath: './sidebars-internal.ts',
      },
    ],
    'docusaurus-plugin-copy-page-button',
    [
      'docusaurus-plugin-llms',
      {
        title: 'Engress Documentation',
        description:
          'Tunnel local AI models over HTTPS with engress — CLI, integrations, and API reference.',
        docsDir: 'docs',
        ignoreFiles: ['internal/**'],
        includeBlog: false,
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        excludeImports: true,
        removeDuplicateHeadings: true,
        rootContent: `Engress exposes local AI servers (Ollama, LM Studio, vLLM, etc.) on stable HTTPS URLs without opening inbound firewall ports.

- Product: https://engress.io
- Downloads: https://engress.io/downloads
- Dashboard: https://engress.io`,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      hideOnScroll: false,
      items: [
        {
          to: '/internal',
          label: 'Internal',
          position: 'left',
        },
        {
          href: 'https://engress.io',
          label: 'Dashboard',
          position: 'right',
        },
        {
          href: 'https://engress.io/downloads',
          label: 'Downloads',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `© ${new Date().getFullYear()} Ghost Weasel Labs`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'powershell'],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
