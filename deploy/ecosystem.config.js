// PM2 Ecosystem File — manages the API server process
// Usage: pm2 start ecosystem.config.js

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
        DATABASE_URL: process.env.DATABASE_URL,

        // ── AWS S3 ──────────────────────────────────────────
        AWS_ACCESS_KEY_ID:     process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET:         "bcpl-trial-videos",
        AWS_REGION:            "ap-south-1",

        // ── Auth ────────────────────────────────────────────
        JWT_SECRET:     process.env.JWT_SECRET,
        SESSION_SECRET: process.env.SESSION_SECRET,
        ADMIN_SECRET:   process.env.ADMIN_SECRET,
        // Admin panel login password (server-side check — REQUIRED,
        // warna production me admin login 403 dega)
        ADMIN_PANEL_PASSWORD: process.env.ADMIN_PANEL_PASSWORD,
        // Admin alert inbox (lockdown + KYC manual-review alerts)
        ADMIN_ALERT_EMAIL:    process.env.ADMIN_ALERT_EMAIL,

        // ── SMS (MSG91 — OTP + notifications) ───────────────
        MSG91_AUTH_KEY:        process.env.MSG91_AUTH_KEY,
        MSG91_OTP_TEMPLATE_ID: process.env.MSG91_OTP_TEMPLATE_ID,
        MSG91_SENDER_ID:       process.env.MSG91_SENDER_ID,

        // ── Email / WhatsApp / Payment ───────────────────────
        BREVO_API_KEY:     process.env.BREVO_API_KEY,
        BREVO_FROM_EMAIL:  "noreply@bcplt20.com",
        INTERAKT_API_KEY:  process.env.INTERAKT_API_KEY,
        CASHFREE_APP_ID:     process.env.CASHFREE_APP_ID,
        CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
        CASHFREE_ENV:        "PROD",

        // ── Cashfree Verification Suite (KYC) ───────────────
        CF_VERIFY_APP_ID: process.env.CF_VERIFY_APP_ID,
        CF_VERIFY_SECRET: process.env.CF_VERIFY_SECRET,

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
