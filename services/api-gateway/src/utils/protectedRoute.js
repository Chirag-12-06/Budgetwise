import authMiddleware from "../middleware/auth.middleware.js";
import createServiceProxy from "./createServiceProxy.js";

const protectedRoute = (target, serviceRoute) => {
  return [
    authMiddleware,
    createServiceProxy(target, serviceRoute),
  ];
};

export default protectedRoute;