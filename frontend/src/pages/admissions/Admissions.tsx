import React, { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function Admissions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admissions', { params: { status, search, limit: 30 } });
      setApplications(res.data.data.applications);
      setTotal(res.data.data.total);
    } finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const review = async (id: string, newStatus: string) => {
    await api.patch(`/admissions/${id}/review`, { status: newStatus });
    toast.success(`Application ${newStatus}`);
    fetch();
    setSelected(null);
  };

  const statusColor: any = { pending: 'warning', reviewing: 'info', approved: 'success', rejected: 'danger' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Admissions</h1><p className="page-subtitle">{total} applications</p></div>
      </div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-bar"><Search size={15} style={{ color: 'var(--text-muted)' }} /><input placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-input form-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>App No.</th><th>Applicant</th><th>Program</th><th>Intake</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
              : applications.map((a: any) => (
                <tr key={a.id}>
                  <td><span className="mono" style={{ fontSize: 12 }}>{a.application_number}</span></td>
                  <td><div style={{ fontWeight: 500 }}>{a.first_name} {a.last_name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div></td>
                  <td style={{ fontSize: 13 }}>{a.program_name}</td>
                  <td style={{ fontSize: 13 }}>{a.intake_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${statusColor[a.status]}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(a)}><Eye size={13} /></button>
                      {a.status === 'pending' && <>
                        <button className="btn btn-success btn-sm" onClick={() => review(a.id, 'approved')} style={{ padding: '5px 10px' }}><CheckCircle size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => review(a.id, 'rejected')} style={{ padding: '5px 10px' }}><XCircle size={13} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 style={{ fontWeight: 600 }}>Application Details</h3><button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button></div>
            <div className="modal-body">
              {[['Name', `${selected.first_name} ${selected.last_name}`],['Email', selected.email],['Phone', selected.phone],['Gender', selected.gender],['DOB', selected.date_of_birth ? new Date(selected.date_of_birth).toLocaleDateString() : 'N/A'],['National ID', selected.national_id],['Program', selected.program_name],['Intake', selected.intake_name],['Previous School', selected.previous_school],['Qualifications', selected.qualifications],['Status', selected.status]].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span><span style={{ fontWeight: 500 }}>{v || 'N/A'}</span>
                </div>
              ))}
            </div>
            {selected.status === 'pending' && (
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={() => review(selected.id, 'rejected')}>Reject</button>
                <button className="btn btn-success" onClick={() => review(selected.id, 'approved')}>Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
