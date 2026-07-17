import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import { FiCheck, FiDownload, FiEye, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';
import ApplyLeaveModal from '../Components/ApplyLeaveModal';
import LeaveViewModal from '../Components/LeaveViewModal';
import { exportToCsv } from '../utils/exportCsv';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const TABS = ['All Requests', 'Pending', 'Approved', 'Rejected'];

const statusStyles = {
  Pending: 'bg-yellow-500/10 text-yellow-400',
  Approved: 'bg-green-500/10 text-green-400',
  Rejected: 'bg-red-500/10 text-red-400',
};

const leaveTypeStyles = {
  'Vacation': 'bg-accent-500/10 text-accent-400',
  'Sick Leave': 'bg-red-500/10 text-red-400',
  'Personal': 'bg-purple-500/10 text-purple-400',
  'Unpaid Leave': 'bg-gray-500/10 text-gray-300',
};

const LeaveManagement = () => {
  const { isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Requests');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/leave`);
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
      showErrorToast('Unable to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const updateStatus = async (leave, status) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leave/${leave._id}`, { ...leave, status });
      showSuccessToast(`Leave ${status.toLowerCase()}`);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to update leave', err);
      showErrorToast('Failed to update leave status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/leave/${id}`);
      showSuccessToast('Leave request deleted');
      fetchLeaves();
    } catch {
      showErrorToast('Failed to delete leave request');
    }
  };

  const filteredLeaves =
    activeTab === 'All Requests' ? leaves : leaves.filter((l) => l.status === activeTab);

  const handleExport = () => {
    const ok = exportToCsv('leave-requests.csv', filteredLeaves, [
      { header: 'Employee', accessor: (r) => r.employeeId?.name || r.employeeName || 'Unknown' },
      { header: 'Leave Type', accessor: 'leaveType' },
      { header: 'Start Date', accessor: (r) => (r.startDate ? new Date(r.startDate).toLocaleDateString() : '') },
      { header: 'End Date', accessor: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString() : '') },
      { header: 'Days', accessor: 'days' },
      { header: 'Status', accessor: 'status' },
      { header: 'Reason', accessor: 'reason' },
    ]);
    if (ok) showSuccessToast('Leave requests exported'); else showErrorToast('Nothing to export');
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Topper />
        <div className="flex flex-wrap justify-between items-center gap-4 mt-5 mb-6">
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 px-4 py-2 rounded-md shadow text-sm"
            >
              <FiDownload size={14} /> Export
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md shadow text-sm"
            >
              <FiPlus size={16} /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="bg-zinc-900 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-accent-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 p-6 rounded-lg shadow overflow-auto">
          <table className="w-full table-auto text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-300 bg-zinc-800">
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Days</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr
                    key={leave._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium">{leave.employeeId?.name || leave.employeeName || 'Unknown'}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leaveTypeStyles[leave.leaveType] || 'bg-zinc-700 text-gray-300'}`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">
                      {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-gray-300">
                      {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-gray-300">{leave.days}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[leave.status] || 'bg-zinc-700 text-gray-300'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {isAdmin && leave.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(leave, 'Approved')}
                              title="Approve"
                              className="text-green-400 hover:text-green-300"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => updateStatus(leave, 'Rejected')}
                              title="Reject"
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }}
                          title="View"
                          className="text-accent-400 hover:text-accent-300"
                        >
                          <FiEye size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(leave._id)}
                            title="Delete"
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-400">No leave requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {showApplyModal && (
          <ApplyLeaveModal
              onClose={() => setShowApplyModal(false)}
              onLeaveAdded={fetchLeaves}
          />
        )}
        {showViewModal && selectedLeave && (
          <LeaveViewModal
            leave={selectedLeave}
            onClose={() => setShowViewModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default LeaveManagement;
