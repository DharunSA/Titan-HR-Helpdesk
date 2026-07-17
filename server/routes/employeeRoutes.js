import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { body } from 'express-validator';
import Employee from '../models/Employee.js';
import User from '../models/Auth.js';
import authMiddleware from '../controllers/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validateFields } from '../middleware/validate.js';
import { deleteFromCloudinary, extractPublicIdFromUrl, isCloudinaryUrl } from '../utils/cloudinaryUtils.js';

const router = express.Router();

const normalizeEmail = (email) => (email || '').trim().toLowerCase();


async function generateNextId() {
  const lastEmployee = await Employee.findOne().sort({ id: -1 }).exec();
  if (!lastEmployee || !lastEmployee.id) return 'EMP001';

  const lastNum = parseInt(lastEmployee.id.replace('EMP', '')) || 0;
  const nextNum = lastNum + 1;
  return `EMP${String(nextNum).padStart(3, '0')}`;
}

// GET logged-in user's own employee profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// GET all employees (Admin only)
router.get('/', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// POST new employee (Admin only - creates User login as well with Mongoose transactions)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
    body('position').trim().notEmpty().withMessage('Position is required'),
    body('department').isIn(['Engineering', 'Marketing', 'Human Resources', 'Finance', 'Sales', 'Operations']).withMessage('Invalid department'),
    body('status').isIn(['Active', 'On Leave', 'Remote']).withMessage('Invalid status'),
    validateFields,
  ],
  async (req, res) => {
    try {
      const { email, name, avatar } = req.body;
      const normalizedEmail = normalizeEmail(email);

      const existingEmp = await Employee.findOne({ email: normalizedEmail });
      if (existingEmp) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'User credentials already exist for this email' });
      }

      // Try running inside Mongoose session transaction (recommended for Atlas)
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const nextId = await generateNextId();
        const newEmployee = new Employee({
          ...req.body,
          email: normalizedEmail,
          avatar: avatar || '',
          id: nextId,
        });
        await newEmployee.save({ session });

        // Automatically create a login account for this employee
        const defaultPassword = 'Employee123!';
        const newUser = new User({
          name,
          email: normalizedEmail,
          password: defaultPassword,
          role: 'employee',
        });
        await newUser.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(newEmployee);
      } catch (txErr) {
        await session.abortTransaction();
        session.endSession();

        // If local dev environment lacks Replica Set support, fall back to standard non-transactional writes
        if (txErr.message.includes('replica set') || txErr.message.includes('transaction')) {
          console.warn('⚠️ Standalone MongoDB detected. Falling back to non-transactional writes.');

          const nextId = await generateNextId();
          const newEmployee = new Employee({
            ...req.body,
            email: normalizedEmail,
            avatar: avatar || '',
            id: nextId,
          });
          await newEmployee.save();

          const defaultPassword = 'Employee123!';
          const newUser = new User({
            name,
            email: normalizedEmail,
            password: defaultPassword,
            role: 'employee',
          });
          await newUser.save();

          return res.status(201).json(newEmployee);
        } else {
          throw txErr;
        }
      }
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error adding employee' });
    }
  }
);

// PUT - update employee by ID (Admin only)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Provide a valid email address').normalizeEmail(),
    body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
    body('department').optional().isIn(['Engineering', 'Marketing', 'Human Resources', 'Finance', 'Sales', 'Operations']).withMessage('Invalid department'),
    body('status').optional().isIn(['Active', 'On Leave', 'Remote']).withMessage('Invalid status'),
    validateFields,
  ],
  async (req, res) => {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Employee ID',
      });
    }

    try {
      const currentEmployee = await Employee.findById(id);
      if (!currentEmployee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      // Handle image cleanup if avatar is being replaced or removed
      if (updatedData.avatar !== undefined) {
        const oldAvatar = currentEmployee.avatar;

        if (updatedData.avatar && oldAvatar && oldAvatar !== updatedData.avatar && isCloudinaryUrl(oldAvatar)) {
          try {
            const publicId = extractPublicIdFromUrl(oldAvatar);
            await deleteFromCloudinary(publicId);
          } catch (error) {
            console.warn('Failed to delete old image from Cloudinary:', error.message);
          }
        }

        if (!updatedData.avatar && oldAvatar && isCloudinaryUrl(oldAvatar)) {
          try {
            const publicId = extractPublicIdFromUrl(oldAvatar);
            await deleteFromCloudinary(publicId);
          } catch (error) {
            console.warn('Failed to delete image from Cloudinary:', error.message);
          }
        }
      } else {
        updatedData.avatar = currentEmployee.avatar || '';
      }

      if (updatedData.email) {
        updatedData.email = normalizeEmail(updatedData.email);
      }

      const updatedEmployee = await Employee.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true,
      });

      // Keep name and email in users collection synchronized if they changed
      if (updatedData.name || updatedData.email) {
        await User.findOneAndUpdate(
          { email: currentEmployee.email },
          {
            name: updatedEmployee.name,
            email: updatedEmployee.email,
          }
        );
      }

      res.status(200).json({
        success: true,
        data: updatedEmployee,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: err.message,
      });
    }
  }
);

// DELETE employee by ID (Admin only - deletes User login credentials as well with Mongoose transactions)
router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Delete image from Cloudinary if exists
    if (employee.avatar && isCloudinaryUrl(employee.avatar)) {
      try {
        const publicId = extractPublicIdFromUrl(employee.avatar);
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error.message);
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Delete credentials first
      await User.findOneAndDelete({ email: employee.email }, { session });

      // Delete employee
      await Employee.findByIdAndDelete(req.params.id, { session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ success: true, message: 'Employee and login credentials deleted successfully' });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();

      if (txErr.message.includes('replica set') || txErr.message.includes('transaction')) {
        console.warn('⚠️ Standalone MongoDB detected. Falling back to non-transactional deletes.');

        await User.findOneAndDelete({ email: employee.email });
        await Employee.findByIdAndDelete(req.params.id);

        return res.status(200).json({ success: true, message: 'Employee and login credentials deleted successfully' });
      } else {
        throw txErr;
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

export default router;
