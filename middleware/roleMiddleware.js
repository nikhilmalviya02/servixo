exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // check user first
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // role check
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};