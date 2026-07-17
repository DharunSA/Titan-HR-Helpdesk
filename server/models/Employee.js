import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  id : String,
  name: String,
  position: String,
  department: String,
  status: String,
  date: String,
  birthDate: String,
  email: String,
  phone: String,
  address: String,
  avatar: String,
 
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
