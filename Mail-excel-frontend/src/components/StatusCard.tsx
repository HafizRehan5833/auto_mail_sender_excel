import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Users } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: 'success' | 'warning' | 'pending' | 'users';
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatusCard: React.FC<StatusCardProps> = ({ 
  title, 
  value, 
  icon, 
  description,
  trend 
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'users':
        return <Users className="w-6 h-6 text-purple-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getIconBg = () => {
    switch (icon) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'pending':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'users':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg border ${getIconBg()}`}>
          {getIcon()}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 font-medium">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};