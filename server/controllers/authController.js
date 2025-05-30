const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signup = async (req, res) => {
  const { name, email, password, role, specialization, age, gender } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    
    const userFields = { 
      name, 
      email, 
      password: hashed, 
      role,
      age: role === 'patient' ? age : undefined,
      gender: role === 'patient' ? gender : undefined
    };
    
    // Add specialization if role is doctor
    if (role === 'doctor' && specialization) {
      userFields.specialization = specialization;
    }

    const user = await User.create(userFields);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        specialization: user.specialization,
        age: user.age,
        gender: user.gender
      } 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      // Log validation errors for debugging
      console.error('Mongoose Validation Error:', error.message);
      return res.status(400).json({ error: error.message });
    }
    console.error('Signup Server Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during signup.' });
  }
};

const login = async (req, res) => {
  console.log('Login attempt with body:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('User found, comparing passwords');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful, generating token');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        specialization: user.specialization 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, login };
