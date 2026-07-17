import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import { showErrorToast } from '../utils/toastUtils';
import { useAuth } from '../context/AuthContext';

import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

import { HiOutlineUsers } from 'react-icons/hi';
import { TbClockCheck } from 'react-icons/tb';
import { LiaUmbrellaBeachSolid } from 'react-icons/lia';
import { CgFolder } from 'react-icons/cg';

const COLORS = ['#0088FE', '#FF8042', '#A28EFF', '#00C49F', '#FFBB28', '#FF6666', '#22D3EE', '#F472B6'];

import { API_BASE_URL } from '../config';

const API = `${API_BASE_URL}/api`;

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const fetchPromises = [
          axios.get(`${API}/attendance`),
          axios.get(`${API}/project`),
          axios.get(`${API}/leave`),
        ];
        if (isAdmin) {
          fetchPromises.push(axios.get(`${API}/employees`));
        }

        const results = await Promise.all(fetchPromises);
        setAttendance(results[0].data || []);
        setProjects(results[1].data || []);
        setLeaves(results[2].data || []);
        if (isAdmin && results[3]) {
          setEmployees(results[3].data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        showErrorToast('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  // ---- Derived metrics ----
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    if (isAdmin) {
      const totalEmployees = employees.length;

      const presentToday = attendance.filter(
        (a) => a.date && new Date(a.date).toDateString() === todayStr && a.status === 'Present'
      ).length;

      const attendanceRate = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0;

      const onLeave = leaves.filter(
        (l) =>
          l.status === 'Approved' &&
          new Date(l.startDate) <= endOfDay(now) &&
          new Date(l.endDate) >= startOfDay(now)
      ).length;

      const leavePct = totalEmployees ? Math.round((onLeave / totalEmployees) * 100) : 0;

      const activeProjects = projects.filter((p) => p.status !== 'Completed').length;

      const weekAhead = new Date(now);
      weekAhead.setDate(now.getDate() + 7);
      const dueThisWeek = projects.filter(
        (p) =>
          p.status !== 'Completed' &&
          p.deadline &&
          new Date(p.deadline) >= startOfDay(now) &&
          new Date(p.deadline) <= endOfDay(weekAhead)
      ).length;

      const newThisMonth = employees.filter((e) => {
        const d = e.date ? new Date(e.date) : null;
        return d && !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      return { totalEmployees, presentToday, attendanceRate, onLeave, leavePct, activeProjects, dueThisWeek, newThisMonth };
    } else {
      // For employee stats
      const totalWorkingHours = attendance.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0).toFixed(1);
      const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Early').length;
      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      const activeProjects = projects.filter(p => p.status !== 'Completed').length;

      return { totalWorkingHours, presentDays, pendingLeaves, activeProjects };
    }
  }, [employees, attendance, projects, leaves, isAdmin]);

  // Weekly attendance activity (last 7 days)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days.map((d) => {
      const dayRecords = attendance.filter((a) => a.date && new Date(a.date).toDateString() === d.toDateString());
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        checkins: dayRecords.filter((a) => a.checkIn).length,
        checkouts: dayRecords.filter((a) => a.checkOut).length,
      };
    });
  }, [attendance]);

  // Department distribution or Project status distribution
  const deptData = useMemo(() => {
    const map = {};
    if (isAdmin) {
      employees.forEach((e) => {
        const dep = e.department || 'Unassigned';
        map[dep] = (map[dep] || 0) + 1;
      });
    } else {
      projects.forEach((p) => {
        const status = p.status || 'Planning';
        map[status] = (map[status] || 0) + 1;
      });
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [employees, projects, isAdmin]);

  // Recently joined or My Recent Leaves
  const recentlyJoined = useMemo(() => {
    if (isAdmin) {
      return [...employees]
        .sort((a, b) => {
          const da = a.date ? new Date(a.date) : 0;
          const db = b.date ? new Date(b.date) : 0;
          return db - da;
        })
        .slice(0, 4);
    } else {
      return [...leaves]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);
    }
  }, [employees, leaves, isAdmin]);

  // Upcoming project deadlines (not completed, due today or later, soonest first)
  const upcomingDeadlines = useMemo(() => {
    const now = startOfDay(new Date());
    return projects
      .filter((p) => p.status !== 'Completed' && p.deadline && new Date(p.deadline) >= now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);
  }, [projects]);

  const deadlineColor = (date) => {
    const days = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    if (days <= 3) return 'bg-red-500';
    if (days <= 7) return 'bg-yellow-500';
    return 'bg-accent-500';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        <Topper />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 p-4 rounded shadow">
            <HiOutlineUsers className="text-xl text-blue-600" />
            <p className="text-gray-400">{isAdmin ? 'Total Employees' : 'Total Working Hours'}</p>
            <h2 className="text-2xl font-bold">
              {loading ? '—' : (isAdmin ? stats.totalEmployees : `${stats.totalWorkingHours} hrs`)}
            </h2>
            <span className="text-sm text-green-400">
              {isAdmin 
                ? (stats.newThisMonth > 0 ? `+${stats.newThisMonth} this month` : `${deptData.length} departments`)
                : 'Accumulated hours'}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded shadow">
            <TbClockCheck className="text-xl text-green-600" />
            <p className="text-gray-400">{isAdmin ? 'Present Today' : 'Days Present'}</p>
            <h2 className="text-2xl font-bold">
              {loading ? '—' : (isAdmin ? stats.presentToday : stats.presentDays)}
            </h2>
            <span className="text-sm text-gray-300">
              {isAdmin ? `${stats.attendanceRate}% attendance rate` : 'Attendance logs'}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded shadow">
            <LiaUmbrellaBeachSolid className="text-xl text-yellow-500" />
            <p className="text-gray-400">{isAdmin ? 'On Leave' : 'Pending Leaves'}</p>
            <h2 className="text-2xl font-bold">
              {loading ? '—' : (isAdmin ? stats.onLeave : stats.pendingLeaves)}
            </h2>
            <span className="text-sm text-gray-300">
              {isAdmin ? `${stats.leavePct}% of workforce` : 'Awaiting approval'}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded shadow">
            <CgFolder className="text-xl text-purple-600" />
            <p className="text-gray-400">{isAdmin ? 'Active Projects' : 'Assigned Projects'}</p>
            <h2 className="text-2xl font-bold">{loading ? '—' : stats.activeProjects}</h2>
            <span className="text-sm text-orange-400">
              {isAdmin ? `${stats.dueThisWeek} due this week` : 'Projects in progress'}
            </span>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-4 rounded shadow text-white">
            <h3 className="font-semibold mb-2">{isAdmin ? 'Weekly Activity' : 'My Weekly Activity'}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#ccc" />
                <YAxis stroke="#ccc" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="checkins" stroke="#00D8FF" name="Check-ins" />
                <Line type="monotone" dataKey="checkouts" stroke="#FF7842" name="Check-outs" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-900 p-4 rounded shadow text-white">
            <h3 className="font-semibold mb-2">{isAdmin ? 'Department Distribution' : 'Project Status Distribution'}</h3>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                  <Legend wrapperStyle={{ color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
                {loading ? 'Loading...' : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* Recently Joined and Upcoming Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent List */}
          <div className="bg-zinc-900 p-4 rounded shadow text-white">
            <h3 className="font-semibold mb-4 underline">
              {isAdmin ? 'Recently Joined Employees' : 'My Recent Leaves'}
            </h3>
            <ul className="space-y-3">
              {recentlyJoined.length > 0 ? (
                recentlyJoined.map((item) => (
                  <li key={item._id}>
                    <p className="font-medium">{isAdmin ? item.name : item.leaveType}</p>
                    <p className="text-gray-400 text-sm">
                      {isAdmin 
                        ? (item.position || '—') + (item.department ? ` - ${item.department}` : '')
                        : `${item.days} days · Status: ${item.status}`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {isAdmin
                        ? (item.date && `Joined: ${new Date(item.date).toLocaleDateString()}`)
                        : `Applied: ${new Date(item.createdAt).toLocaleDateString()}`}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">
                  {loading ? 'Loading...' : (isAdmin ? 'No employees yet' : 'No leave requests yet')}
                </li>
              )}
            </ul>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-zinc-900 p-4 rounded shadow text-white">
            <h3 className="font-semibold mb-4 underline">Upcoming Deadlines</h3>
            <ul className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((p) => (
                  <li key={p._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-gray-400 text-sm">
                        {p.client ? `${p.client} · ` : ''}{new Date(p.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${deadlineColor(p.deadline)}`}></span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm">{loading ? 'Loading...' : 'No upcoming deadlines'}</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
