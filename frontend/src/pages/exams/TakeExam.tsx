import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'instructions' | 'taking' | 'result'>('instructions');
  const [, setSubmission] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/exams').then(r => {
        const found = r.data.data.find((e: any) => e.id === id);
        setExam(found);
        return found;
      }),
      api.get(`/exams/${id}/questions`),
      api.get(`/exams/${id}/my-submission`),
    ]).then(([ex, qRes, subRes]) => {
      setQuestions(qRes.data.data);
      const sub = subRes.data.data;
      if (sub?.status === 'submitted' || sub?.status === 'pending_grading') {
        setResult({ total_score: sub.total_score, max_score: sub.max_score, percentage: sub.max_score > 0 ? Math.round((sub.total_score / sub.max_score) * 100) : 0, pending_grading: sub.status === 'pending_grading' });
        setPhase('result');
      } else if (sub?.status === 'in_progress') {
        setSubmission(sub);
        const elapsed = sub.started_at ? Math.floor((Date.now() - new Date(sub.started_at).getTime()) / 1000) : 0;
        const totalSec = (ex?.duration_minutes || 60) * 60;
        setTimeLeft(Math.max(0, totalSec - elapsed));
        setPhase('taking');
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const startExam = async () => {
    try {
      const r = await api.post(`/exams/${id}/start`);
      setSubmission(r.data.data);
      setTimeLeft((exam?.duration_minutes || 60) * 60);
      setPhase('taking');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start exam');
    }
  };

  const submitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
      const r = await api.post(`/exams/${id}/submit`, { answers: answerList });
      setResult(r.data.data);
      setPhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Exam submitted!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  }, [id, answers, submitting]);

  // Timer
  useEffect(() => {
    if (phase !== 'taking') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitExam]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answered = Object.keys(answers).length;
  const q = questions[current];

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>;
  if (!exam) return <div style={{ padding: 40 }}>Exam not found.</div>;

  // RESULT SCREEN
  if (phase === 'result') {
    const pct = result?.percentage || 0;
    const passed = pct >= 40;
    return (
      <div className="fade-in" style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>{result?.pending_grading ? '📝' : passed ? '🎉' : '😔'}</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
            {result?.pending_grading ? 'Submitted for Grading' : passed ? 'Congratulations!' : 'Better luck next time'}
          </h2>
          {result?.pending_grading
            ? <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your essay answers will be graded by the lecturer. Check results later.</p>
            : (
              <>
                <div style={{ fontSize: 56, fontWeight: 900, color: passed ? 'var(--success)' : 'var(--danger)', margin: '16px 0' }}>{pct}%</div>
                <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 8 }}>Score: {result?.total_score} / {result?.max_score}</div>
                <div style={{ marginBottom: 24 }}>
                  <span className={`badge badge-${passed ? 'success' : 'danger'}`} style={{ fontSize: 14, padding: '6px 16px' }}>{passed ? 'Pass' : 'Fail'}</span>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 24 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: passed ? 'var(--success)' : 'var(--danger)', transition: 'width 1s' }} />
                </div>
              </>
            )
          }
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/results')}>View All Results</button>
            <button className="btn btn-primary" onClick={() => navigate('/exams')}>Back to Exams</button>
          </div>
        </div>
      </div>
    );
  }

  // INSTRUCTIONS SCREEN
  if (phase === 'instructions') {
    return (
      <div className="fade-in" style={{ maxWidth: 580, margin: '40px auto', padding: '0 16px' }}>
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>{exam.name}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <span className="badge badge-info">{exam.unit_name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
              <Clock size={14} />{exam.duration_minutes} minutes
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{questions.length} questions</span>
          </div>

          {exam.instructions && (
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Instructions</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{exam.instructions}</p>
            </div>
          )}

          <div style={{ background: '#fef9c3', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={18} style={{ color: '#92400e', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 4 }}>Before you start</div>
                <ul style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
                  <li>You have <strong>{exam.duration_minutes} minutes</strong> to complete this exam.</li>
                  <li>Once started, the timer cannot be paused.</li>
                  <li>Ensure you have a stable internet connection.</li>
                  <li>The exam will auto-submit when time runs out.</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/exams')}>Cancel</button>
            <button className="btn btn-primary" onClick={startExam} style={{ fontSize: 15, padding: '10px 28px' }}>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TAKING EXAM
  const isLast = current === questions.length - 1;
  const timerDanger = timeLeft < 120;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
      {/* Timer bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: `2px solid ${timerDanger ? '#dc2626' : 'var(--border)'}` }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{exam.name}</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{answered}/{questions.length} answered</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 18, color: timerDanger ? '#dc2626' : 'var(--primary)', fontFamily: 'monospace' }}>
            <Clock size={18} />{formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>Question {current + 1} of {questions.length}</span>
          <span style={{ fontSize: 12, background: 'var(--bg)', padding: '3px 10px', borderRadius: 20 }}>{q?.marks} {parseFloat(q?.marks) === 1 ? 'mark' : 'marks'}</span>
        </div>

        <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.7, marginBottom: 24 }}>{q?.question_text}</p>

        {q?.question_type === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(q.options || []).map((opt: any) => {
              const selected = answers[q.id] === opt.label;
              return (
                <button key={opt.label} onClick={() => setAnswers((a: any) => ({ ...a, [q.id]: opt.label }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`, background: selected ? '#eff6ff' : 'var(--bg)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: selected ? 'var(--primary)' : 'var(--border)', color: selected ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{opt.label}</span>
                  <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400 }}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {q?.question_type === 'true_false' && (
          <div style={{ display: 'flex', gap: 14 }}>
            {['true', 'false'].map(v => (
              <button key={v} onClick={() => setAnswers((a: any) => ({ ...a, [q.id]: v }))}
                style={{ flex: 1, padding: '16px', borderRadius: 10, border: `2px solid ${answers[q.id] === v ? 'var(--primary)' : 'var(--border)'}`, background: answers[q.id] === v ? '#eff6ff' : 'var(--bg)', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                {v === 'true' ? '✓ True' : '✗ False'}
              </button>
            ))}
          </div>
        )}

        {q?.question_type === 'essay' && (
          <textarea className="form-input" rows={6} placeholder="Type your answer here..." style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.7 }}
            value={answers[q.id] || ''} onChange={e => setAnswers((a: any) => ({ ...a, [q.id]: e.target.value }))} />
        )}
      </div>

      {/* Question navigator */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0', justifyContent: 'center' }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${current === i ? 'var(--primary)' : answers[questions[i].id] ? 'var(--success)' : 'var(--border)'}`, background: current === i ? 'var(--primary)' : answers[questions[i].id] ? '#dcfce7' : 'transparent', color: current === i ? '#fff' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}><ChevronLeft size={16} />Previous</button>
        {!isLast
          ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Next<ChevronRight size={16} /></button>
          : <button className="btn btn-primary" onClick={submitExam} disabled={submitting}
              style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
              {submitting ? <span className="loader" /> : <><CheckCircle size={16} />Submit Exam</>}
            </button>
        }
      </div>
    </div>
  );
}
