const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");

exports.register = async (req, res) => {

  try {

    const { name, email, password, role, servicesOffered } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role
    };

    if (role === "provider" && servicesOffered?.length) {
      userData.servicesOffered = servicesOffered;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "User registered",
      user
    });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};

exports.googleLogin = async (req, res) => {

  try {

    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    const email = decodedToken.email;
    const name = decodedToken.name;
    const googleId = decodedToken.uid;
    const picture = decodedToken.picture;

    if (!email) {
      return res.status(400).json({ message: "Email not found in Firebase token" });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture,
        role: role || "user",
        isVerified: true
      });

    } else if (!user.googleId) {
      
      user.googleId = googleId;
      user.avatar = picture;
      user.isVerified = true;
      await user.save();

    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user
    });

  } catch (error) {

    console.error("Google Login Error:", error.message);

    res.status(500).json({
      message: "Google login failed",
      error: error.message
    });

  }

};