import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const LEAVE_TYPES = ['Vacation', 'Sick Leave', 'Personal', 'Unpaid Leave'];

// inclusive day count between two dates
const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = e - s;
  if (diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

const ApplyLeaveModal = ({ onClose, onLeaveAdded }) => {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (isAdmin) {
      const fetchEmployees = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/employees`);
          setEmployees(res.data);
        } catch (err) {
          console.error('Failed to fetch employees', err);
          toast.error('Unable to load employees');
        }
      };
      fetchEmployees();
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const days = calcDays(formData.startDate, formData.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { employeeId, leaveType, startDate, endDate } = formData;
    
    if ((isAdmin && !employeeId) || !leaveType || !startDate || !endDate) {
      return toast.error('Please fill all required fields');
    }
    if (days <= 0) {
      return toast.error('End date must be on or after the start date');
    }
    try {
      await axios.post(`${API_BASE_URL}/api/leave`, { ...formData, days });
      toast.success('Leave request submitted');
      onLeaveAdded();
      onClose();
    } catch (err) {
      console.error('Error applying for leave', err);
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const inputClass =
    'w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-accent-500';
  const labelClass = 'block text-sm font-medium text-gray-400 mb-2';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-5 text-accent-400">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Employee *</label>
            {isAdmin ? (
              <select name="employeeId" value={formData.employeeId} onChange={handleChange} className={inputClass} required>
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="employeeName"
                value={user?.name || ''}
                disabled
                className="w-full bg-zinc-800/50 text-gray-400 px-4 py-2 rounded-md border border-zinc-700 cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Leave Type *</label>
            <select name="leaveType" value={formData.leaveType} onChange={handleChange} className={inputClass}>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Total Days: <span className="font-semibold text-accent-400">{days}</span>
          </div>

          <div>
            <label className={labelClass}>Reason</label>
            <textarea
              name="reason"
              placeholder="Enter reason for leave"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-accent-600 hover:bg-accent-700 rounded-md">Apply for Leave</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
