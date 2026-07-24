import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { sitemapHandler, robotsHandler, seoHtmlMiddleware } from "./routes/seo";
import { logger } from "./lib/logger";
import { pgCauseOf } from "./lib/pgErrors";

const app: Express = express();

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

// ── CORS: reflect only trusted origins ────────────────────────────────────────
// Prod serves the site same-origin (nginx proxies /api); dev uses the Vite proxy
// — so browsers never legitimately call this API cross-origin. Server-to-server
// callers (Cashfree webhook, curl, health checks) send no Origin header and are
// always allowed. This replaces the previous wildcard (Access-Control-Allow-Origin: *).
const ALLOWED_ORIGINS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.repl\.co$/,
];
const SITE_ORIGIN = process.env.SITE_URL;
const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser / same-origin
    if (SITE_ORIGIN && origin === SITE_ORIGIN) return cb(null, true);
    if (ALLOWED_ORIGINS.some((re) => re.test(origin))) return cb(null, true);
    return cb(null, false); // not an error — just no CORS headers emitted
  },
};
app.use(cors(corsOptions));

// ── Baseline security headers ─────────────────────────────────────────────────
// Conservative set that will not interfere with the Cashfree checkout redirect
// or server-side SEO HTML injection. A tuned Content-Security-Policy is a
// recommended follow-up (needs testing against the payment SDK first).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    // Capture the raw body for webhook signature verification
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// ── SEO: served at the domain root (nginx proxies these in production) ──
app.get("/sitemap.xml", sitemapHandler);
app.get("/robots.txt", robotsHandler); // fallback; the static file usually wins
// Any other page request gets the SPA's index.html with per-page meta,
// canonical URL and the Google verification tag injected server-side.
app.use(seoHtmlMiddleware);

// ── Last-resort error handler ─────────────────────────────────────────────────
// Express 5 forwards async route rejections here. Without this, the default
// handler answers an opaque HTML "Internal Server Error" and — crucially —
// never logs the pg error hidden in Drizzle's .cause chain.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const pg = pgCauseOf(err);
  logger.error(
    { err, pgCode: pg?.code, pgTable: pg?.table, pgConstraint: pg?.constraint, pgDetail: pg?.detail, url: req.originalUrl, method: req.method },
    "unhandled route error",
  );
  // Mid-stream failure: headers already went out — let Express's default
  // finalizer close the connection correctly instead of writing again.
  if (res.headersSent) return void next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
