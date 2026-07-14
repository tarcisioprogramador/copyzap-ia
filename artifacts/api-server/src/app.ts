import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    next();
    return;
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Muitas requisições. Tente novamente em 1 minuto." });
    return;
  }
  next();
}

// Cleanup rate limit map every 5 minutes
const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

// Prevent the interval from keeping the process alive
if (rateLimitCleanupInterval.unref) {
  rateLimitCleanupInterval.unref();
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limit to all API routes
app.use("/api", rateLimit);

app.use("/api", router);

export default app;
