import express from 'express';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import User from '../models/Auth.js';
import authMiddleware from '../controllers/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { createNotification } from '../utils/createNotification.js';

const router = express.Router();

/** Resolve the logged-in user's Employee document from their email. */
const getEmployee = (email) => Employee.findOne({ email });

// ─── GET all projects ────────────────────────────────────────────────────────
// Admin → all projects
// Employee → only projects where they are a team member OR the project head
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      const employee = await getEmployee(req.user.email);
      if (!employee) return res.json([]);
      query = {
        $or: [
          { teamMembers: employee._id },
          { projectHead: employee._id },
        ],
      };
    }
    const projects = await Project.find(query)
      .populate('teamMembers')
      .populate('projectHead');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST create project (Admin only) ────────────────────────────────────────
// If a projectHead is supplied and not already in teamMembers, auto-add them.
router.post('/', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const data = { ...req.body };

    // Auto-add head to team members
    if (data.projectHead) {
      const members = data.teamMembers || [];
      const headId = data.projectHead.toString();
      if (!members.map(String).includes(headId)) {
        data.teamMembers = [...members, data.projectHead];
      }
    }

    const project = new Project(data);
    const newProject = await project.save();
    const populated = await Project.findById(newProject._id)
      .populate('teamMembers')
      .populate('projectHead');

    // Notify all team members about the new project assignment
    const teamEmails = (populated.teamMembers || []).map((m) => m.email).filter(Boolean);
    if (teamEmails.length > 0) {
      const users = await User.find({ email: { $in: teamEmails } }, '_id email');
      const headUserId = populated.projectHead
        ? (await User.findOne({ email: populated.projectHead.email }, '_id'))?._id
        : null;

      for (const u of users) {
        const isHead = headUserId && u._id.equals(headUserId);
        await createNotification(
          u._id,
          isHead
            ? `📌 You have been appointed as Project Head of "${populated.name}".`
            : `📌 You have been added to the project "${populated.name}".`,
          '/project-management',
          'project'
        );
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT full update (Admin) OR progress/status update (Project Head) ─────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'admin') {
      // Admin can update everything
      const data = { ...req.body };
      const previousProject = await Project.findById(req.params.id);

      // If head changed, auto-add to team members
      if (data.projectHead) {
        const members = (data.teamMembers || project.teamMembers.map(String));
        const headId = data.projectHead.toString();
        if (!members.map(String).includes(headId)) {
          data.teamMembers = [...members, data.projectHead];
        }
      }

      const updated = await Project.findByIdAndUpdate(req.params.id, data, { new: true })
        .populate('teamMembers')
        .populate('projectHead');

      // Notify newly added team members
      const prevMemberIds = (previousProject.teamMembers || []).map(String);
      const newMembers = (updated.teamMembers || []).filter(
        (m) => !prevMemberIds.includes(m._id.toString())
      );
      if (newMembers.length > 0) {
        const newEmails = newMembers.map((m) => m.email).filter(Boolean);
        const users = await User.find({ email: { $in: newEmails } }, '_id email');
        const headUser = updated.projectHead
          ? await User.findOne({ email: updated.projectHead.email }, '_id')
          : null;
        for (const u of users) {
          const isHead = headUser && u._id.equals(headUser._id);
          await createNotification(
            u._id,
            isHead
              ? `📌 You have been appointed as Project Head of "${updated.name}".`
              : `📌 You have been added to the project "${updated.name}".`,
            '/project-management',
            'project'
          );
        }
      }

      // Notify if project head was changed to a new person
      const prevHeadId = previousProject.projectHead?.toString();
      const newHeadId = updated.projectHead?._id?.toString();
      if (newHeadId && newHeadId !== prevHeadId) {
        const headUser = await User.findOne({ email: updated.projectHead.email }, '_id');
        if (headUser && !newMembers.find((m) => m._id.toString() === newHeadId)) {
          await createNotification(
            headUser._id,
            `📌 You have been appointed as Project Head of "${updated.name}".`,
            '/project-management',
            'project'
          );
        }
      }

      return res.json(updated);
    }

    // Employee — only allowed if they are the project head
    const employee = await getEmployee(req.user.email);
    if (!employee) return res.status(403).json({ message: 'Forbidden' });

    const isHead = project.projectHead && project.projectHead.equals(employee._id);
    if (!isHead) {
      return res.status(403).json({ message: 'Only the project head can update this project.' });
    }

    // Head can only touch progress and status
    const { progress, status } = req.body;
    const update = {};
    if (progress !== undefined) update.progress = Number(progress);
    if (status !== undefined) update.status = status;

    const updated = await Project.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('teamMembers')
      .populate('projectHead');

    // Notify all admins about progress updates by Project Head
    try {
      const admins = await User.find({ role: 'admin' }, '_id');
      const adminIds = admins.map((admin) => admin._id);
      if (adminIds.length > 0) {
        await createNotification(
          adminIds,
          `📈 ${employee.name} updated progress of "${updated.name}" to ${updated.progress}% (${updated.status}).`,
          '/project-management',
          'project'
        );
      }
    } catch (err) {
      console.error('[Notification] Failed to notify admins about project update:', err);
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PATCH progress only (Project Head shortcut) ──────────────────────────────
router.patch('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Admin or project head
    if (req.user.role !== 'admin') {
      const employee = await getEmployee(req.user.email);
      if (!employee) return res.status(403).json({ message: 'Forbidden' });
      if (!project.projectHead || !project.projectHead.equals(employee._id)) {
        return res.status(403).json({ message: 'Only the project head can update progress.' });
      }
    }

    const { progress, status } = req.body;
    const update = {};
    if (progress !== undefined) update.progress = Number(progress);
    if (status !== undefined) update.status = status;

    const updated = await Project.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('teamMembers')
      .populate('projectHead');

    // Notify admins if updated by an employee (Project Head)
    if (req.user.role !== 'admin') {
      try {
        const employee = await getEmployee(req.user.email);
        const admins = await User.find({ role: 'admin' }, '_id');
        const adminIds = admins.map((admin) => admin._id);
        if (adminIds.length > 0 && employee) {
          await createNotification(
            adminIds,
            `📈 ${employee.name} updated progress of "${updated.name}" to ${updated.progress}% (${updated.status}).`,
            '/project-management',
            'project'
          );
        }
      } catch (err) {
        console.error('[Notification] Failed to notify admins about project progress patch:', err);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE project (Admin only) ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Project' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
