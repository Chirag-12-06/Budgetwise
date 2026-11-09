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
    console.log("Incoming URL:", req.originalUrl);
    console.log("Proxy URL:", proxyReq.path);
  },

  proxyRes: (proxyRes, req) => {
    console.log("Proxy response:", proxyRes.statusCode);
  },

  error: (err) => {
    console.error("Proxy error:", err.message);
  },
},
  });
};

export default createServiceProxy;