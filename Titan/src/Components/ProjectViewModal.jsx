import React from 'react';
import { FiBookmark, FiCalendar, FiClock, FiX } from 'react-icons/fi';

const statusStyles = {
  'Planning': 'bg-purple-500/10 text-purple-400',
  'In Progress': 'bg-accent-500/10 text-accent-400',
  'On Hold': 'bg-yellow-500/10 text-yellow-400',
  'Completed': 'bg-green-500/10 text-green-400',
};

const ProjectViewModal = ({ project, onClose }) => {
  const members = project.teamMembers || [];
  const progress = project.progress ?? 0;
  const barColor = project.status === 'Completed' ? 'bg-green-500' : 'bg-accent-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-6 rounded-xl shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Project Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Project info card */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-5">
            <h3 className="text-xl font-bold mb-4">{project.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <FiBookmark className="text-accent-400" />
                <span className="text-gray-400">Client:</span> {project.client}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FiCalendar className="text-accent-400" />
                <span className="text-gray-400">Start Date:</span>{' '}
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FiClock className="text-accent-400" />
                <span className="text-gray-400">Deadline:</span>{' '}
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[project.status] || 'bg-zinc-700 text-gray-300'}`}>
                  {project.status}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Progress:</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${progress}%` }} />
              </div>
            </div>

            {project.description && (
              <p className="mt-5 text-sm text-gray-400 leading-relaxed">{project.description}</p>
            )}
          </div>

          {/* Team members card */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Team Members</h3>
              <span className="bg-zinc-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {members.length > 0 ? (
                members.map((m) => (
                  <div key={m._id || m} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-sm font-semibold">
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-200">{m.name || 'Unknown'}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No team members assigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewModal;
