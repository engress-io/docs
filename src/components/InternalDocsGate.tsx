import React, {useCallback, useEffect, useState, type ReactNode} from 'react';
import {SignInButton, useAuth} from '@clerk/react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type GateState = 'loading' | 'denied' | 'allowed';

/**
 * Client-side gate for /internal/* docs. Requires Clerk sign-in and platform
 * admin (Oasis) access via the control-plane API.
 *
 * Note: static HTML is still on the public CDN — do not embed secret values.
 */
export default function InternalDocsGate({children}: {children: ReactNode}) {
  const {siteConfig} = useDocusaurusContext();
  const clerkKey = (siteConfig.customFields?.clerkPublishableKey as string) || '';
  const {isLoaded, isSignedIn, getToken} = useAuth();
  const [state, setState] = useState<GateState>('loading');
  const [detail, setDetail] = useState('');

  const checkAccess = useCallback(async () => {
    if (!isSignedIn) {
      setState('denied');
      setDetail('Sign in with your Engress staff account to continue.');
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setState('denied');
        setDetail('Could not read Clerk session token.');
        return;
      }
      const res = await fetch('https://engress.io/api/v1/oasis/dashboard', {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.ok) {
        setState('allowed');
        setDetail('');
        return;
      }
      setState('denied');
      setDetail(
        res.status === 403 || res.status === 401
          ? 'Platform admin access required. Contact an operator to be added to platform_admins.'
          : `Access check failed (HTTP ${res.status}).`,
      );
    } catch (err) {
      setState('denied');
      setDetail(err instanceof Error ? err.message : 'Access check failed.');
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!clerkKey) {
      setState('denied');
      setDetail('Clerk is not configured for this docs build (missing publishable key).');
      return;
    }
    if (!isLoaded) {
      return;
    }
    void checkAccess();
  }, [checkAccess, clerkKey, isLoaded]);

  if (!clerkKey) {
    return (
      <div className="container margin-vert--lg">
        <h1>Internal documentation</h1>
        <p>{detail || 'Clerk publishable key not configured.'}</p>
      </div>
    );
  }

  if (!isLoaded || state === 'loading') {
    return (
      <div className="container margin-vert--lg">
        <p>Checking access…</p>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="container margin-vert--lg">
        <h1>Internal documentation</h1>
        <p>{detail}</p>
        {!isSignedIn && (
          <SignInButton mode="modal">
            <button type="button" className="button button--primary margin-top--md">
              Sign in
            </button>
          </SignInButton>
        )}
        <p className="margin-top--lg">
          <a href="/">← Back to public documentation</a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
