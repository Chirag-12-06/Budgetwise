import { createProxyMiddleware } from "http-proxy-middleware";

const createServiceProxy = (target, serviceRoute) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `/api${serviceRoute}${path}`,
  });
};

export default createServiceProxy;