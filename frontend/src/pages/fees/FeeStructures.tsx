import React, { useEffect, useState, useCallback } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function FeeStructures() {
  const [structures, setStructures] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { user } = useAuthStore();
  const canManage = ['admin', 'finance', 'superadmin'].includes(user?.role || '');

  const doFetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/fees/structures'); setStructures(r.data.data); } finally { setLoading(false); }
  }, []);

  useEffect(() => { doFetch(); api.get('/academic/programs').then(r => setPrograms(r.data.data)); }, [doFetch]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Fee Structures</h1><p className="page-subtitle">{structures.length} fee structures</p></div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Create Fee Structure</button>}
      </div>
      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:60 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></div>
      ) : structures.length===0 ? (
        <div className="card"><div className="empty-state"><DollarSign size={48} /><p>No fee structures yet.</p></div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {structures.map((s: any) => (
            <div key={s.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <h3 style={{ fontWeight:700, fontSize:16 }}>{s.name}</h3>
                  <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
                    {s.program_name && <span className="badge badge-info">{s.program_name}</span>}
                    {s.academic_year && <span className="badge badge-gray">{s.academic_year}</span>}
                    {s.semester && <span className="badge badge-gray">Sem {s.semester}</span>}
                    <span className={`badge badge-${s.is_active?'success':'danger'}`}>{s.is_active?'Active':'Inactive'}</span>
                    {s.installments_allowed && <span className="badge badge-warning">Installments: {s.installment_count}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:24, fontWeight:800, color:'var(--primary)' }}>KES {Number(s.total_amount).toLocaleString()}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total Fee</div>
                </div>
              </div>
              {s.items && s.items.length>0 && s.items[0]!==null && (
                <div style={{ background:'var(--bg)', borderRadius:8, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'var(--border)' }}>
                      <th style={{ padding:'8px 14px', textAlign:'left', fontSize:12, fontWeight:600 }}>Fee Item</th>
                      <th style={{ padding:'8px 14px', textAlign:'right', fontSize:12, fontWeight:600 }}>Amount</th>
                      <th style={{ padding:'8px 14px', textAlign:'center', fontSize:12, fontWeight:600 }}>Mandatory</th>
                    </tr></thead>
                    <tbody>
                      {s.items.filter((i: any) => i).map((item: any, idx: number) => (
                        <tr key={idx} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'8px 14px', fontSize:13 }}>{item.name}</td>
                          <td style={{ padding:'8px 14px', fontSize:13, textAlign:'right', fontWeight:600 }}>KES {Number(item.amount).toLocaleString()}</td>
                          <td style={{ padding:'8px 14px', textAlign:'center' }}><span className={`badge badge-${item.is_mandatory?'danger':'gray'}`}>{item.is_mandatory?'Yes':'Optional'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && canManage && <FeeStructureModal programs={programs} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); doFetch(); }} />}
    </div>
  );
}

function FeeStructureModal({ programs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ installments_allowed:true, installment_count:3, is_active:true });
  const [items, setItems] = useState<any[]>([{ name:'', amount:'', is_mandatory:true }]);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addItem = () => setItems(i => [...i, { name:'', amount:'', is_mandatory:true }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j!==idx));
  const setItem = (idx: number, k: string, v: any) => setItems(items.map((item, i) => i===idx ? { ...item, [k]:v } : item));
  const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.amount)||0), 0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const validItems = items.filter(i => i.name && i.amount);
      await api.post('/fees/structures', { ...form, total_amount: totalAmount||form.total_amount, items: validItems });
      toast.success('Fee structure created'); onSaved();
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Create Fee Structure</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group"><label className="form-label">Program</label><select className="form-input form-select" value={form.program_id||''} onChange={e=>set('program_id',e.target.value)}><option value="">Select...</option>{programs.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Academic Year</label><input className="form-input" value={form.academic_year||''} onChange={e=>set('academic_year',e.target.value)} placeholder="2024/2025" /></div>
              <div className="form-group"><label className="form-label">Semester</label><select className="form-input form-select" value={form.semester||''} onChange={e=>set('semester',e.target.value)}><option value="">All</option><option value={1}>Sem 1</option><option value={2}>Sem 2</option></select></div>
              <div className="form-group"><label className="form-label">Installments</label><select className="form-input form-select" value={form.installments_allowed?'true':'false'} onChange={e=>set('installments_allowed',e.target.value==='true')}><option value="true">Allowed</option><option value="false">Not Allowed</option></select></div>
              {form.installments_allowed && <div className="form-group"><label className="form-label">No. Installments</label><input type="number" className="form-input" min={2} max={12} value={form.installment_count} onChange={e=>set('installment_count',parseInt(e.target.value))} /></div>}
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <label className="form-label" style={{ margin:0 }}>Fee Items</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} />Add</button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <input className="form-input" placeholder="Item name" value={item.name} onChange={e=>setItem(idx,'name',e.target.value)} style={{ flex:2 }} />
                  <input type="number" className="form-input" placeholder="Amount" value={item.amount} onChange={e=>setItem(idx,'amount',e.target.value)} style={{ flex:1 }} />
                  <select className="form-input form-select" value={item.is_mandatory?'true':'false'} onChange={e=>setItem(idx,'is_mandatory',e.target.value==='true')} style={{ flex:1 }}><option value="true">Mandatory</option><option value="false">Optional</option></select>
                  {items.length>1 && <button type="button" onClick={()=>removeItem(idx)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger)', fontSize:18, flexShrink:0 }}>×</button>}
                </div>
              ))}
              {totalAmount>0 && <div style={{ textAlign:'right', marginTop:8, fontSize:15, fontWeight:700, color:'var(--primary)' }}>Total: KES {totalAmount.toLocaleString()}</div>}
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Create Structure'}</button></div>
        </form>
      </div>
    </div>
  );
}
