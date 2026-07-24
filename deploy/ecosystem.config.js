// PM2 Ecosystem File — manages the API server process
//
// ⚠️  SAFE-START: Ye file ab /home/ubuntu/app/.env.production ko KHUD
//     padh leti hai. Isliye `pm2 start deploy/ecosystem.config.js` kisi
//     bhi terminal se chalao — keys kabhi khali nahi jayengi.
//     (Pehle aisa karne par JWT_SECRET etc. undefined ho jate the aur
//     app crash-loop me chali jati thi → poori site 502.)
//     Normal deploy hamesha `bash deploy/deploy.sh` se hi karo.

const fs = require("fs");

// ── .env.production ko direct load karo (fallback safety net) ──────────
const ENV_FILE = "/home/ubuntu/app/.env.production";
const fileEnv = {};
try {
  for (const rawLine of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // surrounding quotes hatao (agar hain)
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    if (key) fileEnv[key] = val;
  }
} catch (_e) {
  // File nahi mili — phir shell env hi sab kuch dega (purana behaviour)
}

// Shell env jeet-ta hai (deploy.sh usi file ko source karta hai),
// file sirf safety net hai taaki bare `pm2 start` secrets na uda de.
const env = (key) => process.env[key] || fileEnv[key];

module.exports = {
  apps: [
    {
      name:        "bcpl-api",
      script:      "./dist/index.mjs",
      cwd:         "/home/ubuntu/app/artifacts/api-server",
      instances:   2,           // 2 CPU cores for t3.medium
      exec_mode:   "cluster",   // load balance across instances
      env: {
        NODE_ENV:    "production",
        PORT:        "4000",

        // ── Database (AWS RDS) ──────────────────────────────
        DATABASE_URL: env("DATABASE_URL"),

        // ── AWS S3 ──────────────────────────────────────────
        AWS_ACCESS_KEY_ID:     env("AWS_ACCESS_KEY_ID"),
        AWS_SECRET_ACCESS_KEY: env("AWS_SECRET_ACCESS_KEY"),
        AWS_S3_BUCKET:         "bcpl-trial-videos",
        AWS_REGION:            "ap-south-1",

        // ── Auth ────────────────────────────────────────────
        JWT_SECRET:     env("JWT_SECRET"),
        SESSION_SECRET: env("SESSION_SECRET"),
        ADMIN_SECRET:   env("ADMIN_SECRET"),
        // Admin panel login password (server-side check — REQUIRED,
        // warna production me admin login 403 dega)
        ADMIN_PANEL_PASSWORD: env("ADMIN_PANEL_PASSWORD"),
        // Admin alert inbox (lockdown + KYC manual-review alerts)
        ADMIN_ALERT_EMAIL:    env("ADMIN_ALERT_EMAIL"),

        // ── SMS (MSG91 — OTP + notifications) ───────────────
        MSG91_AUTH_KEY:        env("MSG91_AUTH_KEY"),
        MSG91_OTP_TEMPLATE_ID: env("MSG91_OTP_TEMPLATE_ID"),
        MSG91_SENDER_ID:       env("MSG91_SENDER_ID"),

        // ── Email / WhatsApp / Payment ───────────────────────
        BREVO_API_KEY:     env("BREVO_API_KEY"),
        BREVO_FROM_EMAIL:  "noreply@bcplt20.com",
        INTERAKT_API_KEY:  env("INTERAKT_API_KEY"),
        CASHFREE_APP_ID:     env("CASHFREE_APP_ID"),
        CASHFREE_SECRET_KEY: env("CASHFREE_SECRET_KEY"),
        CASHFREE_ENV:        "PROD",

        // ── Cashfree Verification Suite (KYC) ───────────────
        CF_VERIFY_APP_ID: env("CF_VERIFY_APP_ID"),
        CF_VERIFY_SECRET: env("CF_VERIFY_SECRET"),

        // ── Site URLs ────────────────────────────────────────
        SITE_URL:  "https://bcplt20.com",
        API_URL:   "https://bcplt20.com",
      },
      error_file:  "/home/ubuntu/logs/bcpl-api-error.log",
      out_file:    "/home/ubuntu/logs/bcpl-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M",
      restart_delay: 3000,
    },
  ],
};
