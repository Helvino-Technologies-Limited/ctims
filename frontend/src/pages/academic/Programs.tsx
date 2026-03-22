import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, BookOpen, Users } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Programs() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/academic/programs'); setPrograms(r.data.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    api.get('/academic/departments').then(r => setDepartments(r.data.data));
  }, [fetch]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Programs & Courses</h1><p className="page-subtitle">{programs.length} programs offered</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={16} />Add Program</button>
      </div>
      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:60 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Program</th><th>Code</th><th>Department</th><th>Level</th><th>Duration</th><th>Students</th><th>Units</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><BookOpen size={48} /><p>No programs yet.</p></div></td></tr>
                ) : programs.map((p: any) => (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight:600 }}>{p.name}</div></td>
                    <td><span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--primary)' }}>{p.code}</span></td>
                    <td style={{ fontSize:13 }}>{p.department_name||'—'}</td>
                    <td style={{ fontSize:13 }}>{p.level||'—'}</td>
                    <td style={{ fontSize:13 }}>{p.duration_months ? `${p.duration_months}mo` : '—'}</td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:5 }}><Users size={13} style={{ color:'var(--text-muted)' }} /><span style={{ fontWeight:600 }}>{p.student_count}</span></div></td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:5 }}><BookOpen size={13} style={{ color:'var(--text-muted)' }} /><span style={{ fontWeight:600 }}>{p.unit_count}</span></div></td>
                    <td><span className={`badge badge-${p.is_active?'success':'danger'}`}>{p.is_active?'Active':'Inactive'}</span></td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => { setEditing(p); setShowModal(true); }}><Edit size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && <ProgramModal editing={editing} departments={departments} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetch(); }} />}
    </div>
  );
}

function ProgramModal({ editing, departments, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ? { ...editing } : { is_active: true });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await api.put(`/academic/programs/${editing.id}`, form); toast.success('Program updated'); }
      else { await api.post('/academic/programs', form); toast.success('Program created'); }
      onSaved();
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>{editing?'Edit':'Add'} Program</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="grid-2" style={{ gap:14 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Program Name *</label><input className="form-input" required value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Code *</label><input className="form-input" required value={form.code||''} onChange={e=>set('code',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Department</label><select className="form-input form-select" value={form.department_id||''} onChange={e=>set('department_id',e.target.value)}><option value="">Select...</option>{departments.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Level</label><select className="form-input form-select" value={form.level||''} onChange={e=>set('level',e.target.value)}><option value="">Select...</option>{['Certificate','Diploma','Higher Diploma','Bachelor','Masters','PhD','Artisan','Craft Certificate'].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Duration (months)</label><input type="number" className="form-input" value={form.duration_months||''} onChange={e=>set('duration_months',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-input form-select" value={form.is_active?'true':'false'} onChange={e=>set('is_active',e.target.value==='true')}><option value="true">Active</option><option value="false">Inactive</option></select></div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description||''} onChange={e=>set('description',e.target.value)} /></div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Entry Requirements</label><textarea className="form-input" rows={3} value={form.requirements||''} onChange={e=>set('requirements',e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:editing?'Update Program':'Create Program'}</button></div>
        </form>
      </div>
    </div>
  );
}
