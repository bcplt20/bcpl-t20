import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { sitemapHandler, robotsHandler, seoHtmlMiddleware } from "./routes/seo";
import { logger } from "./lib/logger";

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
app.use(cors());
app.use(express.json({
  verify: (req, _res, buf) => {
    // Capture the raw body for webhook signature verification
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── SEO: served at the domain root (nginx proxies these in production) ──
app.get("/sitemap.xml", sitemapHandler);
app.get("/robots.txt", robotsHandler); // fallback; the static file usually wins
// Any other page request gets the SPA's index.html with per-page meta,
// canonical URL and the Google verification tag injected server-side.
app.use(seoHtmlMiddleware);

export default app;
