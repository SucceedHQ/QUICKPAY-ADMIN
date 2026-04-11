import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'admin-secret, content-type' } };
  }

  const cors = { 'Access-Control-Allow-Origin': '*' };

  const adminSecret = event.headers['admin-secret'] || event.headers['admin_secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'local-admin-secret-dev') {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };
  }

  try {
    const { action, payload } = JSON.parse(event.body || '{}');
    
    switch(action) {
      case 'login':
        if (payload.email === process.env.ADMIN_EMAIL && payload.password === process.env.ADMIN_PASSWORD) {
           return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true, token: process.env.ADMIN_SECRET || 'local-admin-secret-dev' }) };
        }
        return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid credentials' }) };

      case 'getDashboardStats':
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: balanceData } = await supabase.from('profiles').select('wallet_balance');
        const totalBalance = balanceData?.reduce((acc, curr) => acc + (curr.wallet_balance || 0), 0) || 0;
        
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const { data: txVolume } = await supabase.from('transactions').select('amount').gte('created_at', startOfMonth.toISOString());
        const thisMonthVolume = txVolume?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        const { data: withdrawals } = await supabase.from('withdrawal_requests').select('amount').eq('status', 'pending');
        const pendingWithdrawalsCount = withdrawals?.length || 0;
        const pendingWithdrawalsAmount = withdrawals?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        const { data: recentTxs } = await supabase.from('transactions').select('*, profiles!sender_id(full_name)').order('created_at', { ascending: false }).limit(15);

        return { statusCode: 200, headers: cors, body: JSON.stringify({ 
           usersCount: usersCount || 0, totalBalance, thisMonthVolume, pendingWithdrawalsCount, pendingWithdrawalsAmount,
           recentTxs: recentTxs || [],
           // Placeholder for charts, can derive from transactions later or generate here
        })};

      case 'getUsers':
        const { data: users, error: uErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (uErr) throw uErr;
        return { statusCode: 200, headers: cors, body: JSON.stringify({ data: users }) };

      case 'suspendUser':
        const { error: blockErr } = await supabase.from('profiles').update({ suspended: payload.suspended }).eq('id', payload.userId);
        if (blockErr) throw blockErr;
        return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };

      case 'getTransactionsPage':
        const { data: pagedTxs } = await supabase.from('transactions').select('*, profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)').order('created_at', { ascending: false }).limit(200);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ data: pagedTxs }) };

      case 'getWithdrawals':
        const { data: pendingW } = await supabase.from('withdrawal_requests').select('*, profiles!user_id(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: true });
        const { data: completedW } = await supabase.from('withdrawal_requests').select('*, profiles!user_id(full_name, phone)').neq('status', 'pending').order('created_at', { ascending: false }).limit(100);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ pending: pendingW || [], completed: completedW || [] }) };

      case 'markWithdrawalPaid':
        const { error: markPaidErr } = await supabase.from('withdrawal_requests')
            .update({ status: 'paid', admin_note: payload.note, reviewed_by: payload.email, reviewed_at: new Date().toISOString() })
            .eq('id', payload.id);
        if (markPaidErr) throw markPaidErr;

        await supabase.from('transactions').update({ status: 'success' })
            .eq('sender_id', payload.userId).eq('type', 'withdrawal').eq('status', 'pending');

        return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };

      case 'rejectWithdrawal':
        const { data: wRecord } = await supabase.from('withdrawal_requests').select('amount, user_id').eq('id', payload.id).single();
        if (!wRecord) throw new Error("Withdrawal record not found");

        const { data: pRecord } = await supabase.from('profiles').select('wallet_balance').eq('id', wRecord.user_id).single();
        const refundedBal = (pRecord?.wallet_balance || 0) + wRecord.amount;
        
        await supabase.from('profiles').update({ wallet_balance: refundedBal }).eq('id', wRecord.user_id);
        
        await supabase.from('withdrawal_requests')
            .update({ status: 'rejected', admin_note: payload.reason, reviewed_by: payload.email, reviewed_at: new Date().toISOString() })
            .eq('id', payload.id);

        await supabase.from('transactions').update({ status: 'failed' })
            .eq('sender_id', wRecord.user_id).eq('type', 'withdrawal').eq('status', 'pending');

        return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };

      default:
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Unknown action' }) };
    }
  } catch (error: any) {
    console.error(error);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: error.message }) };
  }
};
