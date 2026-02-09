import React from 'react';
import ReactDOM from 'react-dom/client';
import { DocumentQA } from '@bree-ai/core/components';
import { currentBrand } from '@bree-ai/core/config';
import './index.css';

// Keen.ai specific configuration
console.log('Starting', currentBrand.displayName);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DocumentQA 
      subtitle="HabitAware Intelligence"
      description="Explore our knowledge base on awareness-building and habit change."
      showAdmin={true}
      brandLogo={currentBrand.logo}
      brandColor={currentBrand.colors.primary}
      instructionsPath={currentBrand.instructionsPath || "/instructions/habitaware-ai.md"}
    />
  </React.StrictMode>
);
