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

  themes: ['@docusaurus/theme-mermaid'],

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
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Engress',
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
      links: [
        {
          title: 'Get started',
          items: [
            {label: 'Downloads', to: '/downloads'},
            {label: 'engress', to: '/agent'},
            {label: 'Integrations', to: '/integrations'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'API', to: '/api'},
            {label: 'Security', to: '/security'},
            {label: 'FAQ', to: '/faq'},
          ],
        },
        {
          title: 'Staff',
          items: [
            {label: 'Internal docs', to: '/internal'},
            {label: 'Oasis dashboard', href: 'https://engress.io/oasis'},
          ],
        },
        {
          title: 'Product',
          items: [
            {label: 'Open dashboard', href: 'https://engress.io'},
            {label: 'Download agent', href: 'https://engress.io/downloads'},
          ],
        },
      ],
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
