import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterInstitution from './pages/RegisterInstitution';
import ApplyOnline from './pages/ApplyOnline';
import DashboardLayout from './layouts/DashboardLayout';

import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminInstitutions from './pages/superadmin/Institutions';
import SuperAdminInstitutionDetail from './pages/superadmin/InstitutionDetail';

import InstitutionDashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentDetail from './pages/students/StudentDetail';
import Staff from './pages/staff/Staff';
import Departments from './pages/academic/Departments';
import Programs from './pages/academic/Programs';
import Units from './pages/academic/Units';
import Timetable from './pages/academic/Timetable';
import Admissions from './pages/admissions/Admissions';
import FeeStructures from './pages/fees/FeeStructures';
import Payments from './pages/fees/Payments';
import FeeDefaulters from './pages/fees/FeeDefaulters';
import Attendance from './pages/attendance/Attendance';
import Exams from './pages/exams/Exams';
import Results from './pages/exams/Results';
import Announcements from './pages/communications/Announcements';
import FinancialReports from './pages/reports/FinancialReports';
import AuditLogs from './pages/reports/AuditLogs';
import Settings from './pages/settings/Settings';
import Users from './pages/settings/Users';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  const { loadUser, token } = useAuthStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (token) loadUser(); }, [token]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontFamily: 'DM Sans', fontSize: 14 } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterInstitution />} />
        <Route path="/apply/:institution_id" element={<ApplyOnline />} />

        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="superadmin" element={<PrivateRoute roles={['superadmin']}><SuperAdminDashboard /></PrivateRoute>} />
          <Route path="superadmin/institutions" element={<PrivateRoute roles={['superadmin']}><SuperAdminInstitutions /></PrivateRoute>} />
          <Route path="superadmin/institutions/:id" element={<PrivateRoute roles={['superadmin']}><SuperAdminInstitutionDetail /></PrivateRoute>} />

          <Route path="dashboard" element={<InstitutionDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="staff" element={<Staff />} />
          <Route path="academic/departments" element={<Departments />} />
          <Route path="academic/programs" element={<Programs />} />
          <Route path="academic/units" element={<Units />} />
          <Route path="academic/timetable" element={<Timetable />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="fees/structures" element={<FeeStructures />} />
          <Route path="fees/payments" element={<Payments />} />
          <Route path="fees/defaulters" element={<FeeDefaulters />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="exams" element={<Exams />} />
          <Route path="results" element={<Results />} />
          <Route path="communications" element={<Announcements />} />
          <Route path="reports/financial" element={<FinancialReports />} />
          <Route path="reports/audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
