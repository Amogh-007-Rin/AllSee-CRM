import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, description, className }) => {
  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-sm border border-gray-100", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-full">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {description && (
          <span className="text-xs text-gray-500 mt-1">{description}</span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
