// Accepts either (...roles) or ([roles])
export const authorizeRoles = (roles) => {
  // If called as authorizeRoles(["employee"]) or authorizeRoles("employee")
  const allowedRoles = Array.isArray(roles) ? roles : Array.from(arguments);
  return (req, res, next) => {
    console.log("[ROLE CHECK] req.user:", req.user, "allowed roles:", allowedRoles);
    if (!req.user) {
      console.error("[ROLE ERROR] No user info");
      return res.status(401).json({ error: "Unauthorized. No user info" });
    }
    // Use userType for role check
    if (!allowedRoles.includes(req.user.userType)) {
      console.error("[ROLE ERROR] Access denied for user:", req.user);
      return res.status(403).json({ error: "Forbidden. Access denied" });
    }
    next();
  };
};
