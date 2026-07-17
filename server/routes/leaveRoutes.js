// routes/leaveRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import authMiddleware from '../controllers/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateFields } from '../middleware/validate.js';
import User from '../models/Auth.js';
import { createNotification } from '../utils/createNotification.js';

const router = express.Router();

// GET all leave requests (newest first)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ email: req.user.email });
      if (!employee) {
        return res.json([]);
      }
      query = { employeeId: employee._id };
    }
    const leaves = await Leave.find(query).populate('employeeId').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new leave request
router.post(
  '/',
  authMiddleware,
  [
    body('leaveType').isIn(['Vacation', 'Sick Leave', 'Personal', 'Unpaid Leave']).withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('days').isInt({ min: 1 }).withMessage('Days must be a positive integer'),
    validateFields,
  ],
  async (req, res) => {
    try {
      const leaveData = { ...req.body };
      let empId = req.body.employeeId;

      if (req.user.role === 'employee') {
        const employee = await Employee.findOne({ email: req.user.email });
        if (!employee) {
          return res.status(404).json({ message: 'Employee profile not found' });
        }
        empId = employee._id;
        leaveData.status = 'Pending'; // Ensure status starts as Pending for employees
      } else if (!empId && req.body.employeeName) {
        // Fallback for admin using employee name from legacy frontend
        const employee = await Employee.findOne({ name: req.body.employeeName });
        if (employee) {
          empId = employee._id;
        }
      }

      if (!empId) {
        return res.status(400).json({ message: 'employeeId is required and must reference a valid employee' });
      }

      leaveData.employeeId = empId;
      const leave = new Leave(leaveData);
      const newLeave = await leave.save();

      const populated = await Leave.findById(newLeave._id).populate('employeeId');

      // Notify all admins if an employee applied for the leave
      if (req.user.role === 'employee') {
        try {
          const admins = await User.find({ role: 'admin' }, '_id');
          const adminIds = admins.map((admin) => admin._id);
          if (adminIds.length > 0) {
            const empName = populated.employeeId?.name || 'An employee';
            await createNotification(
              adminIds,
              `📅 ${empName} requested ${populated.leaveType} leave.`,
              '/leave-management',
              'leave'
            );
          }
        } catch (err) {
          console.error('[Notification] Failed to notify admins about leave:', err);
        }
      }

      res.status(201).json(populated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// PUT update leave request (Admin only - used for approve / reject / edit)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  [
    body('status').optional().isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status'),
    validateFields,
  ],
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Invalid Leave ID' });
    }
    try {
      const previousLeave = await Leave.findById(id);
      const updatedLeave = await Leave.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      }).populate('employeeId');
      if (!updatedLeave) {
        return res.status(404).json({ message: 'Leave request not found' });
      }

      // Fire notification when status changes to Approved or Rejected
      const newStatus = req.body.status;
      if (
        newStatus &&
        ['Approved', 'Rejected'].includes(newStatus) &&
        previousLeave?.status !== newStatus &&
        updatedLeave.employeeId?.email
      ) {
        const empUser = await User.findOne({ email: updatedLeave.employeeId.email });
        if (empUser) {
          const icon = newStatus === 'Approved' ? '✅' : '❌';
          await createNotification(
            empUser._id,
            `${icon} Your ${updatedLeave.leaveType} leave request has been ${newStatus.toLowerCase()}.`,
            '/leave-management',
            'leave'
          );
        }
      }

      res.json(updatedLeave);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// DELETE leave request (Admin only)
router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const deleted = await Leave.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
