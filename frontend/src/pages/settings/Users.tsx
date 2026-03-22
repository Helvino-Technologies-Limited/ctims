import React, { useEffect, useState, useCallback } from 'react';
import { Plus, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [resetModal, setResetModal] = useState<any>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/users'); setUsers(r.data.data); } finally { setLoading(false); }
  }, []);

  useEffect(() => { doFetch(); }, [doFetch]);

  const toggleStatus = async (userId: string, current: boolean) => {
    await api.patch(`/users/${userId}/status`, { is_active: !current });
    toast.success(`User ${!current?'activated':'deactivated'}`);
    doFetch();
  };

  const roleColor: any = { admin:'info', lecturer:'success', finance:'warning', registrar:'warning', student:'gray' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">System Users</h1><p className="page-subtitle">{users.length} users</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add User</button>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary-light)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <span style={{ fontWeight:500 }}>{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{u.email}</td>
                  <td><span className={`badge badge-${roleColor[u.role]||'gray'}`}>{u.role}</span></td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                  <td><span className={`badge badge-${u.is_active?'success':'danger'}`}>{u.is_active?'Active':'Inactive'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" title={u.is_active?'Deactivate':'Activate'} onClick={() => toggleStatus(u.id, u.is_active)}>
                        {u.is_active ? <ToggleRight size={14} color="var(--success)" /> : <ToggleLeft size={14} />}
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Reset Password" onClick={() => setResetModal(u)}><Key size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && <AddUserModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); doFetch(); }} />}
      {resetModal && <ResetPasswordModal user={resetModal} onClose={() => setResetModal(null)} onSaved={() => { setResetModal(null); toast.success('Password reset successfully'); }} />}
    </div>
  );
}

function AddUserModal({ onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ role:'lecturer' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/users', form); toast.success('User created'); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Add System User</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" required value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" required value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" required value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e=>set('phone',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Role *</label><select className="form-input form-select" required value={form.role} onChange={e=>set('role',e.target.value)}><option value="admin">Admin</option><option value="registrar">Registrar</option><option value="finance">Finance Officer</option><option value="lecturer">Lecturer</option></select></div>
            <div className="form-group"><label className="form-label">Password *</label><input type="password" className="form-input" required minLength={6} value={form.password||''} onChange={e=>set('password',e.target.value)} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Create User'}</button></div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSaved }: any) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.patch(`/users/${user.id}/reset-password`, { new_password: password }); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Reset Password</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:16 }}>Reset password for <strong>{user.first_name} {user.last_name}</strong></p>
            <div className="form-group"><label className="form-label">New Password *</label><input type="password" className="form-input" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Reset Password'}</button></div>
        </form>
      </div>
    </div>
  );
}
