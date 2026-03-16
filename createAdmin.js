const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/servixo';
    console.log('Connecting to MongoDB with URI:', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'nikhilmalviya402@gmail.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      mongoose.connection.close();
      return;
    }
    
    const adminData = {
      name: "Nikhil Malviya",
      email: "nikhilmalviya402@gmail.com",
      password: "Nikhil@8154338973",
      role: "admin",
      isVerified: true
    };
    
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    adminData.password = hashedPassword;
    
    const admin = await User.create(adminData);
    console.log('Admin account created successfully:');
    console.log('Email: nikhilmalviya402@gmail.com');
    console.log('Password: Nikhil@8154338973');
    console.log('User ID:', admin._id);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.connection.close();
  }
}

createAdmin();
