import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Wifi, WifiOff, Users, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [questionsExam, setQuestionsExam] = useState<any>(null);
  const [submissionsExam, setSubmissionsExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canSchedule = ['admin', 'registrar', 'lecturer', 'superadmin'].includes(user?.role || '');
  const isStudent = user?.role === 'student';

  const doFetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/exams'); setExams(r.data.data); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    doFetch();
    if (!isStudent) {
      api.get('/academic/programs').then(r => setPrograms(r.data.data));
      api.get('/academic/units').then(r => setUnits(r.data.data));
    }
  }, [doFetch, isStudent]);

  const typeColor: any = { cat: 'warning', end_of_semester: 'info', supplementary: 'danger' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <p className="page-subtitle">{exams.length} exams scheduled</p>
        </div>
        {canSchedule && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Schedule Exam</button>}
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Exam</th><th>Unit</th><th>Type</th><th>Date</th><th>Duration</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
                : exams.map((e: any) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 500 }}>{e.name}</span>
                        {e.is_online
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#dbeafe', color: '#1d4ed8', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}><Wifi size={10} />Online</span>
                          : <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#f3f4f6', color: '#6b7280', borderRadius: 12, padding: '2px 8px', fontSize: 11 }}><WifiOff size={10} />Physical</span>}
                      </div>
                      {e.venue && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Venue: {e.venue}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{e.unit_name}</div>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.unit_code}</span>
                    </td>
                    <td><span className={`badge badge-${typeColor[e.exam_type] || 'gray'}`}>{e.exam_type?.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 13 }}>{e.exam_date ? new Date(e.exam_date).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: 13 }}>{e.duration_minutes ? `${e.duration_minutes} min` : '—'}</td>
                    <td><span className={`badge badge-${e.status === 'completed' ? 'success' : 'info'}`}>{e.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isStudent && e.is_online && e.status !== 'completed' && (
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/exams/take/${e.id}`)}>
                            <Play size={12} />Take Exam
                          </button>
                        )}
                        {canSchedule && e.is_online && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setQuestionsExam(e)} title="Manage Questions">
                            <Edit2 size={12} />Questions
                          </button>
                        )}
                        {canSchedule && e.is_online && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setSubmissionsExam(e)} title="View Submissions">
                            <Users size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showModal && canSchedule && (
        <ScheduleExamModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); doFetch(); }}
          programs={programs}
          units={units}
        />
      )}
      {questionsExam && (
        <QuestionsModal exam={questionsExam} onClose={() => setQuestionsExam(null)} />
      )}
      {submissionsExam && (
        <SubmissionsModal exam={submissionsExam} onClose={() => setSubmissionsExam(null)} />
      )}
    </div>
  );
}

function ScheduleExamModal({ onClose, onSaved, programs, units }: any) {
  const [form, setForm] = useState<any>({ exam_type: 'end_of_semester', total_marks: 100, pass_mark: 40, is_online: false, duration_minutes: 60 });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/exams', form); toast.success('Exam scheduled'); onSaved(); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Schedule Exam</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group"><label className="form-label">Exam Name *</label><input className="form-input" required value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select className="form-input form-select" value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                    <option value="">Select...</option>{programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-input form-select" value={form.unit_id || ''} onChange={e => set('unit_id', e.target.value)}>
                    <option value="">Select...</option>{units.map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-input form-select" value={form.exam_type} onChange={e => set('exam_type', e.target.value)}>
                    <option value="cat">CAT</option><option value="end_of_semester">End of Semester</option><option value="supplementary">Supplementary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input type="date" className="form-input" value={form.exam_date || ''} onChange={e => set('exam_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input type="number" className="form-input" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pass Mark</label>
                  <input type="number" className="form-input" value={form.pass_mark} onChange={e => set('pass_mark', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input className="form-input" value={form.venue || ''} onChange={e => set('venue', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" placeholder="2024/2025" value={form.academic_year || ''} onChange={e => set('academic_year', e.target.value)} />
                </div>
              </div>

              {/* Online exam toggle */}
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_online} onChange={e => set('is_online', e.target.checked)} style={{ width: 18, height: 18 }} />
                  <span style={{ fontWeight: 600 }}><Wifi size={14} style={{ display: 'inline', marginRight: 4 }} />Online Exam (Students take it on the app)</span>
                </label>
                {form.is_online && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Duration (minutes)</label>
                      <input type="number" className="form-input" min={5} value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
                    </div>
                  </div>
                )}
                {form.is_online && (
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label">Instructions for Students</label>
                    <textarea className="form-input" rows={3} placeholder="Instructions displayed to students before starting..." value={form.instructions || ''} onChange={e => set('instructions', e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="loader" /> : 'Schedule Exam'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionsModal({ exam, onClose }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/exams/${exam.id}/questions`).then(r => {
      const qs = r.data.data;
      setQuestions(qs.length > 0 ? qs : [newQuestion()]);
    }).finally(() => setLoading(false));
  }, [exam.id]);

  const newQuestion = () => ({ question_text: '', question_type: 'mcq', options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }], correct_answer: 'A', marks: 1 });

  const addQ = () => setQuestions(qs => [...qs, newQuestion()]);
  const removeQ = (i: number) => setQuestions(qs => qs.filter((_, idx) => idx !== i));
  const setQ = (i: number, k: string, v: any) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [k]: v } : q));
  const setOption = (qi: number, oi: number, v: string) => setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o: any, oidx: number) => oidx === oi ? { ...o, text: v } : o) } : q));

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/exams/${exam.id}/questions`, { questions });
      toast.success(`${questions.length} questions saved`);
      onClose();
    } finally { setSaving(false); }
  };

  const totalMarks = questions.reduce((s, q) => s + parseFloat(q.marks || 1), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Questions — {exam.name}</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{questions.length} questions · {totalMarks} marks</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
          </div>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Q{i + 1}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select className="form-input form-select" style={{ width: 120, padding: '4px 8px', fontSize: 12 }} value={q.question_type} onChange={e => setQ(i, 'question_type', e.target.value)}>
                        <option value="mcq">MCQ</option>
                        <option value="true_false">True/False</option>
                        <option value="essay">Essay</option>
                      </select>
                      <input type="number" className="form-input" style={{ width: 60, padding: '4px 8px', fontSize: 12 }} min={0.5} step={0.5} value={q.marks} onChange={e => setQ(i, 'marks', e.target.value)} title="Marks" />
                      {questions.length > 1 && <button onClick={() => removeQ(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>Remove</button>}
                    </div>
                  </div>
                  <textarea className="form-input" rows={2} placeholder="Question text..." value={q.question_text} onChange={e => setQ(i, 'question_text', e.target.value)} style={{ resize: 'vertical', marginBottom: 10 }} />

                  {q.question_type === 'mcq' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {(q.options || []).map((opt: any, oi: number) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, width: 20, color: 'var(--primary)' }}>{opt.label}.</span>
                          <input className="form-input" style={{ flex: 1, padding: '5px 8px', fontSize: 13 }} placeholder={`Option ${opt.label}`} value={opt.text} onChange={e => setOption(i, oi, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'mcq' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Correct Answer:</span>
                      {['A', 'B', 'C', 'D'].map(l => (
                        <button key={l} onClick={() => setQ(i, 'correct_answer', l)}
                          style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${q.correct_answer === l ? 'var(--primary)' : 'var(--border)'}`, background: q.correct_answer === l ? 'var(--primary)' : 'transparent', color: q.correct_answer === l ? '#fff' : 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'true_false' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Answer:</span>
                      {['true', 'false'].map(v => (
                        <button key={v} onClick={() => setQ(i, 'correct_answer', v)}
                          style={{ padding: '4px 16px', borderRadius: 20, border: `2px solid ${q.correct_answer === v ? 'var(--primary)' : 'var(--border)'}`, background: q.correct_answer === v ? 'var(--primary)' : 'transparent', color: q.correct_answer === v ? '#fff' : 'var(--text)', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'essay' && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Essay — students type a free-form answer. Grade manually.</div>
                  )}
                </div>
              ))}
              <button className="btn btn-secondary" onClick={addQ} style={{ alignSelf: 'flex-start' }}><Plus size={14} />Add Question</button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="loader" /> : 'Save Questions'}</button>
        </div>
      </div>
    </div>
  );
}

function SubmissionsModal({ exam, onClose }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/exams/${exam.id}/submissions`).then(r => setSubmissions(r.data.data)).finally(() => setLoading(false));
  }, [exam.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Submissions — {exam.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <div className="modal-body">
          {loading ? <div style={{ textAlign: 'center', padding: 30 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div> : (
            submissions.length === 0
              ? <div className="empty-state"><Users size={48} /><p>No submissions yet</p></div>
              : <div className="table-container">
                <table>
                  <thead><tr><th>Student</th><th>Score</th><th>%</th><th>Status</th><th>Submitted</th></tr></thead>
                  <tbody>
                    {submissions.map((s: any) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{s.student_name}</div>
                          <span className="mono" style={{ fontSize: 11 }}>{s.student_number}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{s.total_score} / {s.max_score}</td>
                        <td style={{ fontWeight: 700, color: s.max_score > 0 && (s.total_score / s.max_score) >= 0.4 ? 'var(--success)' : 'var(--danger)' }}>
                          {s.max_score > 0 ? Math.round((s.total_score / s.max_score) * 100) : 0}%
                        </td>
                        <td><span className={`badge badge-${s.status === 'submitted' ? 'success' : s.status === 'in_progress' ? 'warning' : 'info'}`}>{s.status?.replace('_', ' ')}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
