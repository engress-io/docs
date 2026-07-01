import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Footer(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const year = new Date().getFullYear();

  return (
    <footer className="docs-footer">
      <div className="docs-footer-inner">
        <nav className="docs-footer-nav" aria-label="Footer">
          <Link to="/downloads">Downloads</Link>
          <Link to="/agent">engress CLI</Link>
          <Link to="/integrations">Integrations</Link>
          <Link to="/api">API</Link>
          <Link to="/security">Security</Link>
          <Link to="/faq">FAQ</Link>
          <a href="https://engress.io/docs/llms.txt">llms.txt</a>
          <Link to="/internal">Internal</Link>
          <a href="https://engress.io">Dashboard</a>
        </nav>
        <p className="docs-footer-copy">
          © {year} Ghost Weasel Labs · {siteConfig.tagline}
        </p>
      </div>
    </footer>
  );
}
