import React, { useState, useRef } from 'react';
import { Save, Lock, User, Camera, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, loadUser } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated');
      loadUser();
    } finally { setLoading(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } finally { setLoading(false); }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be smaller than 2MB'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Resize to max 400px
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
        else { if (h > max) { w = Math.round(w * max / h); h = max; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewPhoto(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!previewPhoto) return;
    setPhotoLoading(true);
    try {
      await api.post('/auth/upload-photo', { photo: previewPhoto });
      toast.success('Profile photo updated!');
      setPreviewPhoto(null);
      loadUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setPhotoLoading(false); }
  };

  const displayPhoto = previewPhoto || user?.profile_photo;

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your account settings</p></div>
      </div>

      {/* Avatar card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            {displayPhoto
              ? <img src={displayPhoto} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            }
            <button onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20 }}>{user?.first_name} {user?.last_name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{user?.role}</span>
              {user?.institution_name && <span className="badge badge-gray">{user?.institution_name}</span>}
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {previewPhoto && (
              <button className="btn btn-primary btn-sm" onClick={uploadPhoto} disabled={photoLoading}>
                {photoLoading ? <span className="loader" /> : <><Camera size={13} />Save Photo</>}
              </button>
            )}
            {previewPhoto && (
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewPhoto(null)}>Cancel</button>
            )}
            {user?.role === 'student' && user?.student_id && (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/transcript')}>
                <FileText size={13} />My Transcript
              </button>
            )}
          </div>
        </div>
        {previewPhoto && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1d4ed8' }}>
            Preview shown above. Click "Save Photo" to apply.
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} />Profile</span>
        </button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={14} />Change Password</span>
        </button>
      </div>

      {tab === 'profile' && (
        <div className="card">
          <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 0712345678" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed. Contact admin.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loader" /> : <><Save size={15} />Save Profile</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card">
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input type="password" className="form-input" required value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input type="password" className="form-input" required minLength={6} value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input type="password" className="form-input" required value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loader" /> : <><Lock size={15} />Change Password</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
