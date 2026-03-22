import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();
  const canRecord = ['admin', 'finance', 'superadmin'].includes(user?.role || '');

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit:20 };
      if (search) params.search = search;
      if (method) params.payment_method = method;
      const res = await api.get('/fees/payments', { params });
      setPayments(res.data.data.payments);
      setSummary(res.data.data.summary||{});
      setTotal(res.data.data.total);
    } finally { setLoading(false); }
  }, [page, search, method]);

  useEffect(() => { doFetch(); }, [doFetch]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Fee Payments</h1><p className="page-subtitle">{user?.role === 'student' ? 'Your payment history' : `${total} total transactions`}</p></div>
        {canRecord && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Record Payment</button>}
      </div>
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:'Total Collected', value:`KES ${Number(summary.total||0).toLocaleString()}`, color:'#1a56db' },
          { label:'M-Pesa', value:`KES ${Number(summary.mpesa_total||0).toLocaleString()}`, color:'#0e9f6e' },
          { label:'Cash', value:`KES ${Number(summary.cash_total||0).toLocaleString()}`, color:'#d97706' },
          { label:'Bank', value:`KES ${Number(summary.bank_total||0).toLocaleString()}`, color:'#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize:20, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-bar"><Search size={15} style={{ color:'var(--text-muted)' }} /><input placeholder="Search receipt, student..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} /></div>
          <select className="form-input form-select" style={{ width:150 }} value={method} onChange={e=>{ setMethod(e.target.value); setPage(1); }}>
            <option value="">All Methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Receipt No.</th><th>Student</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date</th><th>Received By</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></td></tr>
              : payments.length===0 ? <tr><td colSpan={7}><div className="empty-state"><p>No payments found</p></div></td></tr>
              : payments.map((p: any) => (
                <tr key={p.id}>
                  <td><span className="mono" style={{ fontSize:12, fontWeight:600 }}>{p.receipt_number}</span></td>
                  <td><div style={{ fontWeight:500 }}>{p.student_name}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.student_number}</div></td>
                  <td style={{ fontWeight:700, color:'var(--success)', fontSize:15 }}>KES {Number(p.amount).toLocaleString()}</td>
                  <td><span className={`badge badge-${p.payment_method==='mpesa'?'success':p.payment_method==='cash'?'info':'warning'}`}>{p.payment_method?.toUpperCase()}</span></td>
                  <td style={{ fontSize:12 }}>{p.transaction_code||p.bank_reference||'—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(p.payment_date).toLocaleString()}</td>
                  <td style={{ fontSize:12 }}>{p.received_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && canRecord && <RecordPaymentModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); doFetch(); }} />}
    </div>
  );
}

function RecordPaymentModal({ onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ payment_method:'cash' });
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStu, setSearchStu] = useState('');
  const [stuResults, setStuResults] = useState<any[]>([]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  useEffect(() => { api.get('/fees/structures').then(r => setStructures(r.data.data)); }, []);
  useEffect(() => {
    if (searchStu.length>=2) api.get('/students', { params:{ search:searchStu, limit:10 } }).then(r => setStuResults(r.data.data.students));
    else setStuResults([]);
  }, [searchStu]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/fees/payments', form); toast.success('Payment recorded'); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Record Payment</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20 }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Search Student</label>
              <input className="form-input" placeholder="Type name or student number..." value={searchStu} onChange={e=>setSearchStu(e.target.value)} />
              {stuResults.length>0 && (
                <div style={{ border:'1px solid var(--border)', borderRadius:8, maxHeight:180, overflowY:'auto', marginTop:4 }}>
                  {stuResults.map((s: any) => (
                    <div key={s.id} onClick={() => { set('student_id',s.id); setSearchStu(`${s.first_name} ${s.last_name} (${s.student_number})`); setStuResults([]); }}
                      style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                      <strong>{s.first_name} {s.last_name}</strong> — {s.student_number}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group"><label className="form-label">Fee Structure</label><select className="form-input form-select" value={form.fee_structure_id||''} onChange={e=>set('fee_structure_id',e.target.value)}><option value="">Select...</option>{structures.map((s:any)=><option key={s.id} value={s.id}>{s.name} — KES {Number(s.total_amount).toLocaleString()}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Amount (KES) *</label><input type="number" className="form-input" required min={1} value={form.amount||''} onChange={e=>set('amount',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Payment Method *</label><select className="form-input form-select" required value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank</option></select></div>
            {form.payment_method==='mpesa' && <div className="form-group"><label className="form-label">M-Pesa Code</label><input className="form-input" placeholder="e.g. QHF7XXXXXX" value={form.transaction_code||''} onChange={e=>set('transaction_code',e.target.value)} /></div>}
            {form.payment_method==='bank' && <div className="form-group"><label className="form-label">Bank Reference</label><input className="form-input" value={form.bank_reference||''} onChange={e=>set('bank_reference',e.target.value)} /></div>}
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group"><label className="form-label">Academic Year</label><input className="form-input" placeholder="2024/2025" value={form.academic_year||''} onChange={e=>set('academic_year',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Semester</label><select className="form-input form-select" value={form.semester||''} onChange={e=>set('semester',e.target.value)}><option value="">Select</option><option value={1}>Sem 1</option><option value={2}>Sem 2</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" value={form.notes||''} onChange={e=>set('notes',e.target.value)} rows={2} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Record Payment'}</button></div>
        </form>
      </div>
    </div>
  );
}
