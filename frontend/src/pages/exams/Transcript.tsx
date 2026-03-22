import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';

export default function Transcript() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Use logged-in student_id if no id param
  const studentId = id || user?.student_id;

  useEffect(() => {
    if (!studentId) return;
    api.get(`/exams/transcript/${studentId}`)
      .then(r => setTranscript(r.data.data))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handlePrint = () => window.print();

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>;
  if (!transcript) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Transcript not available.</div>;

  const { student, results, gpa } = transcript;

  // Group results by academic_year + semester
  const grouped: any = {};
  results.forEach((r: any) => {
    const key = `${r.academic_year || 'N/A'} — Semester ${r.semester || 'N/A'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const gradeColor = (g: string) => {
    if (g === 'A') return '#16a34a';
    if (g === 'B') return '#0891b2';
    if (g === 'C') return '#d97706';
    if (g === 'E' || g === 'F') return '#dc2626';
    return '#374151';
  };

  const passedUnits = results.filter((r: any) => r.remarks !== 'Fail').length;
  const failedUnits = results.filter((r: any) => r.remarks === 'Fail').length;

  return (
    <div className="fade-in">
      {/* Screen controls - hidden on print */}
      <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={14} />Back</button>
        <h1 className="page-title" style={{ flex: 1 }}>Academic Transcript</h1>
        <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} />Print Transcript</button>
      </div>

      {/* THE TRANSCRIPT — printed exactly as shown */}
      <div ref={printRef} id="transcript-print" style={{ background: '#fff', maxWidth: 800, margin: '0 auto', fontFamily: 'Georgia, serif', color: '#1a1a1a' }}>

        {/* Header */}
        <div style={{ padding: '32px 40px 20px', borderBottom: '3px solid #1e3a8a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Logo left */}
            <div style={{ width: 90, height: 90, flexShrink: 0 }}>
              {student.logo_url
                ? <img src={student.logo_url} alt="Institution Logo" style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 8 }} />
                : <div style={{ width: 90, height: 90, background: '#1e3a8a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>{(student.institution_name || 'I')[0]}</div>
              }
            </div>

            {/* Center: institution info */}
            <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#1e3a8a', letterSpacing: 0.5, marginBottom: 4 }}>{student.institution_name?.toUpperCase()}</div>
              {student.institution_address && <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 2 }}>{student.institution_address}</div>}
              {student.institution_phone && <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 6 }}>{student.institution_phone}</div>}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a', borderTop: '1px solid #93c5fd', borderBottom: '1px solid #93c5fd', padding: '6px 0', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
                Official Academic Transcript
              </div>
            </div>

            {/* Student photo right */}
            <div style={{ width: 90, height: 110, flexShrink: 0 }}>
              {student.profile_photo
                ? <img src={student.profile_photo} alt={`${student.first_name} ${student.last_name}`} style={{ width: 90, height: 110, objectFit: 'cover', border: '2px solid #1e3a8a', borderRadius: 4 }} />
                : <div style={{ width: 90, height: 110, border: '2px solid #d1d5db', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#6b7280' }}>{student.first_name?.[0]}{student.last_name?.[0]}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>Photo</div>
                </div>
              }
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div style={{ padding: '16px 40px 0', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px', paddingBottom: 16 }}>
            {[
              ['Student Name', `${student.first_name} ${student.last_name}`],
              ['Student No.', student.student_number],
              ['Program', student.program_name],
              ['Email', student.email],
              ['Year of Study', `Year ${student.year_of_study || 1}, Semester ${student.semester || 1}`],
              ['Date Issued', new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 40px', background: '#1e3a8a', color: '#fff' }}>
          {[
            ['Total Units', results.length],
            ['Passed', passedUnits],
            ['Failed', failedUnits],
            ['Cumulative GPA', gpa],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
            </div>
          ))}
        </div>

        {/* Results by semester */}
        <div style={{ padding: '20px 40px' }}>
          {Object.entries(grouped).map(([semester, semResults]: any) => {
            const semGPA = semResults.length > 0
              ? (semResults.reduce((s: number, r: any) => s + parseFloat(r.grade_points || 0), 0) / semResults.length).toFixed(2)
              : '—';
            return (
              <div key={semester} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: 4, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e3a8a' }}>{semester}</span>
                  <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'sans-serif' }}>GPA: {semGPA}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'sans-serif', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {['Code', 'Unit Name', 'Credit Hrs', 'CAT', 'Exam', 'Total', 'Grade', 'Points', 'Remarks'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semResults.map((r: any, i: number) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{r.unit_code}</td>
                        <td style={{ padding: '6px 8px' }}>{r.unit_name}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.credit_hours || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.cat_marks}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.exam_marks}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{r.total_marks}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: 14, color: gradeColor(r.grade) }}>{r.grade}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{r.grade_points}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: r.remarks === 'Fail' ? '#fee2e2' : '#dcfce7', color: r.remarks === 'Fail' ? '#991b1b' : '#166534' }}>
                            {r.remarks}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontFamily: 'sans-serif' }}>
              No academic results recorded yet.
            </div>
          )}
        </div>

        {/* Footer / Signature */}
        <div style={{ padding: '16px 40px 32px', borderTop: '1px solid #e5e7eb', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#6b7280' }}>
              <div>This is an official document of {student.institution_name}.</div>
              <div>Any alteration renders this document invalid.</div>
              <div style={{ marginTop: 4 }}>Generated: {new Date().toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #374151', width: 180, marginBottom: 4 }}></div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 11, fontWeight: 600 }}>Registrar's Signature</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#6b7280' }}>& Official Stamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
