import React from 'react';
import { FiCalendar, FiClock, FiUser, FiX } from 'react-icons/fi';

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

const LeaveViewModal = ({ leave, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-6 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Leave Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <FiUser className="text-accent-400" />
            <span className="text-gray-400">Employee:</span> {leave.employeeName}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Leave Type:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leaveTypeStyles[leave.leaveType] || 'bg-zinc-700 text-gray-300'}`}>
              {leave.leaveType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiCalendar className="text-accent-400" />
            <span className="text-gray-400">Start Date:</span>{' '}
            {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '—'}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiClock className="text-accent-400" />
            <span className="text-gray-400">End Date:</span>{' '}
            {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '—'}
          </div>
          <div className="text-gray-300">
            <span className="text-gray-400">Days:</span> {leave.days}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[leave.status] || 'bg-zinc-700 text-gray-300'}`}>
              {leave.status}
            </span>
          </div>
          {leave.reason && (
            <div>
              <p className="text-gray-400 mb-1">Reason:</p>
              <p className="text-gray-300 leading-relaxed bg-zinc-800/60 border border-zinc-700 rounded-md p-3">{leave.reason}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Close</button>
        </div>
      </div>
    </div>
  );
};

export default LeaveViewModal;
