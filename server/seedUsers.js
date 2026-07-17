// server/seedUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/Auth.js';
import Employee from './models/Employee.js';

dotenv.config();

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // 1. Seed Admin user if not present
    const adminEmail = 'admin@example.com';
    const normalizedAdminEmail = normalizeEmail(adminEmail);
    const adminExists = await User.findOne({ email: normalizedAdminEmail });
    if (!adminExists) {
      console.log('Seeding Admin user...');
      const adminUser = new User({
        name: 'System Admin',
        email: normalizedAdminEmail,
        password: 'Admin123!',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user seeded! (admin@example.com / Admin123!)');
    } else {
      console.log('ℹ️ Admin user already exists.');
      // Ensure role is admin
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        await adminExists.save();
        console.log('✅ Admin user role updated to admin');
      }
    }

    // 2. Seed Employee users for all existing employees in DB
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in DB. Verifying user logins...`);

    for (const emp of employees) {
      if (!emp.email) {
        console.log(`⚠️ Employee ${emp.name} has no email. Skipping...`);
        continue;
      }
      
      const normalizedEmpEmail = normalizeEmail(emp.email);
      const userExists = await User.findOne({ email: normalizedEmpEmail });
      if (!userExists) {
        console.log(`Seeding login for Employee: ${emp.name} (${emp.email})...`);
        const empUser = new User({
          name: emp.name,
          email: normalizedEmpEmail,
          password: 'Employee123!',
          role: 'employee'
        });
        await empUser.save();
        console.log(`✅ Login credentials created for ${emp.name}! (Employee123!)`);
      } else {
        // Make sure its role is employee
        if (userExists.role !== 'employee') {
          userExists.role = 'employee';
          await userExists.save();
          console.log(`✅ Updated ${emp.name}'s role to employee`);
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seed();
