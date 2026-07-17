import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

const STATUS_OPTIONS = ['Planning', 'In Progress', 'On Hold', 'Completed'];

// teamMembers may arrive populated (objects) or as plain ids
const normalizeMemberIds = (members = []) =>
  members.map((m) => (typeof m === 'string' ? m : m._id));

const ProjectEditModal = ({ project, onClose, onProjectUpdated }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: project.name || '',
    client: project.client || '',
    startDate: project.startDate ? project.startDate.split('T')[0] : '',
    deadline: project.deadline ? project.deadline.split('T')[0] : '',
    status: project.status || 'Planning',
    progress: project.progress ?? 0,
    description: project.description || '',
    projectHead: project.projectHead?._id || project.projectHead || '',
    teamMembers: normalizeMemberIds(project.teamMembers),
  });

  useEffect(() => {
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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMember = (id) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(id)
        ? prev.teamMembers.filter((m) => m !== id)
        : [...prev.teamMembers, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/project/${project._id}`, {
        ...formData,
        progress: Number(formData.progress),
      });
      toast.success('Project updated successfully');
      onProjectUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating project', err);
      toast.error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const inputClass =
    'w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-accent-500';
  const labelClass = 'block text-sm font-medium text-gray-400 mb-2';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-5 text-accent-400">Edit Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Client *</label>
              <input name="client" value={formData.client} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Deadline *</label>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-400">Progress</label>
                <span className="text-sm font-semibold text-accent-400">{formData.progress}%</span>
              </div>
              <input
                type="range"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
                className="w-full accent-accent-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Team Members *</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-md p-3 max-h-44 overflow-y-auto space-y-2">
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <label key={emp._id} className="flex items-center gap-3 text-sm text-gray-200 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.teamMembers.includes(emp._id)}
                      onChange={() => toggleMember(emp._id)}
                      className="accent-accent-500 w-4 h-4"
                    />
                    {emp.name} {emp.position ? `- ${emp.position}` : ''}
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No employees available</p>
              )}
            </div>
          </div>

          {/* Project Head */}
          <div>
            <label className={labelClass}>Project Head</label>
            <select
              name="projectHead"
              value={formData.projectHead}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">— None —</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}{emp.position ? ` — ${emp.position}` : ''}
                </option>
              ))}
            </select>
            {formData.projectHead && (
              <p className="text-xs text-accent-400 mt-1">
                ★ Project head will be auto-added to the team and can update progress.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Project Description</label>
            <textarea
              name="description"
              placeholder="Enter project description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectEditModal;
