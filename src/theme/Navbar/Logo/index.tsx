import React from 'react';
import Link from '@docusaurus/Link';
import {FluxMark} from '@site/src/components/FluxMark';

export default function NavbarLogo(): React.JSX.Element {
  return (
    <Link to="/" className="navbar__brand docs-brand" aria-label="Engress documentation home">
      <FluxMark size={26} />
      <span className="docs-brand-stack">
        <span className="docs-brand-title">Engress</span>
        <span className="docs-brand-sub">Documentation</span>
      </span>
    </Link>
  );
}
