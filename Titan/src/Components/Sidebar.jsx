import React from 'react';
import logo1 from '../assets/logo.png';
import { FaCalendarCheck } from 'react-icons/fa';
import { FiSettings, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  MdOutlineDashboard,
  MdOutlinePeople,
  MdOutlineAssignment,
  MdOutlineBusinessCenter
} from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCompany } from '../context/CompanyContext';

const Sidebar = () => {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useTheme();
  const { company } = useCompany();
  const logoSrc = company.logo || logo1;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <MdOutlineDashboard size={20} /> },
    ...(isAdmin ? [{ to: '/employees', label: 'Employees', icon: <MdOutlinePeople size={20} /> }] : []),
    { to: '/attendance', label: 'Attendance', icon: <FaCalendarCheck size={18} /> },
    { to: '/leave-management', label: 'Leave Management', icon: <MdOutlineAssignment size={20} /> },
    { to: '/project-management', label: 'Projects', icon: <MdOutlineBusinessCenter size={20} /> },
    { to: '/settings', label: 'Settings', icon: <FiSettings size={18} /> },
  ];

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-60'
      } shrink-0 bg-zinc-900 shadow-lg p-4 flex flex-col transition-all duration-300`}
    >
      <div className="relative flex items-center justify-center mb-8 min-h-[3.5rem]">
        {!sidebarCollapsed && (
          <img
            src={logoSrc}
            alt="Logo"
            className="h-14 max-h-14 w-auto max-w-[140px] object-contain mx-auto"
            style={{ imageOrientation: 'from-image' }}
          />
        )}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          className={`p-2 rounded-md text-gray-400 hover:text-accent-400 hover:bg-zinc-800 transition-colors ${
            sidebarCollapsed ? '' : 'absolute right-0 top-0'
          }`}
        >
          {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              title={sidebarCollapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-accent-600/15 text-accent-400 font-semibold'
                  : 'text-gray-300 hover:text-accent-400 hover:bg-zinc-800'
              }`}
            >
              <span className="shrink-0">{link.icon}</span>
              {!sidebarCollapsed && <span className="text-sm">{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
