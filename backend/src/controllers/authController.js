const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTER A NEW USER AND COMPANY
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Check if company already exists, otherwise create a new one
    let company = await Company.findOne({ name: companyName });
    if (!company) {
      company = new Company({ name: companyName });
      await company.save();
    }

    // Hash the user's password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new User (First user of a company is automatically an 'admin')
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin', // Defaulting first registering user as admin
      companyId: company._id
    });

    await newUser.save();
    res.status(201).json({ message: "User and Company registered successfully!" });

  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Create a Secure JSON Web Token (JWT)
    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token lasts for 1 day
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
};