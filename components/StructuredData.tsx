import React from 'react';

interface StructuredDataProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Injects valid Schema.org JSON-LD structured data into the page head safely
 */
export function StructuredData({ data }: StructuredDataProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
