import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, GraduationCap, BookOpen, Calendar,
  DollarSign, ClipboardCheck, FileText, Megaphone, BarChart3,
  Settings, LogOut, ChevronDown, ChevronRight,
  Building2, UserCheck, BookMarked, Shield, Menu, X,
  MoreHorizontal, Bell, Library
} from 'lucide-react';

const superAdminNav = [
  { to: '/superadmin',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/institutions',  icon: Building2,       label: 'Institutions' },
  { to: '/reports/audit',            icon: Shield,          label: 'Audit Logs' },
];

const adminNav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students',     icon: GraduationCap,   label: 'Students' },
  { to: '/staff',        icon: UserCheck,       label: 'Staff & HR' },
  { label: 'Academic', icon: BookOpen, children: [
    { to: '/academic/departments', label: 'Departments' },
    { to: '/academic/programs',    label: 'Programs' },
    { to: '/academic/units',       label: 'Units' },
    { to: '/academic/timetable',   label: 'Timetable' },
  ]},
  { to: '/admissions',   icon: ClipboardCheck,  label: 'Admissions' },
  { label: 'Fees & Finance', icon: DollarSign, children: [
    { to: '/fees/structures', label: 'Fee Structures' },
    { to: '/fees/payments',   label: 'Payments' },
    { to: '/fees/defaulters', label: 'Defaulters' },
  ]},
  { to: '/attendance',   icon: Calendar,        label: 'Attendance' },
  { to: '/exams',        icon: BookMarked,      label: 'Exams' },
  { to: '/results',      icon: FileText,        label: 'Results' },
  { to: '/materials',    icon: Library,         label: 'Learning Materials' },
  { to: '/communications', icon: Megaphone,     label: 'Communications' },
  { label: 'Reports', icon: BarChart3, children: [
    { to: '/reports/financial', label: 'Financial' },
    { to: '/reports/audit',     label: 'Audit Logs' },
  ]},
  { label: 'Settings', icon: Settings, children: [
    { to: '/settings',       label: 'Institution' },
    { to: '/settings/users', label: 'Users' },
  ]},
];

const registrarNav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students',     icon: GraduationCap,   label: 'Students' },
  { label: 'Academic', icon: BookOpen, children: [
    { to: '/academic/departments', label: 'Departments' },
    { to: '/academic/programs',    label: 'Programs' },
    { to: '/academic/units',       label: 'Units' },
    { to: '/academic/timetable',   label: 'Timetable' },
  ]},
  { to: '/admissions',   icon: ClipboardCheck,  label: 'Admissions' },
  { to: '/attendance',   icon: Calendar,        label: 'Attendance' },
  { to: '/exams',        icon: BookMarked,      label: 'Exams' },
  { to: '/results',      icon: FileText,        label: 'Results' },
  { to: '/materials',    icon: Library,         label: 'Learning Materials' },
  { to: '/communications', icon: Megaphone,     label: 'Communications' },
  { to: '/reports/audit', icon: Shield,         label: 'Audit Logs' },
];

const financeNav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { label: 'Fees & Finance', icon: DollarSign, children: [
    { to: '/fees/structures', label: 'Fee Structures' },
    { to: '/fees/payments',   label: 'Payments' },
    { to: '/fees/defaulters', label: 'Defaulters' },
  ]},
  { to: '/reports/financial', icon: BarChart3,  label: 'Financial Reports' },
  { to: '/communications',    icon: Megaphone,  label: 'Communications' },
];

const lecturerNav = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance',     icon: Calendar,        label: 'Attendance' },
  { to: '/exams',          icon: BookMarked,      label: 'Exams' },
  { to: '/results',        icon: FileText,        label: 'Results' },
  { to: '/materials',      icon: Library,         label: 'Learning Materials' },
  { to: '/communications', icon: Megaphone,       label: 'Communications' },
];

const studentNav = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/exams',          icon: BookMarked,      label: 'My Exams' },
  { to: '/results',        icon: FileText,        label: 'My Results' },
  { to: '/materials',      icon: Library,         label: 'Learning Materials' },
  { to: '/attendance',     icon: Calendar,        label: 'My Attendance' },
  { to: '/fees/payments',  icon: DollarSign,      label: 'My Fees' },
  { to: '/communications', icon: Megaphone,       label: 'Announcements' },
];

function getNav(role: string) {
  switch (role) {
    case 'superadmin': return superAdminNav;
    case 'admin':      return adminNav;
    case 'registrar':  return registrarNav;
    case 'finance':    return financeNav;
    case 'lecturer':   return lecturerNav;
    case 'student':    return studentNav;
    default:           return adminNav;
  }
}

function getMobileTabs(role: string) {
  switch (role) {
    case 'superadmin': return [
      { to: '/superadmin',              icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/superadmin/institutions', icon: Building2,       label: 'Institutions' },
      { to: '/reports/audit',           icon: Shield,          label: 'Audit' },
    ];
    case 'finance': return [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Home' },
      { to: '/fees/payments',  icon: DollarSign,      label: 'Payments' },
      { to: '/fees/defaulters',icon: BarChart3,       label: 'Defaulters' },
    ];
    case 'lecturer': return [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Home' },
      { to: '/attendance',     icon: Calendar,        label: 'Attendance' },
      { to: '/materials',      icon: Library,         label: 'Materials' },
      { to: '/exams',          icon: BookMarked,      label: 'Exams' },
    ];
    case 'student': return [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Home' },
      { to: '/exams',          icon: BookMarked,      label: 'Exams' },
      { to: '/materials',      icon: Library,         label: 'Materials' },
      { to: '/results',        icon: FileText,        label: 'Results' },
    ];
    default: return [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Home' },
      { to: '/students',       icon: GraduationCap,   label: 'Students' },
      { to: '/fees/payments',  icon: DollarSign,      label: 'Fees' },
      { to: '/attendance',     icon: Calendar,        label: 'Attendance' },
    ];
  }
}

function NavItem({ item, collapsed }: { item: any; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isChildActive = item.children?.some((c: any) => location.pathname.startsWith(c.to));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px' : '10px 14px', borderRadius: 8, background: isChildActive ? 'var(--primary-light)' : 'none', border: 'none', cursor: 'pointer', color: isChildActive ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14, fontFamily: 'inherit', fontWeight: isChildActive ? 600 : 500, justifyContent: collapsed ? 'center' : 'space-between', transition: 'all 0.15s' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <item.icon size={18} />
            {!collapsed && item.label}
          </span>
          {!collapsed && (open || isChildActive ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>
        {(open || isChildActive) && !collapsed && (
          <div style={{ paddingLeft: 28, marginTop: 2 }}>
            {item.children.map((child: any) => (
              <NavLink
                key={child.to}
                to={child.to}
                style={({ isActive }) => ({ display: 'block', padding: '7px 14px', borderRadius: 6, fontSize: 13, color: isActive ? 'var(--primary)' : 'var(--text-muted)', background: isActive ? 'var(--primary-light)' : 'transparent', fontWeight: isActive ? 600 : 400, textDecoration: 'none', marginBottom: 1, transition: 'all 0.15s' })}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard' || item.to === '/superadmin'}
      title={collapsed ? item.label : undefined}
      style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px' : '10px 14px', borderRadius: 8, textDecoration: 'none', color: isActive ? 'var(--primary)' : 'var(--text-secondary)', background: isActive ? 'var(--primary-light)' : 'transparent', fontWeight: isActive ? 600 : 500, fontSize: 14, transition: 'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' })}
    >
      <item.icon size={18} />
      {!collapsed && item.label}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = getNav(user?.role || 'admin');
  const mobileTabs = getMobileTabs(user?.role || 'admin');

  const handleLogout = () => { logout(); navigate('/login'); };


  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,var(--primary),#0e9f6e)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap' }}>CTIMS</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Helvino Tech</div>
          </div>
        )}
        {!onNavClick && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        {onNavClick && (
          <button onClick={onNavClick} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6 }}>
            <X size={20} />
          </button>
        )}
      </div>

      {user?.role !== 'superadmin' && (
        <div style={{ padding: '10px 14px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{user?.institution_type || 'Institution'}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.institution_name}</div>
        </div>
      )}
      {user?.role === 'superadmin' && (
        <div style={{ padding: '10px 14px', background: '#fef3c7', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>SUPER ADMINISTRATOR</div>
          <div style={{ fontSize: 12, color: '#78350f' }}>Helvino Technologies</div>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map((item, i) => (
            <div key={i} onClick={onNavClick}>
              <NavItem item={item} collapsed={collapsed && !onNavClick} />
            </div>
          ))}
        </div>
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#0e9f6e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? 10 : '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 14, fontFamily: 'inherit', fontWeight: 500, justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Desktop sidebar ── */}
      <aside className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}`}>
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      <div className={`mobile-drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />

      {/* ── Mobile drawer ── */}
      <div className={`mobile-drawer${drawerOpen ? ' open' : ''}`}>
        <SidebarContent onNavClick={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main content area ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Desktop top header */}
        <header className="dashboard-header-desktop" style={{ height: 60, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/communications')}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={16} color="var(--text-secondary)" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#0e9f6e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.first_name}</span>
            </button>
          </div>
        </header>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8, color: 'var(--text)' }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,var(--primary),#0e9f6e)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>CTIMS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/communications')}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={16} color="var(--text-secondary)" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#0e9f6e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="dashboard-main-content fade-in" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom tab bar (Facebook-style) ── */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {mobileTabs.map(tab => {
            const isActive = location.pathname === tab.to || (tab.to !== '/dashboard' && tab.to !== '/superadmin' && location.pathname.startsWith(tab.to));
            return (
              <button
                key={tab.to}
                className={`mob-tab${isActive ? ' active' : ''}`}
                onClick={() => navigate(tab.to)}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            className={`mob-tab${drawerOpen ? ' active' : ''}`}
            onClick={() => setDrawerOpen(true)}
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span>More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
