import { useEffect, useState } from 'react';
import { adminCall } from '../lib/api';
import { format } from 'date-fns';
import { Search, Download } from 'lucide-react';

export default function Transactions() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const loadTxs = async () => {
    setLoading(true);
    const { data } = await adminCall('getTransactionsPage').catch(console.error) || { data: [] };
    setTxs(data);
    setLoading(false);
  };

  useEffect(() => { loadTxs(); }, []);

  const formatNgn = (val: number) => '₦' + val.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const filtered = txs.filter(tx => {
    const matchesSearch = (tx.reference?.toLowerCase() || '').includes(search.toLowerCase()) || 
                          (tx.profiles?.full_name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const exportCsv = () => {
    const csvStr = ["Reference,User,Type,Amount,Status,Date"]
       .concat(filtered.map(t => `${t.reference},${t.profiles?.full_name || 'System'},${t.type},${t.amount},${t.status},${t.created_at}`))
       .join("\n");
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Transactions</h1>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-white border shadow-sm px-4 py-2 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap gap-4">
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border flex-1 min-w-[200px]">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search reference or user..." 
            value={search} onChange={e => setSearch(e.target.value)} 
            className="bg-transparent w-full outline-none font-medium" 
          />
        </div>
        <select 
          value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-gray-50 border rounded-xl px-4 py-2.5 font-medium outline-none text-gray-700"
        >
          <option value="all">All Types</option>
          <option value="topup">Top-ups</option>
          <option value="transfer">Transfers</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
              <tr>
                <th className="p-4 font-semibold">Reference / Details</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                     <p className="font-bold text-gray-900">{tx.reference}</p>
                     <p className="text-xs text-gray-500 font-medium">By: {tx.profiles?.full_name || 'System'}</p>
                  </td>
                  <td className="p-4"><span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">{tx.type}</span></td>
                  <td className="p-4 font-bold text-gray-900">{formatNgn(tx.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tx.status === 'success' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 font-medium whitespace-nowrap">{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
