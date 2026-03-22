import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, GraduationCap, BookOpen } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function InstitutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [institution, setInstitution] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    api.get(`/institutions/${id}`).then(r => { setInstitution(r.data.data); setForm(r.data.data); });
  }, [id]);

  if (!institution) return <div style={{ padding: 40, textAlign: 'center' }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>;

  const save = async () => {
    await api.put(`/institutions/${id}`, form);
    toast.success('Institution updated');
    setEditing(false);
    api.get(`/institutions/${id}`).then(r => setInstitution(r.data.data));
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/superadmin/institutions')}><ArrowLeft size={14} />Back</button>
          <div><h1 className="page-title">{institution.name}</h1><p className="page-subtitle">{institution.type}</p></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {editing ? <><button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Changes</button></> : <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: institution.total_students, icon: GraduationCap, color: '#1a56db' },
          { label: 'Total Staff', value: institution.total_staff, icon: Users, color: '#0e9f6e' },
          { label: 'Programs', value: institution.total_programs, icon: BookOpen, color: '#7c3aed' },
          { label: 'Status', value: institution.status, icon: Building2, color: institution.status === 'active' ? '#0e9f6e' : '#dc2626' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Institution Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {editing ? (
              <>
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-input form-select" value={form.type || ''} onChange={e => set('type', e.target.value)}><option value="College">College</option><option value="TVET">TVET</option><option value="Training Center">Training Center</option><option value="University">University</option></select></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">County</label><input className="form-input" value={form.county || ''} onChange={e => set('county', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Subscription Status</label><select className="form-input form-select" value={form.subscription_status || ''} onChange={e => set('subscription_status', e.target.value)}><option value="trial">Trial</option><option value="active">Active</option><option value="expired">Expired</option></select></div>
                <div className="form-group"><label className="form-label">Institution Status</label><select className="form-input form-select" value={form.status || ''} onChange={e => set('status', e.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
              </>
            ) : (
              <>
                {[['Email', institution.email],['Phone', institution.phone],['Address', institution.address],['County', institution.county],['Website', institution.website],['Subscription', institution.subscription_status],['Status', institution.status],['Joined', new Date(institution.created_at).toLocaleDateString()]].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v || 'N/A'}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Subscription & Billing</h3>
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Pricing</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>KES 60,000 setup + KES 20,000/year</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Paybill: 522533 | Account: 8071524</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success btn-sm">Mark Setup Paid</button>
            <button className="btn btn-secondary btn-sm">Mark Annual Paid</button>
            <button className={`btn btn-sm ${institution.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={async () => { const s = institution.status === 'active' ? 'suspended' : 'active'; await api.patch(`/institutions/${id}/status`, { status: s }); toast.success(`Institution ${s}`); api.get(`/institutions/${id}`).then(r => setInstitution(r.data.data)); }}>
              {institution.status === 'active' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
