import React from 'react';
import ReactDOM from 'react-dom/client';
import { DocumentQA } from '@bree-ai/core/components';
import { currentBrand } from '@bree-ai/core/config';
import './index.css';

// The Vineyard specific configuration
console.log('Starting', currentBrand.displayName);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DocumentQA />
  </React.StrictMode>
);
