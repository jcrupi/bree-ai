import React from 'react';
import { ProductName } from '../types/task';
import { Heart, TrendingUp, FileText } from 'lucide-react';

interface ProductBadgeProps {
  productName: ProductName;
}

const productConfig: Record<ProductName, { className: string; icon: React.ReactNode }> = {
  'Wound AI': {
    className: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <Heart className="w-3 h-3" />,
  },
  'Performance AI': {
    className: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    icon: <TrendingUp className="w-3 h-3" />,
  },
  'Extraction AI': {
    className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: <FileText className="w-3 h-3" />,
  },
};

export function ProductBadge({ productName }: ProductBadgeProps) {
  const config = productConfig[productName];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      {config.icon}
      {productName}
    </span>
  );
}
