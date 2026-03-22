import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canAdd  = ['admin', 'superadmin'].includes(user?.role || '');
  const canEdit = ['admin', 'superadmin', 'registrar'].includes(user?.role || '');
  const limit = 20;

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (programFilter) params.program_id = programFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students);
      setTotal(res.data.data.total);
    } finally { setLoading(false); }
  }, [page, search, programFilter, statusFilter]);

  useEffect(() => { doFetch(); }, [doFetch]);
  useEffect(() => { api.get('/academic/programs').then(r => setPrograms(r.data.data)); }, []);

  const statusBadge = (s: string) => {
    const map: any = { active:'success', graduated:'info', deferred:'warning', withdrawn:'danger' };
    return <span className={`badge badge-${map[s]||'gray'}`}>{s}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Students</h1><p className="page-subtitle">{total} total students</p></div>
        {canAdd && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Student</button>}
      </div>
      <div className="card" style={{ marginBottom:16 }}>
        <div className="filters-bar">
          <div className="search-bar"><Search size={15} style={{ color:'var(--text-muted)', flexShrink:0 }} /><input placeholder="Search students..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} /></div>
          <select className="form-input form-select" style={{ width:180 }} value={programFilter} onChange={e=>{ setProgramFilter(e.target.value); setPage(1); }}>
            <option value="">All Programs</option>
            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="form-input form-select" style={{ width:140 }} value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="deferred">Deferred</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Student No.</th><th>Name</th><th>Program</th><th>Year</th><th>Status</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></td></tr>
              ) : students.length===0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No students found</p></div></td></tr>
              ) : students.map((s: any) => (
                <tr key={s.id}>
                  <td><span className="mono" style={{ fontSize:12, fontWeight:600, color:'var(--primary)' }}>{s.student_number}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary-light)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div><div style={{ fontWeight:500 }}>{s.first_name} {s.last_name}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.email}</div></div>
                    </div>
                  </td>
                  <td><div style={{ fontSize:13 }}>{s.program_name}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.program_code}</div></td>
                  <td>Year {s.year_of_study}, Sem {s.semester}</td>
                  <td>{statusBadge(s.status)}</td>
                  <td style={{ fontSize:13 }}>{s.phone}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/students/${s.id}`)}><Eye size={13} /></button>
                      {canEdit && <button className="btn btn-secondary btn-sm"><Edit size={13} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="pagination">
            {Array.from({ length: Math.ceil(total/limit) }, (_, i) => i+1).slice(Math.max(0,page-3), page+2).map(p => (
              <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
      {showModal && canAdd && <AddStudentModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); doFetch(); }} programs={programs} />}
    </div>
  );
}

function AddStudentModal({ onClose, onSaved, programs }: any) {
  const [form, setForm] = useState<any>({ year_of_study:1, semester:1 });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/students', form); toast.success('Student registered successfully'); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Register New Student</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" required value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" required value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" required value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e=>set('phone',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Gender</label><select className="form-input form-select" value={form.gender||''} onChange={e=>set('gender',e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">National ID</label><input className="form-input" value={form.national_id||''} onChange={e=>set('national_id',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Program *</label><select className="form-input form-select" required value={form.program_id||''} onChange={e=>set('program_id',e.target.value)}><option value="">Select Program</option>{programs.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Year of Study</label><select className="form-input form-select" value={form.year_of_study} onChange={e=>set('year_of_study',e.target.value)}>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Semester</label><select className="form-input form-select" value={form.semester} onChange={e=>set('semester',e.target.value)}><option value={1}>Semester 1</option><option value={2}>Semester 2</option></select></div>
              <div className="form-group"><label className="form-label">Guardian Name</label><input className="form-input" value={form.guardian_name||''} onChange={e=>set('guardian_name',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Guardian Phone</label><input className="form-input" value={form.guardian_phone||''} onChange={e=>set('guardian_phone',e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Register Student'}</button></div>
        </form>
      </div>
    </div>
  );
}
