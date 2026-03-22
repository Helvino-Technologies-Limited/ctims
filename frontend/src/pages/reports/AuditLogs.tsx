import React, { useEffect, useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import api from '../../config/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/reports/audit', { params:{ page, limit:50 } }); setLogs(r.data.data); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { doFetch(); }, [doFetch]);

  const actionColor = (action: string) => {
    if (action.toLowerCase().includes('create')||action.toLowerCase().includes('add')) return 'success';
    if (action.toLowerCase().includes('delete')||action.toLowerCase().includes('remove')) return 'danger';
    if (action.toLowerCase().includes('update')||action.toLowerCase().includes('edit')) return 'warning';
    return 'info';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">Complete activity trail</p></div>
      </div>
      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:60 }}><div className="loader loader-dark" style={{ margin:'0 auto' }} /></div>
        ) : logs.length===0 ? (
          <div className="empty-state"><Shield size={48} /><p>No audit logs found.</p></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Institution</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td><div style={{ fontWeight:500, fontSize:13 }}>{log.user_name}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{log.email}</div></td>
                      <td><span className="badge badge-info">{log.role}</span></td>
                      <td style={{ fontSize:13 }}>{log.institution_name||'System'}</td>
                      <td><span className={`badge badge-${actionColor(log.action)}`}>{log.action}</span></td>
                      <td style={{ fontSize:12 }}>{log.entity_type||'—'}</td>
                      <td><span className="mono" style={{ fontSize:11 }}>{log.ip_address||'—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              {page>1 && <button className="page-btn" onClick={()=>setPage(p=>p-1)}>←</button>}
              <button className="page-btn active">{page}</button>
              {logs.length===50 && <button className="page-btn" onClick={()=>setPage(p=>p+1)}>→</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
