import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign } from 'lucide-react';
import api from '../../config/api';

const METHOD_COLORS = ['#1a56db','#0e9f6e','#7c3aed'];

export default function FinancialReports() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
      const r = await api.get('/reports/financial', { params });
      setData(r.data.data);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Fee collection analysis and trends</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input type="date" className="form-input" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)} style={{ width: 160 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Date To</label>
            <input type="date" className="form-input" value={dateTo}
              onChange={e => setDateTo(e.target.value)} style={{ width: 160 }} />
          </div>
          <button className="btn btn-primary" onClick={doFetch} style={{ marginBottom: 2 }}>
            Generate
          </button>
          <button className="btn btn-secondary" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ marginBottom: 2 }}>
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 80 }}>
          <div className="loader loader-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : data && (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label">Total Collected</div>
                  <div className="stat-value" style={{ color: 'var(--primary)' }}>
                    KES {Number(data.summary?.total || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {data.summary?.transactions} transactions
                  </div>
                </div>
                <div style={{ width: 48, height: 48, background: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={22} color="var(--primary)" />
                </div>
              </div>
            </div>
            {(data.byMethod || []).map((m: any, i: number) => (
              <div key={m.payment_method} className="stat-card">
                <div className="stat-label">{m.payment_method?.toUpperCase()}</div>
                <div className="stat-value" style={{ color: METHOD_COLORS[i % METHOD_COLORS.length], fontSize: 22 }}>
                  KES {Number(m.total || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.count} payments</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Daily Collection Trend</h3>
              {data.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={[...(data.trend || [])].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }}
                      tickFormatter={d => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Amount']}
                      labelFormatter={l => new Date(l).toLocaleDateString()} />
                    <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No trend data</p></div>}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Collections by Method</h3>
              {data.byMethod?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.byMethod}
                      dataKey="total"
                      nameKey="payment_method"
                      cx="50%" cy="50%"
                      outerRadius={90}
                      label={(props: any) => {
                        const pct = props.percent as number | undefined;
                        if (!pct) return '';
                        return `${props.name} ${(pct * 100).toFixed(0)}%`;
                      }}
                    >
                      {(data.byMethod || []).map((_: any, i: number) => (
                        <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `KES ${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No data</p></div>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Collections by Program</h3>
            {data.byProgram?.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Program</th><th>Students</th><th>Total</th><th>Contribution</th></tr>
                  </thead>
                  <tbody>
                    {data.byProgram.map((p: any) => {
                      const pct = data.summary?.total > 0
                        ? ((p.total / data.summary.total) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr key={p.program}>
                          <td style={{ fontWeight: 500 }}>{p.program}</td>
                          <td style={{ textAlign: 'center' }}>{p.students}</td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                            KES {Number(p.total).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%' }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 38 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <div className="empty-state"><p>No program data</p></div>}
          </div>
        </>
      )}
    </div>
  );
}
