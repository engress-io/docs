import React from 'react';
import Layout from '@theme-original/Layout';
import type {Props} from '@theme/Layout';
import {useLocation} from '@docusaurus/router';
import InternalDocsGate from '@site/src/components/InternalDocsGate';

export default function LayoutWrapper(props: Props): React.JSX.Element {
  const location = useLocation();
  const isInternal = location.pathname.includes('/internal');

  if (isInternal) {
    return (
      <InternalDocsGate>
        <Layout {...props} />
      </InternalDocsGate>
    );
  }

  return <Layout {...props} />;
}
