import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Eye, EyeOff, ArrowRight, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: 'Admin',     email: 'admin@kenyatechcollege.ac.ke',     password: 'Admin@2024',     color: '#1a56db', bg: '#e8f0fe' },
  { label: 'Finance',   email: 'finance@kenyatechcollege.ac.ke',   password: 'Finance@2024',   color: '#0e9f6e', bg: '#d1fae5' },
  { label: 'Registrar', email: 'registrar@kenyatechcollege.ac.ke', password: 'Registrar@2024', color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Lecturer',  email: 'lecturer@kenyatechcollege.ac.ke',  password: 'Lecturer@2024',  color: '#d97706', bg: '#fef3c7' },
  { label: 'Student',   email: 'student@kenyatechcollege.ac.ke',   password: 'Student@2024',   color: '#0891b2', bg: '#e0f2fe' },
];

export default function LoginPage() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [demoOpen,    setDemoOpen]    = useState(false);
  const { login, isLoading }          = useAuthStore();
  const navigate                      = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.first_name}!`);
      navigate(user?.role === 'superadmin' ? '/superadmin' : '/dashboard');
    } catch {}
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setDemoOpen(false);
  };

  return (
    <div className="login-page">
      {/* ── Blue header (Facebook-style) ── */}
      <div className="login-hero-header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
            <GraduationCap size={32} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>CTIMS</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>College & Technical Institution Management</div>
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
            Sign in to manage your institution
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 32px', gap: 16 }}>

        {/* Login form card */}
        <div className="login-form-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email or Phone Number</label>
              <input
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ padding: '13px 16px', fontSize: 15, borderRadius: 12 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ padding: '13px 48px 13px 16px', fontSize: 15, borderRadius: 12 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {email && password && (
              <div style={{ background: '#e8f0fe', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#1a56db', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={13} />
                <span>Demo credentials filled — tap Sign In</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#1a56db,#1343a8)', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', marginTop: 4, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? <span className="loader" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 13, color: '#718096', whiteSpace: 'nowrap' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#1a202c', border: '1.5px solid #e2e8f0', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Register Your Institution
          </Link>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ fontSize: 13, color: '#718096', textDecoration: 'none' }}>← Back to home</Link>
          </div>
        </div>

        {/* Demo accounts card — collapsible */}
        <div className="login-demo-card">
          <button
            onClick={() => setDemoOpen(!demoOpen)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="#1a56db" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a202c' }}>Try Demo Accounts</span>
            </div>
            {demoOpen ? <ChevronUp size={18} color="#718096" /> : <ChevronDown size={18} color="#718096" />}
          </button>

          {demoOpen && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#718096', marginBottom: 14, lineHeight: 1.6 }}>
                Click any role to autofill credentials for <strong style={{ color: '#1a202c' }}>Kenya Technical College</strong> — a pre-seeded demo institution.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.label}
                    onClick={() => fillDemo(acc)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: '#f8fafd', border: `1.5px solid ${acc.bg}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = acc.color; e.currentTarget.style.background = acc.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = acc.bg; e.currentTarget.style.background = '#f8fafd'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: acc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: acc.color }}>{acc.label[0]}</span>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>{acc.label}</div>
                      <div style={{ fontSize: 12, color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.email}</div>
                    </div>
                    <ArrowRight size={14} color={acc.color} />
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: 12, background: '#f4f6fb', borderRadius: 10, fontSize: 12, color: '#718096', lineHeight: 1.6 }}>
                Demo includes 10 students, payments, attendance, exam results and announcements.
              </div>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: '#718096', textAlign: 'center' }}>
          by <strong style={{ color: '#1a202c' }}>Helvino Technologies</strong> · helvino.org
        </p>
      </div>
    </div>
  );
}
