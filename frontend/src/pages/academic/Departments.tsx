import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Building2 } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/academic/departments');
      setDepartments(r.data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    api.get('/staff').then(r => setStaff(r.data.data.staff || []));
  }, [fetch]);

  const openEdit = (d: any) => { setEditing(d); setShowModal(true); };
  const openNew = () => { setEditing(null); setShowModal(true); };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} departments</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Add Department</button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>
      ) : departments.length === 0 ? (
        <div className="card"><div className="empty-state"><Building2 size={48} /><p>No departments yet. Add your first department.</p></div></div>
      ) : (
        <div className="grid-3">
          {departments.map((d: any) => (
            <div key={d.id} className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--primary)" />
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}><Edit size={13} /></button>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{d.name}</h3>
              {d.code && <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 8 }}>{d.code}</span>}
              {d.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{d.description}</p>}
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{d.program_count}</strong> programs
                </div>
                {d.head_name && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Head: <strong style={{ color: 'var(--text)' }}>{d.head_name}</strong></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <DepartmentModal
          editing={editing}
          staff={staff}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetch(); }}
        />
      )}
    </div>
  );
}

function DepartmentModal({ editing, staff, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing || {});
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/academic/departments/${editing.id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/academic/departments', form);
        toast.success('Department created');
      }
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>{editing ? 'Edit' : 'Add'} Department</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input className="form-input" required value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Department of Business" />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="e.g. BUS" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Head of Department</label>
              <select className="form-input form-select" value={form.head_id || ''} onChange={e => set('head_id', e.target.value)}>
                <option value="">Select staff member...</option>
                {staff.map((s: any) => <option key={s.id} value={s.user_id}>{s.first_name} {s.last_name} — {s.designation || s.role}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loader" /> : editing ? 'Update' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
