import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  internal: [
    'index',
    {
      type: 'category',
      label: 'Operator Atlas',
      link: {type: 'doc', id: 'atlas/README'},
      items: [
        'atlas/00-glossary',
        'atlas/01-system-overview',
        'atlas/02-network-topology',
        'atlas/03-aws-inventory',
        'atlas/04-data-layer',
        'atlas/05-identity-auth',
        'atlas/06-cicd-deploy',
        'atlas/07-secrets-config',
        'atlas/08-third-party',
        'atlas/09-onboarding',
        'atlas/10-gap-register',
        'atlas/appendix-live',
        'atlas/appendix-collect-log',
      ],
    },
  ],
};

export default sidebars;
