// routes/attendanceRoutes.js
import express from 'express';
import { body } from 'express-validator';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import authMiddleware from '../controllers/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateFields } from '../middleware/validate.js';

const router = express.Router();

// Get all records
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
    const records = await Attendance.find(query).populate('employeeId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch records', error: err.message });
  }
});

// Add new attendance
router.post(
  '/',
  authMiddleware,
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('checkIn').trim().notEmpty().withMessage('Check in time is required'),
    body('checkOut').trim().notEmpty().withMessage('Check out time is required'),
    body('status').isIn(['Present', 'Absent', 'Late', 'Early']).withMessage('Invalid attendance status'),
    validateFields,
  ],
  async (req, res) => {
    try {
      const attendanceData = { ...req.body };
      let empId = req.body.employeeId;

      if (req.user.role === 'employee') {
        const employee = await Employee.findOne({ email: req.user.email });
        if (!employee) {
          return res.status(404).json({ message: 'Employee profile not found' });
        }
        empId = employee._id;
      } else if (!empId && req.body.name) {
        // Fallback for admin using employee name from legacy frontend
        const employee = await Employee.findOne({ name: req.body.name });
        if (employee) {
          empId = employee._id;
        }
      }

      if (!empId) {
        return res.status(400).json({ message: 'employeeId is required and must reference a valid employee' });
      }

      attendanceData.employeeId = empId;
      const attendance = new Attendance(attendanceData);
      await attendance.save();

      const populated = await Attendance.findById(attendance._id).populate('employeeId');
      res.status(201).json(populated);
    } catch (err) {
      res.status(400).json({ message: 'Failed to add attendance', error: err.message });
    }
  }
);

// Update record (Admin only)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  [
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('checkIn').optional().trim().notEmpty().withMessage('Check in time is required'),
    body('checkOut').optional().trim().notEmpty().withMessage('Check out time is required'),
    body('status').optional().isIn(['Present', 'Absent', 'Late', 'Early']).withMessage('Invalid attendance status'),
    validateFields,
  ],
  async (req, res) => {
    try {
      const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employeeId');
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  }
);

// Delete record (Admin only)
router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

export default router;
