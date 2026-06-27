import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    'downloads',
    'agent',
    {
      type: 'category',
      label: 'Integrations',
      link: {type: 'doc', id: 'integrations/index'},
      items: [
        'integrations/claude-code',
        'integrations/cursor',
        'integrations/vscode',
        'integrations/grok',
        'integrations/opencode',
        'integrations/openclaw',
        'integrations/hermes',
      ],
    },
    'api',
    'security',
  ],
};

export default sidebars;