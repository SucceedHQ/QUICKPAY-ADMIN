import { ReactNode } from 'react';

export default function StatCard({ title, value, icon, className = '' }: { title: string, value: string | number, icon: ReactNode, className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-2xl border shadow-sm ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
