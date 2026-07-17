import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiActivity } from 'react-icons/fi';
import { API_BASE_URL } from '../config';

const STATUS_OPTIONS = ['Planning', 'In Progress', 'On Hold', 'Completed'];

const statusColors = {
  'Planning':    'text-purple-400',
  'In Progress': 'text-accent-400',
  'On Hold':     'text-yellow-400',
  'Completed':   'text-green-400',
};

const ProjectProgressModal = ({ project, onClose, onUpdated }) => {
  const [progress, setProgress] = useState(project.progress ?? 0);
  const [status, setStatus]     = useState(project.status || 'In Progress');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/project/${project._id}/progress`, {
        progress,
        status,
      });
      toast.success('Project progress updated!');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-accent-500/10 rounded-lg text-accent-400">
            <FiActivity size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Update Progress</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{project.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Progress slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Progress</label>
              <span className="text-sm font-bold text-accent-400">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-accent-500 cursor-pointer"
            />
            {/* Progress bar preview */}
            <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#22c55e' : undefined,
                  background: progress < 100 ? 'linear-gradient(90deg, #06b6d4, #0891b2)' : undefined,
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-accent-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className={`text-xs mt-1 font-medium ${statusColors[status]}`}>{status}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-accent-600 hover:bg-accent-700 rounded-md font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectProgressModal;
