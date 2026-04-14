import { useEffect, useState } from 'react';
import { adminCall } from '../lib/api';
import StatCard from '../components/StatCard';
import { Users, Wallet, ArrowLeftRight, Landmark } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminCall('getDashboardStats')
      .then(setStats)
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load dashboard metrics.');
      });
  }, []);

  const formatNgn = (val: number) => '₦' + val.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  if (error) return (
    <div className="p-12 text-center bg-white rounded-2xl border shadow-sm">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Landmark className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-colors">
        Try Again
      </button>
    </div>
  );

  if (!stats) return <div className="p-8 text-gray-500 font-medium animate-pulse">Loading dashboard overview...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h1>
        <p className="text-gray-500 mt-1 font-medium">Platform metrics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.usersCount} icon={<Users />} />
        <StatCard title="Global Wallet Balance" value={formatNgn(stats.totalBalance)} icon={<Wallet />} />
        <StatCard title="This Month Vol." value={formatNgn(stats.thisMonthVolume)} icon={<ArrowLeftRight />} />
        <StatCard 
          title="Pending Withdrawals" 
          value={`${stats.pendingWithdrawalsCount} (${formatNgn(stats.pendingWithdrawalsAmount)})`} 
          icon={<Landmark />} 
          className={stats.pendingWithdrawalsCount > 0 ? "border-amber-200 bg-amber-50" : ""}
        />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {stats.recentTxs?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{tx.profiles?.full_name || 'System'}</td>
                  <td className="p-4"><span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">{tx.type}</span></td>
                  <td className="p-4 font-bold text-gray-900">{formatNgn(tx.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tx.status === 'success' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 font-medium whitespace-nowrap">{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</td>
                </tr>
              ))}
              {stats.recentTxs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No recent transactions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
