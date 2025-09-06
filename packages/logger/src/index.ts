import {pino} from 'pino';
import { getRequestId } from "./requestId.js";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProd ? process.env.LOG_LEVEL ?? "info" : "debug",
  transport: !isProd
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" }
      }
    : undefined,
  base: { pid: process.pid, service: process.env.SERVICE_NAME ?? "api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) { return { level: label }; },
    log(obj) {
      const requestId = getRequestId();
      return requestId ? { ...obj, requestId } : obj;
    }
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        hostname: req.hostname,
        remoteAddress: req.ip,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

// re-export the ALS helpers
export * from "./requestId.js";
