import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiCalendar, FiDownload, FiEdit, FiTrash2 } from 'react-icons/fi';
import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';
import { exportToCsv } from '../utils/exportCsv';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState('view');
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'Present',
  });

  const [filters, setFilters] = useState({
    name: '',
    status: '',
    from: '',
    to: '',
  });

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
      showErrorToast('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
      showErrorToast('Failed to fetch employees');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this attendance record?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/attendance/${id}`);
      showSuccessToast('Attendance deleted!');
      fetchAttendance();
    } catch (err) {
      console.error('Delete error:', err);
      showErrorToast('Failed to delete attendance');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const checkInTime = new Date(`1970-01-01T${editingRecord.checkIn}`);
      const checkOutTime = new Date(`1970-01-01T${editingRecord.checkOut}`);
      const diff = checkOutTime - checkInTime;
      const workingHours = diff > 0 ? (diff / (1000 * 60 * 60)).toFixed(2) : 0;

      const updatedRecord = {
        ...editingRecord,
        workingHours,
      };

      await axios.put(`${API_BASE_URL}/api/attendance/${editingRecord._id}`, updatedRecord);
      showSuccessToast('Record updated successfully!');
      setIsEditModalOpen(false);
      setEditingRecord(null);
      fetchAttendance();
    } catch (err) {
      console.error('Update error:', err);
      showErrorToast('Failed to update record');
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, 
      [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { employeeId, date, checkIn, checkOut } = formData;

    if ((isAdmin && !employeeId) || !date || !checkIn || !checkOut) {
      return showErrorToast('Please fill all fields');
    }

    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const checkOutTime = new Date(`1970-01-01T${checkOut}`);
    const diff = checkOutTime - checkInTime;
    const workingHours = diff > 0 ? (diff / (1000 * 60 * 60)).toFixed(2) : 0;

    try {
      await axios.post(`${API_BASE_URL}/api/attendance`, { ...formData, workingHours });
      showSuccessToast('Attendance marked successfully!');
      setFormData({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'Present' });
      setTab('view');
      fetchAttendance();
    } catch (err) {
      console.error('Failed to mark attendance', err);
      showErrorToast('Failed to mark attendance');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ name: '', status: '', from: '', to: '' });
  };

  const filteredData = attendanceData.filter((att) => {
    const empName = att.employeeId?.name || att.name || 'Unknown';
    const matchName = filters.name ? empName === filters.name : true;
    const matchStatus = filters.status ? att.status === filters.status : true;
    const recordDate = att.date ? new Date(att.date) : null;
    const matchFrom = filters.from ? recordDate && recordDate >= new Date(filters.from) : true;
    const matchTo = filters.to ? recordDate && recordDate <= new Date(`${filters.to}T23:59:59`) : true;
    return matchName && matchStatus && matchFrom && matchTo;
  });

  const handleExport = () => {
    const ok = exportToCsv('attendance.csv', filteredData, [
      { header: 'Employee', accessor: (r) => r.employeeId?.name || r.name || 'Unknown' },
      { header: 'Date', accessor: (r) => (r.date ? new Date(r.date).toLocaleDateString() : '') },
      { header: 'Check In', accessor: 'checkIn' },
      { header: 'Check Out', accessor: 'checkOut' },
      { header: 'Working Hours', accessor: 'workingHours' },
      { header: 'Status', accessor: 'status' },
    ]);
    if (ok) showSuccessToast('Attendance exported'); else showErrorToast('Nothing to export');
  };

  useEffect(() => {
    fetchAttendance();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [isAdmin]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Topper />
        <header className="flex flex-wrap justify-between items-center gap-4 mt-5 mb-8">
          <h1 className="text-3xl font-bold">Attendance Tracker</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('view')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                tab === 'view'
                  ? 'bg-accent-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
              }`}
            >
              View Attendance
            </button>
            <button
              onClick={() => setTab('mark')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                tab === 'mark'
                  ? 'bg-accent-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
              }`}
            >
              Mark Attendance
            </button>
          </div>
        </header>

        {tab === 'view' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 flex-wrap items-center">
                  <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-md border border-zinc-700">
                    <FiCalendar className="text-accent-400" />
                    <input
                      type="date"
                      name="from"
                      value={filters.from}
                      onChange={handleFilterChange}
                      className="bg-transparent text-sm text-white focus:outline-none"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="date"
                      name="to"
                      value={filters.to}
                      onChange={handleFilterChange}
                      className="bg-transparent text-sm text-white focus:outline-none"
                    />
                  </div>
                  {isAdmin && (
                    <select
                      name="name"
                      value={filters.name}
                      onChange={handleFilterChange}
                      className="bg-zinc-800 text-sm text-white px-4 py-2 rounded-md border border-zinc-700"
                    >
                      <option value="">All Employees</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="bg-zinc-800 text-sm text-white px-4 py-2 rounded-md border border-zinc-700"
                  >
                    <option value="">All Status</option>
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                    <option>Early</option>
                  </select>
                  <button
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white px-4 py-2 rounded-md border border-zinc-700 text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md shadow text-sm transition-colors"
                >
                  <FiDownload size={14} />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg p-6 overflow-auto">
              <table className="w-full table-auto text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-800 text-gray-300">
                    <th className="p-4 text-left">Employee</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Check In</th>
                    <th className="p-4 text-left">Check Out</th>
                    <th className="p-4 text-left">Working Hours</th>
                    <th className="p-4 text-left">Status</th>
                    {isAdmin && <th className="p-4 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((att) => (
                      <tr
                        key={att._id}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="p-4">{att.employeeId?.name || att.name || 'Unknown'}</td>
                        <td className="p-4">{new Date(att.date).toLocaleDateString()}</td>
                        <td className="p-4">{att.checkIn}</td>
                        <td className="p-4">{att.checkOut}</td>
                        <td className="p-4">{att.workingHours} hrs</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              att.status === 'Present'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-4 flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(att)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(att._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-gray-400">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

         {tab === 'mark' && (
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-5 text-center text-accent-400">
              {isAdmin ? "Mark Employee Attendance" : "Mark My Attendance"}
            </h2>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
                <label
                  htmlFor="employeeId"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Employee
                </label>
                {isAdmin ? (
                  <select
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={user?.name || ''}
                    disabled
                    className="w-full bg-zinc-800/50 text-gray-400 px-4 py-2 rounded-md border border-zinc-700 cursor-not-allowed"
                  />
                )}
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkIn"
                    className="block text-sm font-medium text-gray-400 mb-2"
                  >
                    Check In
                  </label>
                  <input
                    type="time"
                    id="checkIn"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="checkOut"
                    className="block text-sm font-medium text-gray-400 mb-2"
                  >
                    Check Out
                  </label>
                  <input
                    type="time"
                    id="checkOut"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleFormChange}
                    className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700"
                >
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                  <option>Early</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-accent-600 hover:bg-accent-700 text-white font-bold py-3 rounded-md"
              >
                Submit Attendance
              </button>
            </form>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-zinc-900 p-6 rounded-lg w-[400px] shadow-md text-white">
              <h3 className="text-xl font-semibold mb-5 text-accent-500">Edit Attendance</h3>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <input
                  type="text"
                  name="name"
                  value={editingRecord.employeeId?.name || editingRecord.name || ''}
                  disabled
                  className="w-full p-2 rounded bg-zinc-800/50 text-gray-400 border border-zinc-700 cursor-not-allowed"
                />
                <input
                  type="date"
                  name="date"
                  value={editingRecord.date?.split('T')[0]}
                  onChange={handleEditChange}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
                />
                <input
                  type="time"
                  name="checkIn"
                  value={editingRecord.checkIn}
                  onChange={handleEditChange}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
                />
                <input
                  type="time"
                  name="checkOut"
                  value={editingRecord.checkOut}
                  onChange={handleEditChange}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
                />
                <select
                  name="status"
                  value={editingRecord.status}
                  onChange={handleEditChange}
                  className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Early">Early</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Attendance;
