import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Engress',
  tagline: 'Tunnel local AI models over HTTPS',
  favicon: 'img/favicon.ico',

  url: 'https://engress.io',
  baseUrl: '/docs/',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  organizationName: 'engress-io',
  projectName: 'docs',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
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
  } satisfies Preset.ThemeConfig,
};

export default config;
