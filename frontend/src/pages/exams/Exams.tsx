import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const canSchedule = ['admin', 'registrar', 'lecturer', 'superadmin'].includes(user?.role || '');

  const doFetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/exams'); setExams(r.data.data); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    doFetch();
    api.get('/academic/programs').then(r => setPrograms(r.data.data));
    api.get('/academic/units').then(r => setUnits(r.data.data));
  }, [doFetch]);

  const typeColor: any = { cat:'warning', end_of_semester:'info', supplementary:'danger' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Exams</h1><p className="page-subtitle">{exams.length} exams scheduled</p></div>
        {canSchedule && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Schedule Exam</button>}
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Exam Name</th><th>Unit</th><th>Program</th><th>Type</th><th>Date</th><th>Venue</th><th>Marks</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></td></tr>
              : exams.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ fontWeight:500 }}>{e.name}</td>
                  <td><div style={{ fontSize:13 }}>{e.unit_name}</div><span className="mono" style={{ fontSize:11, color:'var(--text-muted)' }}>{e.unit_code}</span></td>
                  <td style={{ fontSize:13 }}>{e.program_name}</td>
                  <td><span className={`badge badge-${typeColor[e.exam_type]||'gray'}`}>{e.exam_type?.replace('_',' ')}</span></td>
                  <td style={{ fontSize:13 }}>{e.exam_date ? new Date(e.exam_date).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize:13 }}>{e.venue||'—'}</td>
                  <td style={{ fontSize:13 }}>{e.total_marks} (Pass:{e.pass_mark})</td>
                  <td><span className={`badge badge-${e.status==='completed'?'success':'info'}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && canSchedule && <ScheduleExamModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); doFetch(); }} programs={programs} units={units} />}
    </div>
  );
}

function ScheduleExamModal({ onClose, onSaved, programs, units }: any) {
  const [form, setForm] = useState<any>({ exam_type:'end_of_semester', total_marks:100, pass_mark:40 });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/exams', form); toast.success('Exam scheduled'); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ fontWeight:600 }}>Schedule Exam</h3><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="form-group"><label className="form-label">Exam Name *</label><input className="form-input" required value={form.name||''} onChange={e=>set('name',e.target.value)} /></div>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="form-group"><label className="form-label">Program</label><select className="form-input form-select" value={form.program_id||''} onChange={e=>set('program_id',e.target.value)}><option value="">Select...</option>{programs.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Unit</label><select className="form-input form-select" value={form.unit_id||''} onChange={e=>set('unit_id',e.target.value)}><option value="">Select...</option>{units.map((u:any)=><option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Exam Type</label><select className="form-input form-select" value={form.exam_type} onChange={e=>set('exam_type',e.target.value)}><option value="cat">CAT</option><option value="end_of_semester">End of Semester</option><option value="supplementary">Supplementary</option></select></div>
                <div className="form-group"><label className="form-label">Exam Date</label><input type="date" className="form-input" value={form.exam_date||''} onChange={e=>set('exam_date',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Start Time</label><input type="time" className="form-input" value={form.start_time||''} onChange={e=>set('start_time',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">End Time</label><input type="time" className="form-input" value={form.end_time||''} onChange={e=>set('end_time',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Total Marks</label><input type="number" className="form-input" value={form.total_marks} onChange={e=>set('total_marks',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Pass Mark</label><input type="number" className="form-input" value={form.pass_mark} onChange={e=>set('pass_mark',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Venue</label><input className="form-input" value={form.venue||''} onChange={e=>set('venue',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Academic Year</label><input className="form-input" placeholder="2024/2025" value={form.academic_year||''} onChange={e=>set('academic_year',e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading?<span className="loader"/>:'Schedule Exam'}</button></div>
        </form>
      </div>
    </div>
  );
}
