import { useEffect, useState } from 'react';
import { adminCall } from '../lib/api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Withdrawals() {
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const loadData = async () => {
    setLoading(true);
    const data = await adminCall('getWithdrawals').catch(console.error);
    if (data) {
      setPending(data.pending);
      setCompleted(data.completed);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const formatNgn = (val: number) => '₦' + val.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const handleMarkPaid = async (req: any) => {
    const note = prompt(`Confirm you have manually transferred ${formatNgn(req.amount)} to:\n${req.account_name} — ${req.bank_name} — ${req.account_number}\n\nOptional Payment Reference Note:`);
    if (note === null) return;
    try {
      await adminCall('markWithdrawalPaid', { id: req.id, userId: req.user_id, note, email: 'admin' }); // In a real app we'd decode JWT for admin email
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (req: any) => {
    const reason = prompt("Reason for rejection (required):");
    if (!reason) { alert("Rejection reason is required."); return; }
    try {
      await adminCall('rejectWithdrawal', { id: req.id, reason, email: 'admin' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const pendingCount = pending.length;
  const pendingTotal = pending.reduce((acc, curr) => acc + curr.amount, 0);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const paidToday = completed.filter(c => c.status === 'paid' && new Date(c.reviewed_at) > todayStart).reduce((acc, c) => acc + c.amount, 0);
  const rejectedTodayCount = completed.filter(c => c.status === 'rejected' && new Date(c.reviewed_at) > todayStart).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Withdrawals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm">
           <h3 className="text-amber-800 font-semibold mb-1">Pending Requests</h3>
           <p className="text-2xl font-black text-amber-900">{pendingCount} <span className="text-lg font-bold text-amber-700">({formatNgn(pendingTotal)})</span></p>
        </div>
        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl shadow-sm">
           <h3 className="text-green-800 font-semibold mb-1">Paid Today</h3>
           <p className="text-2xl font-black text-green-900">{formatNgn(paidToday)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm">
           <h3 className="text-red-800 font-semibold mb-1">Rejected Today</h3>
           <p className="text-2xl font-black text-red-900">{rejectedTodayCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex border-b">
           <button onClick={() => setTab('pending')} className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors ${tab === 'pending' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              Pending Queue (FIFO)
           </button>
           <button onClick={() => setTab('completed')} className={`flex-1 py-4 font-bold text-center border-b-2 transition-colors ${tab === 'completed' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              Completed History
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
              {tab === 'pending' ? (
                <tr>
                  <th className="p-4 font-semibold">User Details</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Bank Details</th>
                  <th className="p-4 font-semibold">Date Requested</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-4 font-semibold">User Details</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Status & Note</th>
                  <th className="p-4 font-semibold">Review Details</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading records...</td></tr>
              ) : (tab === 'pending' ? pending : completed).map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{req.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500 font-medium">{req.profiles?.phone}</p>
                  </td>
                  <td className="p-4 font-black text-gray-900 text-lg">{formatNgn(req.amount)}</td>
                  
                  {tab === 'pending' ? (
                    <>
                      <td className="p-4">
                        <div className="bg-gray-100 p-3 rounded-xl border">
                           <p className="font-bold text-gray-900">{req.account_name}</p>
                           <p className="text-xs font-semibold text-gray-700">{req.bank_name} • {req.account_number}</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 font-medium">{format(new Date(req.created_at), 'MMM d, h:mm a')}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleMarkPaid(req)} className="flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-bold transition-colors">
                              <CheckCircle2 size={16} /> Mark Paid
                           </button>
                           <button onClick={() => handleReject(req)} className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg font-bold transition-colors">
                              <XCircle size={16} /> Reject
                           </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${req.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status}
                        </span>
                        <p className="text-sm font-medium text-gray-600 mt-1 italic">"{req.admin_note}"</p>
                      </td>
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                         <p>By {req.reviewed_by}</p>
                         <p className="text-xs">{format(new Date(req.reviewed_at), 'MMM d, yyyy h:mm a')}</p>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {(tab === 'pending'? pending : completed).length === 0 && !loading && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
