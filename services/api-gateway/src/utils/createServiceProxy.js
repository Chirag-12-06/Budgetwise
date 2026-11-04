import { createProxyMiddleware } from "http-proxy-middleware";

const createServiceProxy = (target, serviceRoute = "") => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,

    pathRewrite: (path) => {
      return `/api${serviceRoute}${path}`;
    },

    timeout: 120000,
    proxyTimeout: 120000,

    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user?.id) {
          proxyReq.setHeader("x-user-id", req.user.id);
        }
      },

      error: (err) => {
        console.error("Proxy error:", err.message);
      },
    },
  });
};

export default createServiceProxy;