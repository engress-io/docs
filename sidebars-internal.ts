import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  internal: [
    'index',
    {
      type: 'category',
      label: 'Operator Atlas',
      link: {type: 'doc', id: 'atlas/README'},
      items: [
        'atlas/glossary',
        'atlas/system-overview',
        'atlas/network-topology',
        'atlas/aws-inventory',
        'atlas/data-layer',
        'atlas/identity-auth',
        'atlas/cicd-deploy',
        'atlas/secrets-config',
        'atlas/third-party',
        'atlas/onboarding',
        'atlas/gap-register',
        'atlas/appendix-live',
        'atlas/appendix-collect-log',
      ],
    },
  ],
};

export default sidebars;
