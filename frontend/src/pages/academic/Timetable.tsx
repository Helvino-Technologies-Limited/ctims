import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Calendar } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (programFilter) params.program_id = programFilter;
      const r = await api.get('/academic/timetable', { params });
      setTimetable(r.data.data);
    } finally { setLoading(false); }
  }, [programFilter]);

  useEffect(() => {
    fetch();
    api.get('/academic/programs').then(r => setPrograms(r.data.data));
    api.get('/academic/units').then(r => setUnits(r.data.data));
    api.get('/staff').then(r => setStaffList(r.data.data.staff || []));
  }, [fetch]);

  const byDay = DAYS.reduce((acc: any, day) => {
    acc[day] = timetable.filter(t => t.day_of_week === day);
    return acc;
  }, {});

  const colors = ['#e8f0fe', '#d1fae5', '#fef3c7', '#ede9fe', '#fee2e2', '#e0f2fe'];
  const textColors = ['#1a56db', '#0e9f6e', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">{timetable.length} scheduled classes</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 8, padding: 3, gap: 2 }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: view === v ? 'var(--surface)' : 'transparent', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, boxShadow: view === v ? 'var(--shadow)' : 'none' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />Add Class</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="form-input form-select" style={{ width: 220 }} value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
          <option value="">All Programs</option>
          {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></div>
      ) : view === 'grid' ? (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${DAYS.length}, 1fr)`, gap: 12, minWidth: 900 }}>
            {DAYS.map((day, di) => (
              <div key={day}>
                <div style={{ padding: '8px 12px', background: 'var(--primary)', color: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {byDay[day].length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, background: 'var(--bg)', borderRadius: 8 }}>No classes</div>
                  ) : byDay[day].map((t: any, i: number) => (
                    <div key={t.id} style={{ background: colors[i % colors.length], borderRadius: 8, padding: '10px 12px', border: `1px solid ${textColors[i % textColors.length]}30` }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: textColors[i % textColors.length] }}>{t.unit_code}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{t.unit_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t.start_time?.slice(0,5)} – {t.end_time?.slice(0,5)}</div>
                      {t.lecturer_name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.lecturer_name}</div>}
                      {t.room && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Room: {t.room}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Day</th><th>Time</th><th>Unit</th><th>Program</th><th>Lecturer</th><th>Room</th></tr></thead>
              <tbody>
                {timetable.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><Calendar size={48} /><p>No timetable entries yet.</p></div></td></tr>
                ) : timetable.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.day_of_week}</td>
                    <td style={{ fontSize: 13 }}>{t.start_time?.slice(0,5)} – {t.end_time?.slice(0,5)}</td>
                    <td><div style={{ fontWeight: 500 }}>{t.unit_name}</div><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.unit_code}</span></td>
                    <td style={{ fontSize: 13 }}>{t.program_name}</td>
                    <td style={{ fontSize: 13 }}>{t.lecturer_name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{t.room || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <TimetableModal
          units={units}
          staffList={staffList}
          programs={programs}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetch(); }}
        />
      )}
    </div>
  );
}

function TimetableModal({ units, staffList, programs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ day_of_week: 'Monday' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/academic/timetable', form);
      toast.success('Class added to timetable');
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Schedule Class</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select className="form-input form-select" required value={form.unit_id || ''} onChange={e => set('unit_id', e.target.value)}>
                  <option value="">Select unit...</option>
                  {units.map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program</label>
                <select className="form-input form-select" value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                  <option value="">Select program...</option>
                  {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lecturer</label>
                <select className="form-input form-select" value={form.lecturer_id || ''} onChange={e => set('lecturer_id', e.target.value)}>
                  <option value="">Select lecturer...</option>
                  {staffList.map((s: any) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Day *</label>
                <select className="form-input form-select" required value={form.day_of_week} onChange={e => set('day_of_week', e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-input" required value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input type="time" className="form-input" required value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Room / Venue</label>
                <input className="form-input" value={form.room || ''} onChange={e => set('room', e.target.value)} placeholder="e.g. Room 101" />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-input" value={form.academic_year || ''} onChange={e => set('academic_year', e.target.value)} placeholder="2024/2025" />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-input form-select" value={form.semester || ''} onChange={e => set('semester', parseInt(e.target.value))}>
                  <option value="">Select...</option>
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loader" /> : 'Add to Timetable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
