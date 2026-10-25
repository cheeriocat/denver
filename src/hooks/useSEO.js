// src/hooks/useSEO.js
// Sets page title and meta description dynamically.

import { useEffect } from 'react';

export function useSEO({ title, description }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Denver`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);
}
