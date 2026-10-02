import express from "express";
import { 
  emailLogin, 
  registerUser, 
  logout, 
  verifyAuth, 
  refreshToken,
  getProfile,
  updateProfile
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authenticate.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", registerUser);
authRouter.post("/login", emailLogin);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refreshToken);

// Protected routes that require authentication
authRouter.get("/verify", authenticate, verifyAuth);

// Profile routes (protected)
authRouter.get("/profile", authenticate, getProfile);
authRouter.put("/profile", authenticate, updateProfile);

// Protected resource: uses accessToken from cookie/session, returns user info and role
authRouter.get("/protected-resource", authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "User not authenticated"
    });
  }
  // Use accessToken from cookie if you want to send it to frontend (optional)
  // const accessToken = req.cookies.accessToken;
  res.json({
    success: true,
    message: "You have access to this protected resource",
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      verificationStatus: req.user.verificationStatus,
    },
    role: req.user.userType,
    // accessToken, // Uncomment if you want to send it to frontend
  });
});

export default authRouter;
