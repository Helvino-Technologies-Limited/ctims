import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Megaphone, Bell } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('announcements');
  const { user } = useAuthStore();
  const canPost = ['admin', 'superadmin', 'registrar'].includes(user?.role || '');

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/communications/announcements'); setAnnouncements(r.data.data.announcements||[]); }
    finally { setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const r = await api.get('/communications/notifications');
    setNotifications(r.data.data.notifications||[]);
    setUnread(r.data.data.unread_count||0);
  }, []);

  useEffect(() => { fetchAnnouncements(); fetchNotifications(); }, [fetchAnnouncements, fetchNotifications]);

  const markAllRead = async () => { await api.patch('/communications/notifications/all/read'); fetchNotifications(); };

  const priorityColor: any = { high:'danger', normal:'info', low:'gray' };
  const audienceColor: any = { all:'info', students:'success', staff:'warning' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Communications</h1><p className="page-subtitle">Announcements and notifications</p></div>
        {canPost && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />New Announcement</button>}
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='announcements'?'active':''}`} onClick={() => setTab('announcements')}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Megaphone size={14} />Announcements</span>
        </button>
        <button className={`tab ${tab==='notifications'?'active':''}`} onClick={() => setTab('notifications')}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Bell size={14} />Notifications
            {unread>0 && <span style={{ background:'var(--danger)', color:'#fff', borderRadius:10, fontSize:11, padding:'1px 6px', fontWeight:600 }}>{unread}</span>}
          </span>
        </button>
      </div>
      {tab==='announcements' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {loading ? (
            <div className="card" style={{ textAlign:'center', padding:60 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></div>
          ) : announcements.length===0 ? (
            <div className="card"><div className="empty-state"><Megaphone size={48} /><p>No announcements yet.</p></div></div>
          ) : announcements.map((a: any) => (
            <div key={a.id} className="card" style={{ borderLeft:`4px solid ${a.priority==='high'?'var(--danger)':a.priority==='normal'?'var(--primary)':'var(--border)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <h3 style={{ fontWeight:600, fontSize:16 }}>{a.title}</h3>
                  <span className={`badge badge-${priorityColor[a.priority]||'gray'}`}>{a.priority} priority</span>
                  <span className={`badge badge-${audienceColor[a.target_audience]||'info'}`}>{a.target_audience==='all'?'Everyone':a.target_audience}</span>
                  {a.program_name && <span className="badge badge-gray">{a.program_name}</span>}
                </div>
                <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', marginLeft:12 }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.7 }}>{a.content}</p>
              <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)' }}>
                Published by <strong>{a.published_by_name}</strong>
                {a.expires_at && <span> · Expires {new Date(a.expires_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='notifications' && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontWeight:600 }}>Your Notifications</h3>
            {unread>0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all as read</button>}
          </div>
          {notifications.length===0 ? (
            <div className="empty-state"><Bell size={48} /><p>No notifications</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {notifications.map((n: any) => (
                <div key={n.id} style={{ display:'flex', gap:12, padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: n.is_read?'var(--border)':'var(--primary)', marginTop:6, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight: n.is_read?400:600, fontSize:14 }}>{n.title}</div>
                    <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>{n.message}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => api.patch(`/communications/notifications/${n.id}/read`).then(fetchNotifications)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, alignSelf:'flex-start' }}>×</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showModal && canPost && <CreateAnnouncementModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchAnnouncements(); }} />}
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ target_audience:'all', priority:'normal' });
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  useEffect(() => { api.get('/academic/programs').then(r => setPrograms(r.data.data)); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/communications/announcements', form); toast.success('Announcement created'); onSaved(); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Create Announcement</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-input" required value={form.title||''} onChange={e=>set('title',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Content *</label><textarea className="form-input" required rows={5} value={form.content||''} onChange={e=>set('content',e.target.value)} /></div>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group"><label className="form-label">Target Audience</label><select className="form-input form-select" value={form.target_audience} onChange={e=>set('target_audience',e.target.value)}><option value="all">Everyone</option><option value="students">Students Only</option><option value="staff">Staff Only</option><option value="specific_program">Specific Program</option></select></div>
              <div className="form-group"><label className="form-label">Priority</label><select className="form-input form-select" value={form.priority} onChange={e=>set('priority',e.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div>
            </div>
            {form.target_audience==='specific_program' && (
              <div className="form-group"><label className="form-label">Program</label><select className="form-input form-select" value={form.program_id||''} onChange={e=>set('program_id',e.target.value)}><option value="">Select...</option>{programs.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            )}
            <div className="form-group"><label className="form-label">Expiry Date (optional)</label><input type="datetime-local" className="form-input" value={form.expires_at||''} onChange={e=>set('expires_at',e.target.value)} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Publish'}</button></div>
        </form>
      </div>
    </div>
  );
}
