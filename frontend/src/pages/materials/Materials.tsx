import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, Upload, Download, Eye, Trash2, FileText, FileImage,
  Film, Music, Archive, BookOpen, X
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const typeIcon = (fileType: string) => {
  if (!fileType) return <FileText size={22} />;
  if (fileType.includes('pdf')) return <FileText size={22} color="#dc2626" />;
  if (fileType.includes('image')) return <FileImage size={22} color="#0891b2" />;
  if (fileType.includes('video')) return <Film size={22} color="#7c3aed" />;
  if (fileType.includes('audio')) return <Music size={22} color="#d97706" />;
  if (fileType.includes('zip') || fileType.includes('rar')) return <Archive size={22} color="#6b7280" />;
  if (fileType.includes('word') || fileType.includes('doc')) return <FileText size={22} color="#1d4ed8" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText size={22} color="#16a34a" />;
  if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return <FileText size={22} color="#ea580c" />;
  return <FileText size={22} />;
};

const formatSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const materialTypes = ['document', 'slides', 'video', 'audio', 'image', 'assignment', 'other'];

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const { user } = useAuthStore();
  const canUpload = ['admin', 'lecturer', 'registrar', 'superadmin'].includes(user?.role || '');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/materials', { params: { search, unit_id: filterUnit, material_type: filterType } });
      setMaterials(r.data.data.materials);
      setTotal(r.data.data.total);
    } finally { setLoading(false); }
  }, [search, filterUnit, filterType]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { api.get('/academic/units').then(r => setUnits(r.data.data)); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Material deleted');
      fetchMaterials();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDownload = async (material: any) => {
    try {
      const r = await api.get(`/materials/${material.id}`);
      const fileData = r.data.data.file_data;
      if (!fileData) { toast.error('File data not available'); return; }
      const link = document.createElement('a');
      link.href = fileData;
      link.download = material.file_name || material.title;
      link.click();
    } catch { toast.error('Download failed'); }
  };

  const handleView = async (material: any) => {
    try {
      const r = await api.get(`/materials/${material.id}`);
      setViewing(r.data.data);
    } catch { toast.error('Failed to load material'); }
  };

  const canView = (fileType: string) => {
    if (!fileType) return false;
    return fileType.includes('pdf') || fileType.includes('image') ||
           fileType.includes('text') || fileType.includes('video') || fileType.includes('audio');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning Materials</h1>
          <p className="page-subtitle">{total} materials available</p>
        </div>
        {canUpload && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Upload size={16} />Upload Material
          </button>
        )}
      </div>

      <div className="card">
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search materials, units..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input form-select" style={{ width: 180 }} value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
            <option value="">All Units</option>
            {units.map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
          </select>
          <select className="form-input form-select" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {materialTypes.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>
        ) : materials.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>No learning materials yet.</p>
            {canUpload && <p style={{ fontSize: 13 }}>Upload your first material to get started.</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 4 }}>
            {materials.map((m: any) => (
              <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {typeIcon(m.file_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, wordBreak: 'break-word' }}>{m.title}</div>
                    {m.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{m.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.unit_code && <span className="badge badge-info" style={{ fontSize: 11 }}>{m.unit_code}</span>}
                  <span className="badge badge-gray" style={{ fontSize: 11, textTransform: 'capitalize' }}>{m.material_type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatSize(m.file_size)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  By {m.uploaded_by_name} · {new Date(m.created_at).toLocaleDateString()} · {m.download_count} downloads
                </div>
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {canView(m.file_type) && (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleView(m)}>
                      <Eye size={13} />Read/View
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleDownload(m)}>
                    <Download size={13} />Download
                  </button>
                  {(canUpload && (user?.role !== 'lecturer' || m.uploaded_by_name === `${user?.first_name} ${user?.last_name}`)) && (
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }} onClick={() => handleDelete(m.id)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal units={units} onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); fetchMaterials(); }} />
      )}
      {viewing && (
        <ViewerModal material={viewing} onClose={() => setViewing(null)} onDownload={() => handleDownload(viewing)} />
      )}
    </div>
  );
}

function UploadModal({ units, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ material_type: 'document' });
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const processFile = (file: File) => {
    if (file.size > 45 * 1024 * 1024) { toast.error('File too large. Max 45MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      set('file_data', e.target?.result as string);
      set('file_name', file.name);
      set('file_type', file.type);
      set('file_size', file.size);
      if (!form.title) set('title', file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file_data) { toast.error('Please select a file'); return; }
    setLoading(true);
    try {
      await api.post('/materials', form);
      toast.success('Material uploaded!');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Upload Learning Material</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? 'var(--primary)' : form.file_data ? 'var(--success)' : 'var(--border)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#eff6ff' : form.file_data ? '#f0fdf4' : 'var(--bg)', transition: 'all 0.15s' }}>
              {form.file_data ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>{form.file_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{formatSize(form.file_size)} · Click to change</div>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>Drop file here or click to browse</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, Word, Excel, PPT, images, video — Max 45MB</div>
                </div>
              )}
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar" />
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" required value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Introduction to Algorithms - Week 1" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief description of this material..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Unit / Subject</label>
                <select className="form-input form-select" value={form.unit_id || ''} onChange={e => set('unit_id', e.target.value)}>
                  <option value="">General / All Units</option>
                  {units.map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input form-select" value={form.material_type} onChange={e => set('material_type', e.target.value)}>
                  {materialTypes.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.file_data}>
              {loading ? <span className="loader" /> : <><Upload size={14} />Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewerModal({ material, onClose, onDownload }: any) {
  const isPdf = material.file_type?.includes('pdf');
  const isImage = material.file_type?.includes('image');
  const isVideo = material.file_type?.includes('video');
  const isAudio = material.file_type?.includes('audio');
  const isText = material.file_type?.includes('text');

  return (
    <div className="modal-overlay" style={{ alignItems: 'stretch', padding: 0 }} onClick={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 900, margin: 'auto', height: '95vh', background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>{material.title}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{material.unit_code ? `${material.unit_code} · ` : ''}{material.uploaded_by_name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onDownload}><Download size={14} />Download</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPdf && (
            <iframe src={material.file_data} style={{ width: '100%', height: '100%', border: 'none' }} title={material.title} />
          )}
          {isImage && (
            <img src={material.file_data} alt={material.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
          {isVideo && (
            <video controls style={{ maxWidth: '100%', maxHeight: '100%' }}>
              <source src={material.file_data} type={material.file_type} />
            </video>
          )}
          {isAudio && (
            <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 16, textAlign: 'center' }}>
              <Music size={64} style={{ color: '#d97706', marginBottom: 16 }} />
              <div style={{ fontWeight: 600, marginBottom: 16 }}>{material.title}</div>
              <audio controls style={{ width: '100%', maxWidth: 400 }}>
                <source src={material.file_data} type={material.file_type} />
              </audio>
            </div>
          )}
          {isText && (
            <div style={{ background: '#fff', padding: 32, maxWidth: 800, width: '100%', height: '100%', overflow: 'auto' }}>
              <pre style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {atob(material.file_data.split(',')[1] || '')}
              </pre>
            </div>
          )}
          {!isPdf && !isImage && !isVideo && !isAudio && !isText && (
            <div style={{ padding: 60, textAlign: 'center', color: '#fff' }}>
              <FileText size={64} style={{ marginBottom: 16, opacity: 0.6 }} />
              <div style={{ fontSize: 16, marginBottom: 12 }}>Preview not available for this file type.</div>
              <button className="btn btn-primary" onClick={onDownload}><Download size={16} />Download to View</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
