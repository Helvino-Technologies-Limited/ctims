import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, CheckCircle, XCircle, UserCheck, Clock, FileText, Calendar } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
const statusColor: any = { pending: 'warning', reviewing: 'info', approved: 'success', rejected: 'danger' };

export default function Admissions() {
  const [tab, setTab] = useState<'applications' | 'intakes'>('applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, reviewing: 0, approved: 0, rejected: 0 });
  const [programs, setPrograms] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes, progsRes] = await Promise.all([
        api.get('/admissions', { params: { status: filterStatus, program_id: filterProgram, search, limit: 50 } }),
        api.get('/admissions/stats'),
        api.get('/academic/programs'),
      ]);
      setApplications(appsRes.data.data.applications);
      setTotal(appsRes.data.data.total);
      setStats(statsRes.data.data);
      setPrograms(progsRes.data.data);
    } finally { setLoading(false); }
  }, [filterStatus, filterProgram, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const review = async (id: string, newStatus: string, rejectionReason?: string) => {
    await api.patch(`/admissions/${id}/review`, { status: newStatus, rejection_reason: rejectionReason });
    toast.success(`Application ${newStatus}`);
    fetchAll();
    setSelected(null);
  };

  const statCards = [
    { label: 'Total', value: stats.total, color: 'var(--primary)', icon: <FileText size={20} /> },
    { label: 'Pending', value: stats.pending, color: 'var(--warning)', icon: <Clock size={20} /> },
    { label: 'Reviewing', value: stats.reviewing, color: '#0891b2', icon: <Eye size={20} /> },
    { label: 'Approved', value: stats.approved, color: 'var(--success)', icon: <CheckCircle size={20} /> },
    { label: 'Rejected', value: stats.rejected, color: 'var(--danger)', icon: <XCircle size={20} /> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admissions</h1>
          <p className="page-subtitle">{tab === 'applications' ? `${total} applications` : 'Manage intake cycles'}</p>
        </div>
        {tab === 'applications'
          ? <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Plus size={16} />New Application</button>
          : null
        }
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} />Applications</span>
        </button>
        <button className={`tab ${tab === 'intakes' ? 'active' : ''}`} onClick={() => setTab('intakes')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} />Intakes</span>
        </button>
      </div>

      {tab === 'intakes' && <IntakesPanel programs={programs} />}

      {tab !== 'applications' ? null : <>{/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="search-bar">
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search by name or app number..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input form-select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="form-input form-select" style={{ width: 180 }} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
            <option value="">All Programs</option>
            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr><th>App No.</th><th>Applicant</th><th>Program</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><FileText size={48} /><p>No applications found.</p></div></td></tr>
              ) : applications.map((a: any) => (
                <tr key={a.id}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{a.application_number}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{a.program_name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${statusColor[a.status] || 'gray'}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" title="View details" onClick={() => setSelected(a)}><Eye size={13} /></button>
                      {a.status === 'pending' && (
                        <button className="btn btn-secondary btn-sm" title="Mark as reviewing"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => review(a.id, 'reviewing')}>Review</button>
                      )}
                      {(a.status === 'pending' || a.status === 'reviewing') && (
                        <>
                          <button className="btn btn-sm" title="Approve"
                            style={{ background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
                            onClick={() => review(a.id, 'approved')}><CheckCircle size={13} /></button>
                          <button className="btn btn-sm" title="Reject"
                            style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
                            onClick={() => setSelected({ ...a, _rejecting: true })}><XCircle size={13} /></button>
                        </>
                      )}
                      {a.status === 'approved' && !a.converted_to_student && (
                        <button className="btn btn-sm" title="Convert to Student"
                          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}
                          onClick={() => setSelected({ ...a, _converting: true })}>
                          <UserCheck size={13} />
                        </button>
                      )}
                      {a.converted_to_student && (
                        <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Enrolled</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && !selected._converting && (
        <ApplicationDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onReview={review}
          onConvert={() => setSelected({ ...selected, _converting: true })}
        />
      )}
      {selected?._converting && (
        <ConvertToStudentModal
          application={selected}
          programs={programs}
          onClose={() => setSelected(null)}
          onConverted={() => { fetchAll(); setSelected(null); }}
        />
      )}
      {showNewModal && (
        <NewApplicationModal
          programs={programs}
          onClose={() => setShowNewModal(false)}
          onSaved={() => { setShowNewModal(false); fetchAll(); }}
        />
      )}
      </>}
    </div>
  );
}

/* ── Intakes Panel ── */
function IntakesPanel({ programs }: any) {
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const fetchIntakes = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/academic/intakes'); setIntakes(r.data.data || []); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIntakes(); }, [fetchIntakes]);

  const statusColor: any = { open: 'success', closed: 'danger', upcoming: 'info' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={16} />Create Intake</button>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Intake Name</th><th>Program</th><th>Start Date</th><th>End Date</th><th>Capacity</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
                : intakes.length === 0
                  ? <tr><td colSpan={8}><div className="empty-state"><Calendar size={48} /><p>No intakes yet. Create your first intake.</p></div></td></tr>
                  : intakes.map((i: any) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 600 }}>{i.name}</td>
                      <td style={{ fontSize: 13 }}>{i.program_name || '—'}</td>
                      <td style={{ fontSize: 13 }}>{i.start_date ? new Date(i.start_date).toLocaleDateString() : '—'}</td>
                      <td style={{ fontSize: 13 }}>{i.end_date ? new Date(i.end_date).toLocaleDateString() : '—'}</td>
                      <td style={{ textAlign: 'center' }}>{i.capacity || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary)' }}>{i.enrolled_count || 0}</td>
                      <td><span className={`badge badge-${statusColor[i.status] || 'gray'}`}>{i.status || 'open'}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(i); setShowModal(true); }}>Edit</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <IntakeModal
          editing={editing}
          programs={programs}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchIntakes(); }}
        />
      )}
    </div>
  );
}

function IntakeModal({ editing, programs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ? { ...editing } : { status: 'open' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) {
        await api.put(`/academic/intakes/${editing.id}`, form);
        toast.success('Intake updated');
      } else {
        await api.post('/academic/intakes', form);
        toast.success('Intake created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>{editing ? 'Edit' : 'Create'} Intake</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Intake Name *</label>
              <input className="form-input" required placeholder="e.g. January 2025 Intake" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select className="form-input form-select" required value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                <option value="">Select program...</option>
                {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={form.start_date?.split('T')[0] || ''} onChange={e => set('start_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={form.end_date?.split('T')[0] || ''} onChange={e => set('end_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input type="number" className="form-input" min={1} placeholder="Max students" value={form.capacity || ''} onChange={e => set('capacity', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input form-select" value={form.status || 'open'} onChange={e => set('status', e.target.value)}>
                  <option value="open">Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="loader" /> : editing ? 'Update Intake' : 'Create Intake'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationDetailModal({ application: a, onClose, onReview, onConvert }: any) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const fields = [
    ['Application No.', a.application_number],
    ['Full Name', `${a.first_name} ${a.last_name}`],
    ['Email', a.email],
    ['Phone', a.phone],
    ['Gender', a.gender],
    ['Date of Birth', a.date_of_birth ? new Date(a.date_of_birth).toLocaleDateString() : 'N/A'],
    ['National ID', a.national_id],
    ['Address', a.address],
    ['Program', a.program_name],
    ['Intake', a.intake_name],
    ['Previous School', a.previous_school],
    ['Qualifications', a.qualifications],
    ['Status', a.status],
    ['Applied On', new Date(a.created_at).toLocaleString()],
  ];
  if (a.rejection_reason) fields.push(['Rejection Reason', a.rejection_reason]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Application Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            {fields.map(([k, v]: any) => (
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 500, wordBreak: 'break-word' }}>{v || '—'}</div>
              </div>
            ))}
          </div>

          {(a.status === 'pending' || a.status === 'reviewing') && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Reviewer Notes</label>
              <textarea className="form-input" rows={3} placeholder="Add notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          )}

          {rejecting && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Rejection Reason *</label>
              <textarea className="form-input" rows={3} placeholder="Explain the rejection reason..." value={reason} onChange={e => setReason(e.target.value)} style={{ resize: 'vertical' }} required />
            </div>
          )}
        </div>
        <div className="modal-footer">
          {a.status === 'approved' && !a.converted_to_student && (
            <button className="btn btn-primary" onClick={onConvert}><UserCheck size={14} />Convert to Student</button>
          )}
          {(a.status === 'pending' || a.status === 'reviewing') && !rejecting && (
            <>
              <button className="btn btn-secondary" onClick={() => setRejecting(true)}>Reject</button>
              <button className="btn btn-success" onClick={() => onReview(a.id, 'approved')}>Approve</button>
            </>
          )}
          {rejecting && (
            <>
              <button className="btn btn-secondary" onClick={() => setRejecting(false)}>Back</button>
              <button className="btn btn-danger" onClick={() => { if (!reason.trim()) { return; } onReview(a.id, 'rejected', reason); }} disabled={!reason.trim()}>Confirm Rejection</button>
            </>
          )}
          {!rejecting && a.status !== 'approved' && <button className="btn btn-secondary" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>
  );
}

function ConvertToStudentModal({ application: a, programs, onClose, onConverted }: any) {
  const [form, setForm] = useState<any>({ program_id: a.program_id || '', intake_id: a.intake_id || '', year_of_study: 1, semester: 1 });
  const [intakes, setIntakes] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.program_id) {
      api.get('/academic/intakes', { params: { program_id: form.program_id } })
        .then(r => setIntakes(r.data.data || []))
        .catch(() => setIntakes([]));
    }
  }, [form.program_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/admissions/${a.id}/convert`, form);
      setResult(res.data.data);
      toast.success('Student registered successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Conversion failed');
    } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 style={{ fontWeight: 600, color: 'var(--success)' }}>Student Registered!</h3></div>
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48 }}>🎓</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>{a.first_name} {a.last_name}</div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>STUDENT NUMBER</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: 1, fontFamily: 'monospace' }}>{result.student_number}</div>
                </div>
                <div style={{ background: '#fef9c3', borderRadius: 10, padding: '14px 20px' }}>
                  <div style={{ fontSize: 12, color: '#854d0e', fontWeight: 600 }}>TEMPORARY PASSWORD</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: '#92400e' }}>{result.temp_password}</div>
                  <div style={{ fontSize: 11, color: '#78350f', marginTop: 4 }}>Share this with the student — they can change it after first login.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-primary" onClick={onConverted}>Done</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>Convert to Student</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>
              <strong>{a.first_name} {a.last_name}</strong> — {a.email}
            </div>
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select className="form-input form-select" required value={form.program_id} onChange={e => set('program_id', e.target.value)}>
                <option value="">Select program...</option>
                {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Intake</label>
              <select className="form-input form-select" value={form.intake_id} onChange={e => set('intake_id', e.target.value)}>
                <option value="">Select intake...</option>
                {intakes.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <input type="number" className="form-input" min={1} max={6} value={form.year_of_study} onChange={e => set('year_of_study', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input type="number" className="form-input" min={1} max={3} value={form.semester} onChange={e => set('semester', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Name</label>
              <input className="form-input" value={form.guardian_name || ''} onChange={e => set('guardian_name', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Guardian Phone</label>
                <input className="form-input" value={form.guardian_phone || ''} onChange={e => set('guardian_phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Relationship</label>
                <input className="form-input" placeholder="e.g. Parent" value={form.guardian_relationship || ''} onChange={e => set('guardian_relationship', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="loader" /> : <><UserCheck size={14} />Register Student</>}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewApplicationModal({ programs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ gender: 'male' });
  const [intakes, setIntakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.program_id) {
      api.get('/academic/intakes', { params: { program_id: form.program_id } })
        .then(r => setIntakes(r.data.data || []))
        .catch(() => setIntakes([]));
    }
  }, [form.program_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admissions', form);
      toast.success('Application created');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 600 }}>New Walk-in Application</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" required value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" required value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" required value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-input form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">National ID</label><input className="form-input" value={form.national_id || ''} onChange={e => set('national_id', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select className="form-input form-select" required value={form.program_id || ''} onChange={e => set('program_id', e.target.value)}>
                    <option value="">Select program...</option>
                    {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Intake</label>
                  <select className="form-input form-select" value={form.intake_id || ''} onChange={e => set('intake_id', e.target.value)}>
                    <option value="">Select intake...</option>
                    {intakes.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Previous School</label><input className="form-input" value={form.previous_school || ''} onChange={e => set('previous_school', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Qualifications / Certificates</label><textarea className="form-input" rows={3} value={form.qualifications || ''} onChange={e => set('qualifications', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="loader" /> : 'Submit Application'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
