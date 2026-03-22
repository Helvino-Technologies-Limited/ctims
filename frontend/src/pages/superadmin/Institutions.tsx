import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

export default function SuperAdminInstitutions() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/institutions', { params: { page, limit: 20, search } });
      setInstitutions(res.data.data.institutions);
      setTotal(res.data.data.total);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleStatus = async (id: string, current: string) => {
    const status = current === 'active' ? 'suspended' : 'active';
    await api.patch(`/institutions/${id}/status`, { status });
    toast.success(`Institution ${status}`);
    fetch();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Institutions</h1><p className="page-subtitle">{total} registered institutions</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/register')}><Plus size={16} />Add Institution</button>
      </div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-bar"><Search size={15} style={{ color: 'var(--text-muted)' }} /><input placeholder="Search institutions..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Institution</th><th>Type</th><th>County</th><th>Students</th><th>Subscription</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="loader loader-dark" style={{ margin: '0 auto' }} /></td></tr>
              : institutions.map((i: any) => (
                <tr key={i.id}>
                  <td><div style={{ fontWeight: 600 }}>{i.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.email}</div></td>
                  <td>{i.type}</td>
                  <td>{i.county}</td>
                  <td>{i.student_count}</td>
                  <td><span className={`badge badge-${i.subscription_status === 'active' ? 'success' : i.subscription_status === 'trial' ? 'warning' : 'danger'}`}>{i.subscription_status}</span></td>
                  <td><span className={`badge badge-${i.status === 'active' ? 'success' : 'danger'}`}>{i.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(i.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/superadmin/institutions/${i.id}`)}><Eye size={13} /></button>
                      <button className={`btn btn-sm ${i.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(i.id, i.status)} style={{ fontSize: 12 }}>
                        {i.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
