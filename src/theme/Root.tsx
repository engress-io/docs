import React, {type ReactNode} from 'react';
import {ClerkProvider} from '@clerk/react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Root({children}: {children: ReactNode}) {
  const {siteConfig} = useDocusaurusContext();
  const publishableKey = (siteConfig.customFields?.clerkPublishableKey as string) || '';

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/internal">
      {children}
    </ClerkProvider>
  );
}
