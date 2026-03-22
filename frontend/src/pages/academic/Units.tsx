import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, BookMarked } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Units() {
  const [units, setUnits] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (programFilter) params.program_id = programFilter;
      const r = await api.get('/academic/units', { params });
      setUnits(r.data.data);
    } finally { setLoading(false); }
  }, [programFilter]);

  useEffect(() => {
    fetch();
    api.get('/academic/programs').then(r => setPrograms(r.data.data));
  }, [fetch]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Units / Subjects</h1>
          <p className="page-subtitle">{units.length} units configured</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={16} />Add Unit
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <select className="form-input form-select" style={{ width: 220 }} value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
            <option value="">All Programs</option>
            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Unit Name</th><th>Code</th><th>Program</th><th>Year</th><th>Semester</th><th>Credit Hours</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><BookMarked size={48} /><p>No units found. Add your first unit.</p></div></td></tr>
              ) : units.map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td><span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{u.code}</span></td>
                  <td style={{ fontSize: 13 }}>{u.program_name}</td>
                  <td>Year {u.year_of_study}</td>
                  <td>Semester {u.semester}</td>
                  <td style={{ textAlign: 'center' }}>{u.credit_hours}</td>
                  <td><span className={`badge badge-${u.is_active ? 'success' : 'danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(u); setShowModal(true); }}>
                      <Edit size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UnitModal
          editing={editing}
          programs={programs}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetch(); }}
        />
      )}
    </div>
  );
}

function UnitModal({ editing, programs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ? { ...editing } : { credit_hours: 3, semester: 1, year_of_study: 1, is_active: true });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/academic/units/${editing.id}`, form);
        toast.success('Unit updated');
      } else {
        await api.post('/academic/units', form);
        toast.success('Unit created');
      }
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>{editing ? 'Edit' : 'Add'} Unit</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Unit Name *</label>
                <input className="form-input" required value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Business Communication" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Code *</label>
                <input className="form-input" required value={form.code || ''} onChange={e => set('code', e.target.value)} placeholder="e.g. BUS101" />
              </div>
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select className="form-input form-select" required value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                  <option value="">Select program...</option>
                  {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <select className="form-input form-select" value={form.year_of_study} onChange={e => set('year_of_study', parseInt(e.target.value))}>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-input form-select" value={form.semester} onChange={e => set('semester', parseInt(e.target.value))}>
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Credit Hours</label>
                <input type="number" className="form-input" min={1} max={6} value={form.credit_hours} onChange={e => set('credit_hours', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input form-select" value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loader" /> : editing ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
