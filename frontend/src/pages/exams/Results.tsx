import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function Results() {
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'enter'|'view'>('view');
  const { user } = useAuthStore();
  const canEnter = ['admin', 'registrar', 'lecturer', 'superadmin'].includes(user?.role || '');

  useEffect(() => {
    api.get('/exams').then(r => setExams(r.data.data));
    api.get('/exams/results').then(r => setResults(r.data.data));
  }, []);

  const loadStudentsForExam = async (examId: string) => {
    setSelectedExam(examId);
    if (!examId) return;
    const exam = exams.find(e => e.id === examId);
    if (exam?.program_id) {
      const r = await api.get('/students', { params: { program_id: exam.program_id, limit: 200 } });
      const studs = r.data.data.students;
      setStudents(studs);
      const initial: any = {};
      studs.forEach((s: any) => { initial[s.id] = { cat_marks:'', exam_marks:'' }; });
      setMarks(initial);
    }
  };

  const setMark = (studentId: string, field: string, value: string) => {
    setMarks((m: any) => ({ ...m, [studentId]: { ...(m[studentId]||{}), [field]: value } }));
  };

  const submitResults = async () => {
    if (!selectedExam) { toast.error('Select an exam'); return; }
    setLoading(true);
    try {
      const records = Object.entries(marks)
        .filter(([, m]: any) => m.cat_marks !== '' || m.exam_marks !== '')
        .map(([student_id, m]: any) => ({ student_id, cat_marks: parseFloat(m.cat_marks)||0, exam_marks: parseFloat(m.exam_marks)||0 }));
      await api.post('/exams/results', { exam_id: selectedExam, results: records });
      toast.success('Results saved successfully');
      setTab('view');
      api.get('/exams/results').then(r => setResults(r.data.data));
    } finally { setLoading(false); }
  };

  const gradeColor = (g: string) => {
    if (g==='A') return 'var(--success)';
    if (g==='B') return '#0891b2';
    if (g==='C') return 'var(--warning)';
    if (g==='E') return 'var(--danger)';
    return 'var(--text)';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Exam Results</h1><p className="page-subtitle">Enter and view student results</p></div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='view'?'active':''}`} onClick={() => setTab('view')}>View Results</button>
        {canEnter && <button className={`tab ${tab==='enter'?'active':''}`} onClick={() => setTab('enter')}>Enter Marks</button>}
      </div>
      {tab==='view' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Student</th><th>Unit</th><th>Exam</th><th>CAT</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remarks</th></tr></thead>
              <tbody>
                {results.length===0
                  ? <tr><td colSpan={8}><div className="empty-state"><FileText size={48} /><p>No results entered yet.</p></div></td></tr>
                  : results.map((r: any) => (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight:500 }}>{r.student_name}</div><span className="mono" style={{ fontSize:12, color:'var(--text-muted)' }}>{r.student_number}</span></td>
                      <td><div style={{ fontSize:13 }}>{r.unit_name}</div><span className="mono" style={{ fontSize:11 }}>{r.unit_code}</span></td>
                      <td style={{ fontSize:13 }}>{r.exam_name}</td>
                      <td style={{ textAlign:'center' }}>{r.cat_marks}</td>
                      <td style={{ textAlign:'center' }}>{r.exam_marks}</td>
                      <td style={{ fontWeight:700, textAlign:'center', fontSize:15 }}>{r.total_marks}</td>
                      <td style={{ textAlign:'center' }}><span style={{ fontWeight:800, fontSize:16, color:gradeColor(r.grade) }}>{r.grade}</span></td>
                      <td><span className={`badge badge-${r.remarks==='Fail'?'danger':r.remarks==='Distinction'?'success':'info'}`}>{r.remarks}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='enter' && (
        <div className="card">
          <div style={{ marginBottom:20 }}>
            <div className="form-group">
              <label className="form-label">Select Exam *</label>
              <select className="form-input form-select" style={{ maxWidth:400 }} value={selectedExam} onChange={e => loadStudentsForExam(e.target.value)}>
                <option value="">Choose exam to enter marks...</option>
                {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name} — {e.unit_code}</option>)}
              </select>
            </div>
          </div>
          {students.length > 0 && (
            <>
              <div className="table-container">
                <table>
                  <thead><tr><th>Student No.</th><th>Name</th><th>CAT (30)</th><th>Exam (70)</th><th>Total</th></tr></thead>
                  <tbody>
                    {students.map((s: any) => {
                      const cat  = parseFloat(marks[s.id]?.cat_marks)||0;
                      const exam = parseFloat(marks[s.id]?.exam_marks)||0;
                      const total = cat + exam;
                      return (
                        <tr key={s.id}>
                          <td><span className="mono" style={{ fontSize:12 }}>{s.student_number}</span></td>
                          <td style={{ fontWeight:500 }}>{s.first_name} {s.last_name}</td>
                          <td><input type="number" className="form-input" style={{ width:90 }} min={0} max={30} placeholder="0" value={marks[s.id]?.cat_marks||''} onChange={e=>setMark(s.id,'cat_marks',e.target.value)} /></td>
                          <td><input type="number" className="form-input" style={{ width:90 }} min={0} max={70} placeholder="0" value={marks[s.id]?.exam_marks||''} onChange={e=>setMark(s.id,'exam_marks',e.target.value)} /></td>
                          <td style={{ fontWeight:700, color: total>=40?'var(--success)':total>0?'var(--danger)':'var(--text-muted)' }}>{total>0?total:'—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
                <button className="btn btn-primary" onClick={submitResults} disabled={loading}>{loading?<span className="loader"/>:'Save All Results'}</button>
              </div>
            </>
          )}
          {!selectedExam && <div className="empty-state"><FileText size={48} /><p>Select an exam to enter marks.</p></div>}
        </div>
      )}
    </div>
  );
}
