import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
// who are you
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);


    const user = await User.findById(decoded.userId)
      .populate("roles.role")
      .populate("team")
      .select("-password");

      console.log(user,"user");
      

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    const now = new Date();

    const activeRoles = user.roles.filter(r => {
      if (r.revoked) return false;
      if (r.validFrom && now < r.validFrom) return false;
      if (r.validTill && now > r.validTill) return false;
      return true;
    });

    console.log(activeRoles,"activeRoles");
    

    req.user = user;
    req.user.activeRoles = activeRoles;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


export default authMiddleware;
