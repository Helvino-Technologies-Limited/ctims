import React, { useEffect, useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuthStore();
  const [institution, setInstitution] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (user?.institution_id) {
      api.get(`/institutions/${user.institution_id}`).then(r => {
        setInstitution(r.data.data);
        setForm(r.data.data);
      });
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/institutions/${user?.institution_id}`, form);
      toast.success('Institution settings updated');
    } finally { setLoading(false); }
  };

  if (!institution) return <div style={{ padding: 60, textAlign: 'center' }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Institution Settings</h1><p className="page-subtitle">Manage your institution profile and configuration</p></div>
      </div>

      <form onSubmit={save}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} />Institution Information
          </h3>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Institution Name</label>
              <input className="form-input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Institution Type</label>
              <select className="form-input form-select" value={form.type || ''} onChange={e => set('type', e.target.value)}>
                <option value="College">College</option>
                <option value="TVET">TVET</option>
                <option value="Training Center">Training Center</option>
                <option value="University">University</option>
                <option value="Academy">Academy</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" type="url" value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">County</label>
              <input className="form-input" value={form.county || ''} onChange={e => set('county', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Physical Address</label>
              <textarea className="form-input" rows={2} value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Subscription Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Subscription Status', value: institution.subscription_status },
              { label: 'Institution Status', value: institution.status },
              { label: 'Registered Since', value: new Date(institution.created_at).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontWeight: 700, marginTop: 4, textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 16, background: '#fef3c7', borderRadius: 10, border: '1px solid #fcd34d' }}>
            <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Fee Payment</div>
            <div style={{ fontSize: 13, color: '#78350f' }}>Setup Fee: KES 60,000 · Annual: KES 20,000</div>
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>Paybill: <strong>522533</strong> · Account: <strong>8071524</strong></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loader" /> : <><Save size={16} />Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}
