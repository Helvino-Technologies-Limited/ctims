import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../config/api';

export default function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/institutions/dashboard').then(r => setData(r.data.data));
    api.get('/institutions', { params: { limit: 10 } }).then(r => setInstitutions(r.data.data.institutions));
  }, []);

  const stats = data ? [
    { label: 'Total Institutions', value: data.institutions?.total || 0, icon: Building2, color: '#1a56db', bg: '#e8f0fe' },
    { label: 'Active', value: data.institutions?.active || 0, icon: TrendingUp, color: '#0e9f6e', bg: '#d1fae5' },
    { label: 'Total Students', value: data.students?.total || 0, icon: GraduationCap, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Total Staff', value: data.staff?.total || 0, icon: Users, color: '#d97706', bg: '#fef3c7' },
    { label: 'Suspended', value: data.institutions?.suspended || 0, icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Total Revenue', value: `KES ${Number(data.revenue?.total || 0).toLocaleString()}`, icon: DollarSign, color: '#0891b2', bg: '#e0f2fe' },
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Super Admin Dashboard</h1><p className="page-subtitle">Helvino Technologies — Platform Overview</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/superadmin/institutions')}>Manage Institutions</button>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600 }}>Recent Institutions</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/superadmin/institutions')}>View All</button>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Institution</th><th>Type</th><th>Students</th><th>Staff</th><th>Subscription</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {institutions.map((i: any) => (
                <tr key={i.id}>
                  <td><div style={{ fontWeight: 600 }}>{i.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.email}</div></td>
                  <td><span className="badge badge-info">{i.type}</span></td>
                  <td>{i.student_count}</td><td>{i.admin_count}</td>
                  <td><span className={`badge badge-${i.subscription_status === 'active' ? 'success' : i.subscription_status === 'trial' ? 'warning' : 'danger'}`}>{i.subscription_status}</span></td>
                  <td><span className={`badge badge-${i.status === 'active' ? 'success' : 'danger'}`}>{i.status}</span></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => navigate(`/superadmin/institutions/${i.id}`)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
