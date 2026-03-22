import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function ApplyOnline() {
  const { institution_id } = useParams();
  const [programs, setPrograms] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [form, setForm] = useState<any>({ institution_id });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get(`/admissions/programs/${institution_id}`).then(r => setPrograms(r.data.data));
    api.get(`/institutions/${institution_id}`).then(r => setInstitution(r.data.data)).catch(() => {});
  }, [institution_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/admissions/apply', form);
      setSubmitted(r.data.data);
      toast.success('Application submitted successfully!');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#0e9f6e" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Application Submitted!</h2>
          <p style={{ color: '#718096', marginBottom: 20 }}>Your application has been received. The institution will contact you.</p>
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Application Number</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{submitted.application_number}</div>
          </div>
          <Link to="/" style={{ color: 'var(--primary)', fontSize: 15, fontWeight: 600 }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <GraduationCap size={26} color="#fff" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Online Application</h1>
            {institution && <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 4 }}>{institution.name}</p>}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Personal Information</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" required value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" required value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" required value={form.email || ''} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" required value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input form-select" value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">National ID / Passport</label>
                <input className="form-input" value={form.national_id || ''} onChange={e => set('national_id', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Town, County" />
              </div>
            </div>

            <h3 style={{ fontWeight: 600, fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginTop: 8 }}>Program Selection</h3>
            <div className="form-group">
              <label className="form-label">Program of Interest *</label>
              <select className="form-input form-select" required value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                <option value="">Select a program...</option>
                {programs.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.level ? `(${p.level})` : ''} {p.duration_months ? `— ${p.duration_months} months` : ''}</option>
                ))}
              </select>
            </div>

            <h3 style={{ fontWeight: 600, fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginTop: 8 }}>Academic Background</h3>
            <div className="form-group">
              <label className="form-label">Previous School / Institution</label>
              <input className="form-input" value={form.previous_school || ''} onChange={e => set('previous_school', e.target.value)} placeholder="Most recent school attended" />
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications / Certificates</label>
              <textarea className="form-input" rows={3} value={form.qualifications || ''} onChange={e => set('qualifications', e.target.value)} placeholder="List your certificates, grades, and achievements..." />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? <span className="loader" /> : 'Submit Application'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={12} style={{ display: 'inline' }} /> Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
