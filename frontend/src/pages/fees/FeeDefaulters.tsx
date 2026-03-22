import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import api from '../../config/api';

export default function FeeDefaulters() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [academic_year, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');

  const fetch = useCallback(async () => {
    if (!academic_year || !semester) return;
    setLoading(true);
    try {
      const r = await api.get('/fees/defaulters', { params: { academic_year, semester } });
      setDefaulters(r.data.data);
    } finally { setLoading(false); }
  }, [academic_year, semester]);

  useEffect(() => { fetch(); }, [fetch]);

  const total = defaulters.reduce((sum, d) => sum + parseFloat(d.balance || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Defaulters</h1>
          <p className="page-subtitle">Students with outstanding fee balances</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <input className="form-input" placeholder="e.g. 2024/2025" value={academic_year} onChange={e => setAcademicYear(e.target.value)} style={{ width: 180 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Semester</label>
            <select className="form-input form-select" value={semester} onChange={e => setSemester(e.target.value)} style={{ width: 150 }}>
              <option value="">Select...</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetch} style={{ marginBottom: 2 }}>Search</button>
        </div>
      </div>

      {defaulters.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Defaulters</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{defaulters.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Outstanding</div>
            <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 22 }}>KES {total.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="card">
        {!academic_year || !semester ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <p>Select academic year and semester to view fee defaulters.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>
        ) : defaulters.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <p>No fee defaulters found for this period.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Program</th><th>Fee Due</th><th>Paid</th><th>Balance</th><th>Phone</th></tr>
              </thead>
              <tbody>
                {defaulters.map((d: any, i: number) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.student_number}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{d.program_name}</td>
                    <td style={{ fontWeight: 500 }}>KES {Number(d.fee_due || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 500 }}>KES {Number(d.paid || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 15 }}>KES {Number(d.balance || 0).toLocaleString()}</div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((d.paid / d.fee_due) * 100, 100)}%`, background: 'var(--success)', height: '100%' }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                        {d.phone || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
