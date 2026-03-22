import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle, BarChart3, DollarSign, Users, BookOpen, Shield, Zap, Globe, Menu, X, ChevronRight, Star } from 'lucide-react';

const PHOTOS = {
  students:   'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=500&q=80',
  classroom:  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=500&q=80',
  lecturer:   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=80',
  campus:     'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=500&q=80',
  lab:        'https://images.unsplash.com/photo-1532094349884-543290ce540e?auto=format&fit=crop&w=500&q=80',
  library:    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=500&q=80',
  graduation: 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=500&q=80',
  collab:     'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=500&q=80',
  research:   'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=500&q=80',
};

const features = [
  { icon: Users,      title: 'Student Management',  desc: 'Complete student lifecycle — admission to graduation with profiles, records and document generation.' },
  { icon: DollarSign, title: 'Fee Collection',       desc: 'M-Pesa, cash & bank tracking with receipts, balance tracking and defaulter reports.' },
  { icon: BarChart3,  title: 'Exams & Results',      desc: 'Full exam management, marks entry, auto-grading, transcripts and GPA calculation.' },
  { icon: BookOpen,   title: 'Academic Management',  desc: 'Programs, departments, units, timetables, attendance tracking and lecturer assignments.' },
  { icon: Shield,     title: 'Role-Based Access',    desc: 'Admin, Finance, Registrar, Lecturer and Student roles with secure data isolation.' },
  { icon: Zap,        title: 'Real-time Dashboard',  desc: 'Live analytics on enrollments, fee collection, attendance rates and exam performance.' },
  { icon: Globe,      title: 'Multi-Tenant SaaS',    desc: 'One platform for multiple institutions — each with completely isolated and secure data.' },
  { icon: CheckCircle,title: 'Online Applications',  desc: 'Public-facing portal for prospective students to apply directly online.' },
];

const gallery = [
  { src: PHOTOS.students,   label: 'Student Life' },
  { src: PHOTOS.classroom,  label: 'Modern Classrooms' },
  { src: PHOTOS.lecturer,   label: 'Expert Lecturers' },
  { src: PHOTOS.lab,        label: 'Research & Labs' },
  { src: PHOTOS.campus,     label: 'Beautiful Campus' },
  { src: PHOTOS.library,    label: 'World-Class Library' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#fff', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav className="landing-nav">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1a202c', lineHeight: 1.2 }}>CTIMS</div>
            <div style={{ fontSize: 11, color: '#718096', lineHeight: 1 }}>by Helvino Tech</div>
          </div>
        </Link>
        <div className="landing-nav-links">
          <a href="#features" style={{ color: '#4a5568', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}>Features</a>
          <a href="#gallery" style={{ color: '#4a5568', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}>Gallery</a>
          <a href="#pricing" style={{ color: '#4a5568', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}>Pricing</a>
          <Link to="/login" style={{ color: '#4a5568', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}>Login</Link>
          <Link to="/register" style={{ background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
        </div>
        <button className="landing-nav-hamburger" onClick={() => setMenuOpen(true)}>
          <Menu size={24} color="#1a202c" />
        </button>
      </nav>

      {/* ── Mobile menu overlay ── */}
      <div className={`landing-mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="landing-mobile-close" onClick={() => setMenuOpen(false)}>
          <X size={28} />
        </button>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
        <Link to="/register" onClick={() => setMenuOpen(false)} style={{ marginTop: 12, background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', color: '#fff', borderRadius: 12, fontWeight: 700, padding: '16px 18px' }}>
          Register Your Institution
        </Link>
      </div>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(160deg,#0a1628 0%,#1a3a6b 50%,#0e9f6e 100%)', padding: '60px 0 0', overflow: 'hidden', position: 'relative' }}>
        {/* Background stars/dots */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 48, position: 'relative', zIndex: 1 }}>
          {/* Left: text */}
          <div className="hero-content" style={{ flex: 1, paddingBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: 24, fontSize: 13, fontWeight: 600, marginBottom: 24, backdropFilter: 'blur(10px)' }}>
              <span>🇰🇪</span> Built for Kenyan Colleges & TVETs
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
              The Complete<br />
              <span style={{ background: 'linear-gradient(90deg,#6ee7b7,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Institution Management
              </span><br />
              System
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', maxWidth: 500, marginBottom: 36, lineHeight: 1.75 }}>
              Manage students, fees, exams, attendance, staff and more — all from one powerful platform built for colleges, TVETs and training centers across Kenya.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" style={{ background: '#fff', color: '#1a56db', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                Register Institution <ChevronRight size={18} />
              </Link>
              <Link to="/login" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(10px)' }}>
                Sign In
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {[PHOTOS.students, PHOTOS.collab, PHOTOS.campus].map((src, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden', marginLeft: i > 0 ? -10 : 0 }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="#fbbf24" color="#fbbf24" />)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Trusted by institutions across Kenya</div>
              </div>
            </div>
          </div>

          {/* Right: photo collage (desktop) */}
          <div className="hero-desktop-photos" style={{ width: 420, flexShrink: 0 }}>
            <div className="hero-photos-grid" style={{ height: 480 }}>
              <div className="hero-photo" style={{ height: 220 }}>
                <img src={PHOTOS.students} alt="Students studying" loading="lazy" />
              </div>
              <div className="hero-photo" style={{ height: 180, alignSelf: 'flex-end' }}>
                <img src={PHOTOS.classroom} alt="Classroom" loading="lazy" />
              </div>
              <div className="hero-photo" style={{ height: 180 }}>
                <img src={PHOTOS.lecturer} alt="Lecturer" loading="lazy" />
              </div>
              <div className="hero-photo" style={{ height: 220, alignSelf: 'flex-end' }}>
                <img src={PHOTOS.campus} alt="Campus" loading="lazy" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile photo strip */}
        <div className="hero-mobile-strip" style={{ display: 'none', padding: '0 16px 0', marginTop: 36 }}>
          <div className="photo-scroll-strip">
            {Object.values(PHOTOS).map((src, i) => (
              <div key={i} className="photo-strip-item">
                <img src={src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <svg style={{ display: 'block', marginTop: 24 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60">
          <path fill="#fff" fillOpacity="1" d="M0,40 C360,0 1080,80 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ background: '#fff', padding: '28px 24px' }}>
        <div className="stats-row" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { value: 'Multi-Tenant', label: 'SaaS Architecture', color: '#1a56db' },
            { value: 'M-Pesa',       label: 'Payment Integration', color: '#0e9f6e' },
            { value: '10+',          label: 'Core Modules', color: '#7c3aed' },
            { value: 'KES 60K',      label: 'Setup Fee', color: '#d97706' },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Photo gallery ── */}
      <section id="gallery" style={{ background: '#f4f6fb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', background: '#e8f0fe', color: '#1a56db', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Campus Life</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#1a202c' }}>Experience World-Class Education</h2>
            <p style={{ fontSize: 16, color: '#718096', marginTop: 10, maxWidth: 500, margin: '10px auto 0' }}>From modern classrooms to cutting-edge research labs — everything your institution needs to thrive.</p>
          </div>
          <div className="gallery-grid">
            {gallery.map(({ src, label }) => (
              <div key={label} className="gallery-item">
                <img src={src} alt={label} loading="lazy" />
                <div className="gallery-caption">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: '#d1fae5', color: '#057a55', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#1a202c' }}>Everything Your Institution Needs</h2>
            <p style={{ fontSize: 16, color: '#718096', marginTop: 10 }}>A comprehensive platform covering every aspect of institutional operations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 20px', transition: 'all 0.25s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,86,219,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#e8f0fe,#d1fae5)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color="#1a56db" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1a202c' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research & Innovation banner ── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
        <img src={PHOTOS.research} alt="Research" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(10,22,40,0.88),rgba(14,159,110,0.7))' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            Powering the Future of Education
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 32 }}>
            Join institutions across Kenya embracing digital transformation. From student admissions to graduation — manage it all with CTIMS.
          </p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1a56db', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>
            Start Today <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: '#f4f6fb', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#ede9fe', color: '#7c3aed', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#1a202c', marginBottom: 10 }}>Simple, Transparent Pricing</h2>
          <p style={{ fontSize: 16, color: '#718096', marginBottom: 40 }}>One plan, all features. No hidden costs.</p>

          <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', border: '2px solid #1a56db', boxShadow: '0 24px 64px rgba(26,86,219,0.14)' }}>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', color: '#fff', padding: '6px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>Full Access Plan</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#1a202c', lineHeight: 1 }}>KES 60,000</div>
            <div style={{ fontSize: 15, color: '#718096', margin: '8px 0 16px' }}>One-time setup fee</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0e9f6e', marginBottom: 4 }}>+ KES 20,000 / year</div>
            <div style={{ fontSize: 14, color: '#718096', marginBottom: 28 }}>Annual subscription renewal</div>

            <div style={{ textAlign: 'left', marginBottom: 28 }}>
              {['All modules included', 'Unlimited students & staff', 'M-Pesa payment integration', 'PDF transcripts & certificates', 'Multi-campus support', 'Dedicated support & onboarding'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CheckCircle size={18} color="#0e9f6e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: '#1a202c' }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#f4f6fb', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#718096', marginBottom: 20 }}>
              Pay via M-Pesa: Paybill <strong style={{ color: '#1a202c' }}>522533</strong> · Account <strong style={{ color: '#1a202c' }}>8071524</strong>
            </div>
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', color: '#fff', padding: '16px', borderRadius: 12, fontSize: 17, fontWeight: 800, textDecoration: 'none' }}>
              Register Your Institution <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a1628', color: '#a0aec0', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1a56db,#0e9f6e)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={18} color="#fff" />
                </div>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>CTIMS</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>The complete college and technical institution management system for Kenya.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 12 }}>Quick Links</div>
              {[{ to: '/login', label: 'Login' }, { to: '/register', label: 'Register Institution' }, { to: '/apply', label: 'Apply Online' }].map(({ to, label }) => (
                <div key={to} style={{ marginBottom: 8 }}>
                  <Link to={to} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a0aec0')}>{label}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 12 }}>Contact</div>
              <div style={{ fontSize: 14, lineHeight: 1.9 }}>
                <div>helvinotechltd@gmail.com</div>
                <div>0110421320</div>
                <div>helvino.org</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13 }}>© 2024 Helvino Technologies Limited. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#fbbf24" color="#fbbf24" />)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
