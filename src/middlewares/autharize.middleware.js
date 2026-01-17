const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const now = new Date();
    let matchedPermission = null;

    for (const roleAssignment of req.user.activeRoles || []) {
      const role = roleAssignment.role;
      if (!role || !role.permissions) continue;

      for (const perm of role.permissions) {
        if (perm.revoked) continue;
        if (perm.key !== requiredPermission) continue;

        if (perm.validFrom && now < perm.validFrom) continue;
        if (perm.validTill && now > perm.validTill) continue;

        matchedPermission = perm;
        break;
      }
      if (matchedPermission) break;
    }

    if (!matchedPermission) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions",
      });
    }
 
    req.permissionScope = matchedPermission.scope;

    next();
  };
};

export default authorize;
