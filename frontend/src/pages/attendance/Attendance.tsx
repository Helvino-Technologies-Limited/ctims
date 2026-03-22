import React, { useEffect, useState } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [units, setUnits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any>({});
  const [summary, setSummary] = useState<any[]>([]);
  const [tab, setTab] = useState('mark');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/academic/units').then(r => setUnits(r.data.data)); }, []);

  useEffect(() => {
    if (selectedUnit && date) {
      api.get('/attendance/students', { params: { unit_id: selectedUnit, date } }).then(r => {
        setStudents(r.data.data);
        const initial: any = {};
        r.data.data.forEach((s: any) => { initial[s.student_id] = s.today_status || 'present'; });
        setRecords(initial);
      });
    }
  }, [selectedUnit, date]);

  useEffect(() => { api.get('/attendance/summary').then(r => setSummary(r.data.data)); }, []);

  const submitAttendance = async () => {
    if (!selectedUnit) { toast.error('Select a unit'); return; }
    setLoading(true);
    try {
      const attendance_records = Object.entries(records).map(([student_id, status]) => ({ student_id, status }));
      await api.post('/attendance', { unit_id: selectedUnit, date, attendance_records });
      toast.success('Attendance marked successfully');
    } finally { setLoading(false); }
  };

  const statusColor: any = { present:'#0e9f6e', absent:'#dc2626', late:'#d97706', excused:'#7c3aed' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Attendance</h1><p className="page-subtitle">Mark and track student attendance</p></div>
      </div>
      <div className="tabs">
        {['mark','summary'].map(t => (
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)} style={{ textTransform:'capitalize' }}>
            {t === 'mark' ? 'Mark Attendance' : 'Attendance Summary'}
          </button>
        ))}
      </div>
      {tab === 'mark' && (
        <div className="card">
          <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <div className="form-group" style={{ flex:1, minWidth:200 }}>
              <label className="form-label">Select Unit</label>
              <select className="form-input form-select" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                <option value="">Choose unit...</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          {students.length > 0 && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:14, color:'var(--text-muted)' }}>{students.length} students</div>
                <div style={{ display:'flex', gap:8 }}>
                  {['present','absent','late'].map(s => (
                    <button key={s} className="btn btn-secondary btn-sm" onClick={() => {
                      const all: any = {};
                      students.forEach((st: any) => { all[st.student_id] = s; });
                      setRecords(all);
                    }}>Mark All {s.charAt(0).toUpperCase()+s.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Student No.</th><th>Name</th><th>Status</th></tr></thead>
                  <tbody>
                    {students.map((s: any) => (
                      <tr key={s.student_id}>
                        <td><span className="mono" style={{ fontSize:12 }}>{s.student_number}</span></td>
                        <td style={{ fontWeight:500 }}>{s.name}</td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            {['present','absent','late','excused'].map(status => (
                              <button key={status} onClick={() => setRecords((r: any) => ({ ...r, [s.student_id]: status }))}
                                style={{ padding:'5px 12px', borderRadius:20, border:`2px solid ${records[s.student_id]===status ? statusColor[status] : 'var(--border)'}`, background: records[s.student_id]===status ? statusColor[status] : 'transparent', color: records[s.student_id]===status ? '#fff' : 'var(--text-secondary)', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s' }}>
                                {status.charAt(0).toUpperCase()+status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
                <button className="btn btn-primary" onClick={submitAttendance} disabled={loading}>
                  {loading ? <span className="loader" /> : 'Save Attendance'}
                </button>
              </div>
            </>
          )}
          {!selectedUnit && <div className="empty-state"><p>Select a unit and date to mark attendance</p></div>}
        </div>
      )}
      {tab === 'summary' && (
        <div className="card">
          <h3 style={{ fontWeight:600, marginBottom:16 }}>Attendance Summary</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Student No.</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Rate</th></tr></thead>
              <tbody>
                {summary.map((s: any) => (
                  <tr key={s.student_id}>
                    <td><span className="mono" style={{ fontSize:12 }}>{s.student_number}</span></td>
                    <td style={{ fontWeight:500 }}>{s.name}</td>
                    <td style={{ color:'var(--success)' }}>{s.present}</td>
                    <td style={{ color:'var(--danger)' }}>{s.absent}</td>
                    <td style={{ color:'var(--warning)' }}>{s.late}</td>
                    <td>{s.total_classes}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, background:'var(--border)', borderRadius:4, height:6, overflow:'hidden' }}>
                          <div style={{ width:`${s.attendance_rate}%`, background: s.attendance_rate>=75?'var(--success)':s.attendance_rate>=50?'var(--warning)':'var(--danger)', height:'100%' }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color: s.attendance_rate>=75?'var(--success)':'var(--danger)', minWidth:36 }}>{s.attendance_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
