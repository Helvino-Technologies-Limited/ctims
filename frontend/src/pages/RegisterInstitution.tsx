import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function RegisterInstitution() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({ type: 'College' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/institutions/register', form);
      setDone(true);
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#0e9f6e" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Registration Successful!</h2>
          <p style={{ color: '#718096', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
            Your institution has been registered. Your admin credentials have been set up. You can now log in to your dashboard.
          </p>
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16, marginBottom: 28, textAlign: 'left', fontSize: 14 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Payment Required</div>
            <div style={{ color: '#78350f' }}>Setup fee: <strong>KES 60,000</strong></div>
            <div style={{ color: '#78350f', marginTop: 4 }}>Paybill: <strong>522533</strong> · Account: <strong>8071524</strong></div>
            <div style={{ color: '#78350f', marginTop: 4, fontSize: 13 }}>Contact helvinotechltd@gmail.com after payment</div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
            Login to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <GraduationCap size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Register Your Institution</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Set up your institution on CTIMS — takes less than 2 minutes</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, position: 'relative' }}>
          {['Institution Info', 'Admin Account', 'Confirm'].map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--primary)' : 'var(--border)', color: step >= i + 1 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}>
                {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
              </div>
              <div style={{ fontSize: 12, color: step === i + 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{label}</div>
              {i < 2 && <div style={{ position: 'absolute', top: 15, left: '60%', width: '80%', height: 2, background: step > i + 1 ? 'var(--success)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={submit}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Institution Name *</label>
                <input className="form-input" required value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Nairobi Technical College" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Institution Type *</label>
                  <select className="form-input form-select" required value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="College">College</option>
                    <option value="TVET">TVET</option>
                    <option value="Training Center">Training Center</option>
                    <option value="University">University</option>
                    <option value="Academy">Academy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">County</label>
                  <input className="form-input" value={form.county || ''} onChange={e => set('county', e.target.value)} placeholder="e.g. Nairobi" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Institution Email *</label>
                <input type="email" className="form-input" required value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@institution.ac.ke" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="0712345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Physical Address</label>
                <input className="form-input" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="P.O. Box / Physical location" />
              </div>
              <button type="button" className="btn btn-primary btn-lg" style={{ justifyContent: 'center', marginTop: 8 }} onClick={() => { if (!form.name || !form.email) { toast.error('Fill required fields'); return; } setStep(2); }}>
                Next: Admin Account <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#e8f0fe', borderRadius: 10, padding: 14, fontSize: 13, color: '#1a56db' }}>
                This account will be the primary administrator for <strong>{form.name}</strong>.
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Admin First Name *</label>
                  <input className="form-input" required value={form.admin_first_name || ''} onChange={e => set('admin_first_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Last Name *</label>
                  <input className="form-input" required value={form.admin_last_name || ''} onChange={e => set('admin_last_name', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Email *</label>
                <input type="email" className="form-input" required value={form.admin_email || ''} onChange={e => set('admin_email', e.target.value)} placeholder="admin@institution.ac.ke" />
              </div>
              <div className="form-group">
                <label className="form-label">Admin Phone</label>
                <input className="form-input" value={form.admin_phone || ''} onChange={e => set('admin_phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" required minLength={8} value={form.admin_password || ''} onChange={e => set('admin_password', e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => { if (!form.admin_first_name || !form.admin_email || !form.admin_password) { toast.error('Fill all required fields'); return; } setStep(3); }}>
                  Review & Submit <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 14 }}>Review Your Details</h3>
                {[
                  ['Institution', form.name],
                  ['Type', form.type],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['County', form.county],
                  ['Admin Name', `${form.admin_first_name} ${form.admin_last_name}`],
                  ['Admin Email', form.admin_email],
                ].map(([k, v]) => v && (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13 }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>⚠️ Payment Required After Registration</div>
                <div style={{ color: '#78350f' }}>KES 60,000 setup fee · Paybill: <strong>522533</strong> · Account: <strong>8071524</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                  {loading ? <span className="loader" /> : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
