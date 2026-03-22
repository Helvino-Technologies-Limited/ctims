import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, BookOpen, DollarSign, BarChart2 } from 'lucide-react';
import api from '../../config/api';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    api.get(`/students/${id}`).then(r => setStudent(r.data.data));
    api.get(`/exams/transcript/${id}`).then(r => setTranscript(r.data.data)).catch(() => {});
  }, [id]);

  if (!student) return <div style={{ padding: 40, textAlign: 'center' }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students')}><ArrowLeft size={14} />Back</button>
          <div>
            <h1 className="page-title">{student.first_name} {student.last_name}</h1>
            <p className="page-subtitle">Student No: {student.student_number}</p>
          </div>
        </div>
        <span className={`badge badge-${student.status === 'active' ? 'success' : 'warning'}`}>{student.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 12px' }}>
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <h3 style={{ fontWeight: 700 }}>{student.first_name} {student.last_name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{student.program_name}</p>
          </div>
          {[
            { icon: Mail, label: student.email },
            { icon: Phone, label: student.phone || 'N/A' },
            { icon: BookOpen, label: `Year ${student.year_of_study}, Sem ${student.semester}` },
            { icon: DollarSign, label: `KES ${Number(student.total_paid || 0).toLocaleString()} paid` },
            { icon: BarChart2, label: `${student.attendance_rate || 0}% attendance` },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <Icon size={15} style={{ color: 'var(--text-muted)' }} /><span>{label}</span>
            </div>
          ))}
        </div>

        {/* Details */}
        <div>
          <div className="tabs">
            {['profile','transcript','payments'].map(t => <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>)}
          </div>

          {tab === 'profile' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Student Information</h3>
              <div className="grid-2">
                {[['Full Name', `${student.first_name} ${student.last_name}`],['Email', student.email],['Phone', student.phone],['Gender', student.gender],['Date of Birth', student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'],['National ID', student.national_id],['Guardian', student.guardian_name],['Guardian Phone', student.guardian_phone],['Admission Date', new Date(student.admission_date).toLocaleDateString()],['Department', student.department_name]].map(([k,v]) => (
                  <div key={k}><div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{k}</div><div style={{ fontWeight: 500, marginTop: 2 }}>{v || 'N/A'}</div></div>
                ))}
              </div>
            </div>
          )}

          {tab === 'transcript' && transcript && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600 }}>Academic Transcript</h3>
                <div style={{ fontSize: 14 }}>GPA: <strong style={{ color: 'var(--primary)' }}>{transcript.gpa}</strong></div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Unit</th><th>Code</th><th>CAT</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {transcript.results.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.unit_name}</td><td><span className="mono" style={{ fontSize: 12 }}>{r.unit_code}</span></td>
                        <td>{r.cat_marks}</td><td>{r.exam_marks}</td><td style={{ fontWeight: 600 }}>{r.total_marks}</td>
                        <td><span style={{ fontWeight: 700, color: r.grade === 'A' ? 'var(--success)' : r.grade === 'E' ? 'var(--danger)' : 'var(--text)' }}>{r.grade}</span></td>
                        <td><span className={`badge badge-${r.remarks === 'Fail' ? 'danger' : 'success'}`}>{r.remarks}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Payment History</h3>
              <p style={{ color: 'var(--text-muted)' }}>Payment records will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
