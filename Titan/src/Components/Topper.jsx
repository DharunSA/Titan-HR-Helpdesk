import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiUser, FiSearch, FiLogOut, FiSettings, FiFolder, FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

import { API_BASE_URL } from '../config';

const API = `${API_BASE_URL}/api`;

const Topper = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);

  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const { user, logout, isAdmin } = useAuth();

  // Fetch project/leave/employee data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchPromises = [
          axios.get(`${API}/project`),
        ];
        if (isAdmin) {
          fetchPromises.push(axios.get(`${API}/leave`));
          fetchPromises.push(axios.get(`${API}/employees`));
        }
        const results = await Promise.all(fetchPromises);
        setProjects(results[0].data || []);
        if (isAdmin) {
          setLeaves(results[1]?.data || []);
          setEmployees(results[2]?.data || []);
        }
      } catch {
        // fail silently
      }
    };
    fetchData();
  }, [isAdmin]);

  // Fetch personal DB notifications (both roles)
  const fetchDbNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`);
      setDbNotifications(res.data || []);
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    fetchDbNotifications();
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // search results across employees + projects
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const empMatches = employees
      .filter((e) => e.name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((e) => ({ type: 'employee', id: e._id, label: e.name, sub: e.position || e.department || 'Employee' }));
    const projMatches = projects
      .filter((p) => p.name?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({ type: 'project', id: p._id, label: p.name, sub: p.status || 'Project' }));
    return [...empMatches, ...projMatches];
  }, [query, employees, projects]);

  // notifications: pending leaves (admin only) + deadlines in next 7 days
  const derivedNotifications = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    const pendingLeaves = isAdmin
      ? leaves
          .filter((l) => l.status === 'Pending')
          .map((l) => ({
            id: `leave-${l._id}`,
            text: `${l.employeeId?.name || l.employeeName || 'Someone'} requested ${l.leaveType}`,
            to: '/leave-management',
            color: 'bg-yellow-500',
            read: false,
            isDb: false,
          }))
      : [];

    const dueSoon = projects
      .filter((p) => p.status !== 'Completed' && p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= weekAhead)
      .map((p) => ({
        id: `proj-${p._id}`,
        text: `"${p.name}" is due ${new Date(p.deadline).toLocaleDateString()}`,
        to: '/project-management',
        color: 'bg-red-500',
        read: false,
        isDb: false,
      }));

    return [...pendingLeaves, ...dueSoon];
  }, [leaves, projects, isAdmin]);

  // Personal DB notifications (leave status + project assignments)
  const personalNotifications = useMemo(() =>
    dbNotifications.map((n) => ({
      id: n._id,
      text: n.message,
      to: n.link || '/',
      color: n.type === 'leave' ? 'bg-yellow-500' : n.type === 'project' ? 'bg-accent-500' : 'bg-zinc-500',
      read: n.read,
      isDb: true,
    }))
  , [dbNotifications]);

  // Admin sees derived + personal DB; employee sees only personal DB
  const notifications = useMemo(() => [
    ...personalNotifications,
    ...derivedNotifications,
  ], [personalNotifications, derivedNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const goTo = (item) => {
    setShowResults(false);
    setQuery('');
    navigate(item.type === 'employee' ? '/employees' : '/project-management');
  };

  const handleNotifClick = async (n) => {
    setShowNotif(false);
    // Mark DB notifications as read
    if (n.isDb && !n.read) {
      try {
        await axios.put(`${API}/notifications/${n.id}/read`);
        setDbNotifications((prev) =>
          prev.map((x) => (x._id === n.id ? { ...x, read: true } : x))
        );
      } catch { /* silent */ }
    }
    navigate(n.to);
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`);
      setDbNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch { /* silent */ }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex justify-between items-center gap-4">
      {/* Search */}
      <div ref={searchRef} className="relative w-1/2">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search employees, projects..."
          className="p-2 pl-10 pr-4 w-full rounded border border-gray-600 bg-zinc-700 text-white placeholder:text-gray-300 focus:outline-none focus:border-accent-500"
        />
        {showResults && query.trim() && (
          <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-md shadow-lg max-h-72 overflow-y-auto">
            {results.length > 0 ? (
              results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => goTo(r)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800"
                >
                  {r.type === 'employee' ? <FiUsers className="text-accent-400" /> : <FiFolder className="text-purple-400" />}
                  <div>
                    <p className="text-sm text-white">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.sub}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400">No results found</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-white">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotif((s) => !s); setShowUser(false); }} className="relative">
            <FiBell className="text-xl hover:text-accent-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 z-50 mt-3 w-80 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-800 border-b border-zinc-800/60 last:border-0 transition-colors ${n.read ? 'opacity-60' : ''}`}
                    >
                      <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${n.read ? 'text-gray-400' : 'text-gray-200'}`}>{n.text}</span>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-2 shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-gray-400">You're all caught up 🎉</p>
                )}
              </div>
            </div>
          )}
        </div>


        {/* User menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => { setShowUser((s) => !s); setShowNotif(false); }}>
            <FiUser className="text-xl hover:text-accent-400" />
          </button>
          {showUser && (
            <div className="absolute right-0 z-50 mt-3 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-sm font-semibold">{user?.email ? user.email.split('@')[0] : 'Guest'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'Not signed in'}</p>
              </div>
              <button onClick={() => { setShowUser(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-zinc-800">
                <FiSettings /> Settings
              </button>
              <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800">
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topper;
