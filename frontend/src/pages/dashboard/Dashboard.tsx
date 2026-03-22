import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  GraduationCap, Users, DollarSign, AlertTriangle, CheckCircle,
  Clock, BookMarked, Calendar, FileText, TrendingUp
} from 'lucide-react';
import api from '../../config/api';
import { useAuthStore } from '../../store/authStore';

const COLORS = ['#1a56db','#0e9f6e','#ff5a1f','#7c3aed','#dc2626','#d97706'];

/* ── Admin / Registrar / Superadmin dashboard ── */
function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return null;

  const stats = [
    { label:'Total Students',      value: data.students?.total || 0,                                             sub:`${data.students?.new_this_month||0} this month`,                   icon:GraduationCap, color:'#1a56db', bg:'#e8f0fe' },
    { label:'Active Staff',         value: data.staff?.active || 0,                                               sub:`of ${data.staff?.total||0} total`,                                 icon:Users,         color:'#0e9f6e', bg:'#d1fae5' },
    { label:'Fees Collected',       value:`KES ${Number(data.payments?.total_collected||0).toLocaleString()}`,    sub:`KES ${Number(data.payments?.this_month||0).toLocaleString()} this month`, icon:DollarSign,  color:'#7c3aed', bg:'#ede9fe' },
    { label:'Fee Defaulters',       value: data.feeDefaulters || 0,                                               sub:'Require follow-up',                                                icon:AlertTriangle,  color:'#dc2626', bg:'#fee2e2' },
    { label:'Attendance Rate',      value:`${data.attendance?.avg_rate||0}%`,                                     sub:'Last 30 days',                                                     icon:CheckCircle,    color:'#d97706', bg:'#fef3c7' },
    { label:'Pending Applications', value: data.pendingApplications || 0,                                         sub:'Awaiting review',                                                  icon:Clock,          color:'#0891b2', bg:'#e0f2fe' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Institution Dashboard</h1><p className="page-subtitle">Overview of all institutional activities</p></div>
      </div>
      <div className="grid-3" style={{ marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.sub}</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Monthly Fee Collections</h3>
          {data.monthlyPayments?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyPayments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:12 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v:any)=>[`KES ${Number(v).toLocaleString()}`,'Amount']} />
                <Bar dataKey="amount" fill="#1a56db" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No payment data yet</p></div>}
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Enrollment by Program</h3>
          {data.enrollmentByProgram?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.enrollmentByProgram} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                  label={(p:any) => p.percent ? `${p.name} ${(p.percent*100).toFixed(0)}%` : ''} fontSize={11}>
                  {data.enrollmentByProgram.map((_:any, i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No enrollment data yet</p></div>}
        </div>
      </div>
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:600 }}>Recent Payments</h3>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/fees/payments')}>View All</button>
        </div>
        {data.recentPayments?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
              <tbody>
                {data.recentPayments.map((p:any) => (
                  <tr key={p.receipt_number}>
                    <td><span className="mono" style={{ fontSize:12 }}>{p.receipt_number}</span></td>
                    <td><div style={{ fontWeight:500 }}>{p.student_name}</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.student_number}</div></td>
                    <td style={{ fontWeight:600, color:'var(--success)' }}>KES {Number(p.amount).toLocaleString()}</td>
                    <td><span className={`badge badge-${p.payment_method==='mpesa'?'success':p.payment_method==='cash'?'info':'warning'}`}>{p.payment_method}</span></td>
                    <td style={{ fontSize:13, color:'var(--text-muted)' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><p>No payments recorded yet</p></div>}
      </div>
    </div>
  );
}

/* ── Finance dashboard ── */
function FinanceDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/fees/payments', { params:{ limit:5 } }),
      api.get('/fees/defaulters', { params:{ academic_year: new Date().getFullYear()+'/'+( new Date().getFullYear()+1), semester:1 } }),
    ]).then(([pRes, dRes]) => {
      setSummary(pRes.data.data.summary);
      setPayments(pRes.data.data.payments || []);
      setDefaulters(dRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const stats = [
    { label:'Total Collected', value:`KES ${Number(summary?.total||0).toLocaleString()}`, sub:`${summary?.transactions||0} transactions`, icon:DollarSign, color:'#1a56db', bg:'#e8f0fe' },
    { label:'M-Pesa',          value:`KES ${Number(summary?.mpesa_total||0).toLocaleString()}`, sub:'via M-Pesa',   icon:TrendingUp, color:'#0e9f6e', bg:'#d1fae5' },
    { label:'Cash',            value:`KES ${Number(summary?.cash_total||0).toLocaleString()}`,  sub:'Cash payments', icon:DollarSign, color:'#d97706', bg:'#fef3c7' },
    { label:'Fee Defaulters',  value: defaulters.length, sub:'Require follow-up',               icon:AlertTriangle, color:'#dc2626', bg:'#fee2e2' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Finance Dashboard</h1><p className="page-subtitle">Fee collections and financial overview</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/fees/payments')}>Record Payment</button>
      </div>
      <div className="grid-4" style={{ marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:20, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.sub}</div>
              </div>
              <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Recent Payments</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/fees/payments')}>View All</button>
          </div>
          {payments.length===0 ? <div className="empty-state"><p>No payments yet</p></div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {payments.map((p:any) => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:14 }}>{p.student_name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.receipt_number} · {p.payment_method?.toUpperCase()}</div>
                  </div>
                  <div style={{ fontWeight:700, color:'var(--success)' }}>KES {Number(p.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Top Defaulters</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/fees/defaulters')}>View All</button>
          </div>
          {defaulters.length===0 ? <div className="empty-state"><p>No defaulters found</p></div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {defaulters.slice(0,5).map((d:any) => (
                <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:14 }}>{d.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{d.student_number}</div>
                  </div>
                  <div style={{ fontWeight:700, color:'var(--danger)' }}>KES {Number(d.balance).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Lecturer dashboard ── */
function LecturerDashboard() {
  const [summary, setSummary] = useState<any[]>([]);
  const [exams, setExams]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get('/attendance/summary'),
      api.get('/exams'),
    ]).then(([aRes, eRes]) => {
      setSummary(aRes.data.data || []);
      setExams(eRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const lowAttendance = summary.filter((s:any) => parseFloat(s.attendance_rate) < 75);
  const upcomingExams = exams.filter((e:any) => e.status === 'scheduled');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.first_name}</h1>
          <p className="page-subtitle">Your teaching overview</p>
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom:24 }}>
        {[
          { label:'Students Tracked',      value: summary.length,      icon:GraduationCap, color:'#1a56db', bg:'#e8f0fe' },
          { label:'Low Attendance (<75%)', value: lowAttendance.length, icon:AlertTriangle,  color:'#dc2626', bg:'#fee2e2' },
          { label:'Exams Scheduled',       value: upcomingExams.length, icon:BookMarked,     color:'#7c3aed', bg:'#ede9fe' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Students Below 75% Attendance</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/attendance')}>Mark Attendance</button>
          </div>
          {lowAttendance.length===0 ? (
            <div className="empty-state"><CheckCircle size={40} /><p>All students above 75% attendance</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Student</th><th>Rate</th></tr></thead>
                <tbody>
                  {lowAttendance.slice(0,8).map((s:any) => (
                    <tr key={s.student_id}>
                      <td><div style={{ fontWeight:500 }}>{s.name}</div><span className="mono" style={{ fontSize:11, color:'var(--text-muted)' }}>{s.student_number}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:60, background:'var(--border)', borderRadius:4, height:6 }}>
                            <div style={{ width:`${s.attendance_rate}%`, background:'var(--danger)', height:'100%', borderRadius:4 }} />
                          </div>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--danger)' }}>{s.attendance_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Upcoming Exams</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/exams')}>View All</button>
          </div>
          {upcomingExams.length===0 ? (
            <div className="empty-state"><BookMarked size={40} /><p>No upcoming exams</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {upcomingExams.slice(0,5).map((e:any) => (
                <div key={e.id} style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:10 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{e.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                    {e.unit_code} · {e.exam_date ? new Date(e.exam_date).toLocaleDateString() : 'Date TBD'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Student dashboard ── */
function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [results, setResults]       = useState<any[]>([]);
  const [payments, setPayments]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attendance'),
      api.get('/exams/results'),
      api.get('/fees/payments', { params:{ limit:5 } }),
    ]).then(([aRes, rRes, pRes]) => {
      setAttendance(aRes.data.data || []);
      setResults(rRes.data.data || []);
      setPayments(pRes.data.data.payments || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const present    = attendance.filter((a:any) => a.status === 'present').length;
  const total      = attendance.length;
  const attRate    = total > 0 ? Math.round((present/total)*100) : 0;
  const totalPaid  = payments.reduce((s:number, p:any) => s + parseFloat(p.amount||0), 0);
  const passed     = results.filter((r:any) => r.remarks !== 'Fail').length;
  const gpa        = results.length > 0
    ? (results.reduce((s:number,r:any) => s + parseFloat(r.grade_points||0),0) / results.length).toFixed(2)
    : '—';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.first_name}!</h1>
          <p className="page-subtitle">Your academic overview</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:'Attendance Rate', value:`${attRate}%`,  sub:`${present}/${total} classes`, icon:Calendar,      color: attRate>=75?'#0e9f6e':'#dc2626', bg: attRate>=75?'#d1fae5':'#fee2e2' },
          { label:'Units Passed',    value:passed,         sub:`of ${results.length} units`,  icon:CheckCircle,    color:'#1a56db', bg:'#e8f0fe' },
          { label:'Current GPA',     value:gpa,            sub:'Cumulative',                   icon:TrendingUp,     color:'#7c3aed', bg:'#ede9fe' },
          { label:'Fees Paid',       value:`KES ${totalPaid.toLocaleString()}`, sub:'Total payments', icon:DollarSign, color:'#0e9f6e', bg:'#d1fae5' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:22, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.sub}</div>
              </div>
              <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance rate bar */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ fontSize:15, fontWeight:600 }}>Attendance Status</h3>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/attendance')}>View Details</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1, background:'var(--border)', borderRadius:8, height:12, overflow:'hidden' }}>
            <div style={{ width:`${attRate}%`, height:'100%', background: attRate>=75?'var(--success)':attRate>=50?'var(--warning)':'var(--danger)', borderRadius:8, transition:'width 0.5s' }} />
          </div>
          <span style={{ fontWeight:700, fontSize:20, color: attRate>=75?'var(--success)':attRate>=50?'var(--warning)':'var(--danger)', minWidth:60 }}>{attRate}%</span>
        </div>
        {attRate < 75 && (
          <div style={{ marginTop:12, padding:'10px 14px', background:'#fee2e2', borderRadius:8, fontSize:13, color:'#991b1b', fontWeight:500 }}>
            ⚠ Your attendance is below 75%. You may be barred from exams if this continues.
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Recent Results</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/results')}>View All</button>
          </div>
          {results.length===0 ? <div className="empty-state"><FileText size={40} /><p>No results yet</p></div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {results.slice(0,5).map((r:any) => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--bg)', borderRadius:10 }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:13 }}>{r.unit_name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.exam_name}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, fontSize:18, color: r.grade==='A'?'#0e9f6e':r.grade==='B'?'#1a56db':r.grade==='E'?'#dc2626':'#d97706' }}>{r.grade}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.total_marks}/100</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontSize:15, fontWeight:600 }}>Payment History</h3>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/fees/payments')}>View All</button>
          </div>
          {payments.length===0 ? <div className="empty-state"><DollarSign size={40} /><p>No payments recorded</p></div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {payments.slice(0,5).map((p:any) => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--bg)', borderRadius:10 }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:13 }}>KES {Number(p.amount).toLocaleString()}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.receipt_number} · {p.payment_method?.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(p.payment_date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <div className="loader loader-dark" style={{ width:40, height:40 }} />
    </div>
  );
}

export default function InstitutionDashboard() {
  const { user } = useAuthStore();
  const role = user?.role;

  if (role === 'student')                           return <StudentDashboard />;
  if (role === 'lecturer')                          return <LecturerDashboard />;
  if (role === 'finance')                           return <FinanceDashboard />;
  return <AdminDashboard />;  // admin, registrar, superadmin
}
