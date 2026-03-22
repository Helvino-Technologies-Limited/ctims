import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Staff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const { user } = useAuthStore();
  const canAdd = ['admin', 'superadmin'].includes(user?.role || '');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff', { params: { search, limit: 50 } });
      setStaff(res.data.data.staff);
      setTotal(res.data.data.total);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/academic/departments').then(r => setDepartments(r.data.data)); }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Staff & HR</h1><p className="page-subtitle">{total} staff members</p></div>
        {canAdd && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Staff</button>}
      </div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-bar"><Search size={15} style={{ color: 'var(--text-muted)' }} /><input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Staff No.</th><th>Name</th><th>Role</th><th>Department</th><th>Designation</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
              : staff.map((s: any) => (
                <tr key={s.id}>
                  <td><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{s.staff_number}</span></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{s.first_name[0]}{s.last_name[0]}</div>
                    <div><div style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div></div>
                  </div></td>
                  <td><span className="badge badge-info">{s.role}</span></td>
                  <td>{s.department_name}</td>
                  <td>{s.designation}</td>
                  <td>{s.employment_type}</td>
                  <td><span className={`badge badge-${s.is_active ? 'success' : 'danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && canAdd && <AddStaffModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetch(); }} departments={departments} />}
    </div>
  );
}

function AddStaffModal({ onClose, onSaved, departments }: any) {
  const [form, setForm] = useState<any>({ role: 'lecturer', employment_type: 'full-time' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/staff', form); toast.success('Staff added successfully'); onSaved(); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight: 600 }}>Add Staff Member</h3><button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" required value={form.first_name||''} onChange={e => set('first_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" required value={form.last_name||''} onChange={e => set('last_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" required value={form.email||''} onChange={e => set('email', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e => set('phone', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Role *</label><select className="form-input form-select" value={form.role} onChange={e => set('role', e.target.value)}><option value="lecturer">Lecturer</option><option value="admin">Admin</option><option value="finance">Finance</option><option value="registrar">Registrar</option></select></div>
              <div className="form-group"><label className="form-label">Department</label><select className="form-input form-select" value={form.department_id||''} onChange={e => set('department_id', e.target.value)}><option value="">Select</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Designation</label><input className="form-input" value={form.designation||''} onChange={e => set('designation', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Employment Type</label><select className="form-input form-select" value={form.employment_type} onChange={e => set('employment_type', e.target.value)}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option></select></div>
              <div className="form-group"><label className="form-label">Joining Date</label><input type="date" className="form-input" value={form.joining_date||''} onChange={e => set('joining_date', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Salary (KES)</label><input type="number" className="form-input" value={form.salary||''} onChange={e => set('salary', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="loader" /> : 'Add Staff'}</button></div>
        </form>
      </div>
    </div>
  );
}
