'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export function SwaggerUIComponent() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(err => console.error('Failed to load API spec:', err));
  }, []);

  if (!spec) {
    return <div>Loading API documentation...</div>;
  }

  return (
    <div className="swagger-ui-container">
      <SwaggerUI spec={spec} />
    </div>
  );
}