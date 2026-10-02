import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Helper function to generate JWT tokens
 * @param {Object} user - User document from database
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.userType },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/**
 * Register new user
 * @route POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    const { displayName, email, password, userType } = req.body;

    // Validate required fields
    if (!displayName || !email || !password || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // Validate user type
    const validUserTypes = ["employee", "admin", "accountant", "management"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      displayName,
      email,
      password: hashedPassword,
      userType,
      verificationStatus: process.env.AUTO_VERIFY_EMAIL === "true" ? "verified" : "pending"
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: "User registered successfully", 
      user: {
        id: newUser._id,
        email: newUser.email,
        displayName: newUser.displayName,
        userType: newUser.userType,
        verificationStatus: newUser.verificationStatus,
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * Login with email and password
 * @route POST /api/auth/login
 */
export const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspendedReason || "Contact support"}`,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);


    // --- CORS & Cookie Security Advice ---
    // For local dev: frontend (e.g. localhost:5173) and backend (localhost:5000) must both use 'Lax' or 'None' for SameSite.
    // For production: use 'None' and 'Secure' if using HTTPS and cross-domain, else 'Lax' and 'Secure' as needed.
    // If you deploy on a custom domain, set 'domain' option to your root domain (e.g. .yourdomain.com) for SSO across subdomains.

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProd, // true in prod (HTTPS), false in dev
      sameSite: isProd ? "None" : "Lax",
      // domain: isProd ? ".yourdomain.com" : undefined, // Uncomment and set if needed
    };

    // Set cookies in response
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    // Set user ID cookie (non-httpOnly, accessible to client JS)
    res.cookie("userId", user._id.toString(), {
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      // domain: isProd ? ".yourdomain.com" : undefined, // Uncomment and set if needed
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send user data in response
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * Logout user by clearing cookies
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Clear all authentication cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
    });
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
    });
    
    res.clearCookie("userId", {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
    });
    
    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * Verify user's authentication status and return user data
 * @route GET /api/auth/verify
 */
export const verifyAuth = async (req, res) => {
  try {
    // This route should be protected by the authenticate middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    // User data is already populated by the authenticate middleware
    res.json({
      success: true,
      message: "User authenticated",
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        userType: req.user.userType,
        verificationStatus: req.user.verificationStatus
      }
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided"
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }
    
    // Check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspendedReason || "Contact support"}`
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
    };
    
    res.cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    
    // Clear cookies on error
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("userId");
    
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: error.message
    });
  }
};

/**
 * Get current user's profile
 * @route GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      profile: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message
    });
  }
};

/**
 * Update current user's profile
 * @route PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, phone, department, position } = req.body;
    
    // Build update object with only allowed fields (email is not editable)
    const updateData = {};
    if (displayName !== undefined && displayName.trim()) {
      updateData.displayName = displayName.trim();
    }
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    if (department !== undefined) {
      updateData.department = department.trim();
    }
    if (position !== undefined) {
      updateData.position = position.trim();
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedUser._id,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        department: updatedUser.department || "",
        position: updatedUser.position || "",
        userType: updatedUser.userType,
        verificationStatus: updatedUser.verificationStatus
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};
