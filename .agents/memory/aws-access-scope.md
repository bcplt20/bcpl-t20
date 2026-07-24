---
name: AWS access scope from workspace
description: What the workspace AWS keys can/cannot inspect, and how to probe AWS without the CLI
---

Workspace AWS creds = IAM user `bcpl-s3-user` (account 287347870242): **S3-only**. EC2/RDS/ELB/ASG/SQS/ElastiCache/CloudFront/quota describes all return AccessDenied — do not retry them; infra facts must come from `deploy/` scripts, the owner's console, or a future read-only IAM key (ask for `ViewOnlyAccess`).

**Probe technique (no AWS CLI installed):** `curl --aws-sigv4 "aws:amz:<region>:<service>" --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" "<endpoint>?Action=...&Version=..."` works for Query APIs; STS GetCallerIdentity needs no permissions (always identifies the principal).

Prod topology ground truth lives in `deploy/` (nginx.conf, ecosystem.config.js): ONE EC2 t3.medium ap-south-1, pm2 cluster ×2, nginx serves static + proxies /api and HTML to :4000; no ALB/CDN/WAF/SQS/Redis/autoscaling as of July 2026. Scalability inspection: `SCALABILITY_INSPECTION_REPORT.md` (root).
