import { useEffect, useState } from 'react';
import { adminCall } from '../lib/api';
import { format } from 'date-fns';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await adminCall('getUsers').catch(console.error) || { data: [] };
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSuspend = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) return;
    try {
      await adminCall('suspendUser', { userId, suspended: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, suspended: !currentStatus } : u));
    } catch (e: any) { alert(e.message); }
  };

  const filtered = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (u.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Users Management</h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={search} onChange={e => setSearch(e.target.value)} 
          className="bg-transparent flex-1 outline-none font-medium" 
        />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
              <tr>
                <th className="p-4 font-semibold">User Details</th>
                <th className="p-4 font-semibold">Wallet</th>
                <th className="p-4 font-semibold">Bank Linked</th>
                <th className="p-4 font-semibold">Joined</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                           {u.full_name || 'Anonymous'}
                           {u.suspended && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Suspended</span>}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{u.email || u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-900">₦{(u.wallet_balance || 0).toLocaleString()}</td>
                  <td className="p-4 text-gray-600 font-medium">
                     {u.bank_name ? `${u.bank_name}` : <span className="text-gray-400 italic">None</span>}
                  </td>
                  <td className="p-4 text-gray-500 font-medium whitespace-nowrap">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-4 text-right">
                     <button 
                       onClick={() => handleSuspend(u.id, !!u.suspended)}
                       className={`p-2 rounded-lg transition-colors ${u.suspended ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                       title={u.suspended ? 'Restore Access' : 'Suspend Account'}
                     >
                        {u.suspended ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
