import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authenticate = async (req, res, next) => {
  try {
    // Debug: log cookies and headers to diagnose auth issues
    console.log("[AUTH] req.cookies:", req.cookies);
    console.log("[AUTH] req.headers.cookie:", req.headers.cookie);
    console.log("[AUTH] req.headers.authorization:", req.headers.authorization);

    const accessToken =
      req.cookies.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
          const user = await User.findById(decoded.id).select("-password");
          if (!user) {
            console.error("[AUTH ERROR] Invalid refresh token: user not found");
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
          }

          const newAccessToken = jwt.sign(
            { id: user._id, role: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          const newRefreshToken = jwt.sign(
            { id: user._id, role: user.userType },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
          );

          // Set cookies with correct options for dev/prod
          const isProd = process.env.NODE_ENV === "production";
          const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax",
          };
          res.cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.cookie("refreshToken", newRefreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          req.user = {
            id: user._id,
            email: user.email,
            userType: user.userType,
            displayName: user.displayName,
            verificationStatus: user.verificationStatus,
          };

          return next();
        } catch (err) {
          console.error("[AUTH ERROR] Refresh token verification failed:", err);
          return res.status(401).json({ success: false, message: "Invalid refresh token", error: err.message });
        }
      }
      console.error("[AUTH ERROR] No access or refresh token provided");
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (jwtErr) {
      console.error("[AUTH ERROR] Access token verification failed:", jwtErr);
      if (jwtErr instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ success: false, message: "Token expired" });
      }
      return res.status(401).json({ success: false, message: "Authentication failed", error: jwtErr.message });
    }

    let user;
    try {
      user = await User.findById(decoded.id).select("-password");
    } catch (dbErr) {
      console.error("[AUTH ERROR] DB lookup failed:", dbErr);
      return res.status(401).json({ success: false, message: "Authentication failed", error: dbErr.message });
    }

    if (!user) {
      console.error("[AUTH ERROR] User not found for id:", decoded.id);
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (user.isSuspended) {
      console.error("[AUTH ERROR] User is suspended:", user._id);
      return res.status(403).json({ success: false, message: "Account suspended" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      displayName: user.displayName,
      verificationStatus: user.verificationStatus,
    };

    next();
  } catch (error) {
    console.error("[AUTH ERROR] Unexpected error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(401).json({ success: false, message: "Authentication failed", error: error.message });
  }
};

// Require verified email middleware

