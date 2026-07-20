# BCPL T20 — AWS Deployment Guide

## Architecture

```
Internet (bcplt20.com)
    │
    ▼
Cloudflare (DNS + DDoS protection — Free)
    │
    ▼
AWS EC2 — t3.medium, Ubuntu 22.04 (Mumbai ap-south-1)
    │  Nginx (port 80/443)
    ├── /api/*        → PM2 → Node.js API (port 4000)
    └── /bcpl-website → Static files (Vite build)
         │
         ▼
    AWS RDS PostgreSQL — db.t3.micro (Mumbai ap-south-1)
         │
         ▼
    AWS S3 — bcpl-trial-videos (Mumbai ap-south-1)
```

---

## Step 1 — AWS RDS Setup (Database)

1. AWS Console → **RDS** → **Create database**
2. Settings:
   - Engine: **PostgreSQL 15**
   - Template: **Free tier** (baad mein upgrade karna)
   - DB instance: `db.t3.micro`
   - DB identifier: `bcpl-db`
   - Master username: `bcpluser`
   - Master password: (strong password note karo)
   - DB name: `bcpldb`
   - Region: **ap-south-1 (Mumbai)**
3. Connectivity:
   - VPC: Default
   - Public access: **Yes** (sirf initially, baad mein EC2 se restrict karo)
   - Port: 5432
4. Create database — **15-20 min lagenge**
5. Endpoint copy karo (format: `bcpl-db.xxxx.ap-south-1.rds.amazonaws.com`)

DATABASE_URL format:
```
postgresql://bcpluser:PASSWORD@bcpl-db.xxxx.ap-south-1.rds.amazonaws.com:5432/bcpldb
```

---

## Step 2 — AWS EC2 Setup (Server)

1. AWS Console → **EC2** → **Launch Instance**
2. Settings:
   - Name: `bcpl-server`
   - AMI: **Ubuntu Server 22.04 LTS**
   - Instance type: **t3.medium** (2 vCPU, 4GB RAM)
   - Key pair: Create new → `bcpl-key` → Download `.pem` file (SAVE IT!)
   - Security group — Allow inbound:
     - SSH: Port 22 (apna IP se)
     - HTTP: Port 80 (Anywhere)
     - HTTPS: Port 443 (Anywhere)
3. Launch instance
4. Elastic IP assign karo (EC2 → Elastic IPs → Allocate → Associate)

---

## Step 3 — Server Connect & Setup

```bash
# 1. Key permission fix (Mac/Linux)
chmod 400 ~/Downloads/bcpl-key.pem

# 2. SSH into server
ssh -i ~/Downloads/bcpl-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# 3. Run setup script (paste commands)
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/deploy/setup-ec2.sh
chmod +x setup-ec2.sh
sudo ./setup-ec2.sh
```

---

## Step 4 — Deploy Code

```bash
# On EC2 server:
sudo -u bcpl bash
cd /home/bcpl/app

# Clone your code (ya zip upload karo)
git clone YOUR_REPO_URL .
# OR upload via scp:
# scp -i bcpl-key.pem -r /local/project ubuntu@EC2_IP:/home/bcpl/app

# Create .env.production (template se copy karo, values bharo)
cp deploy/env.production.template .env.production
nano .env.production   # sab values fill karo

# Deploy!
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

---

## Step 5 — Nginx Setup

```bash
# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bcplt20
sudo ln -s /etc/nginx/sites-available/bcplt20 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# SSL Certificate (Free — Let's Encrypt)
sudo certbot --nginx -d bcplt20.com -d www.bcplt20.com
# Email daalo, agree karo — SSL auto-renew hoga
```

---

## Step 6 — Domain (bcplt20.com) Connect

**Option A — Cloudflare (Recommended):**
1. cloudflare.com pe bcplt20.com add karo
2. Nameservers change karo (Godaddy/Namecheap mein)
3. Cloudflare DNS → A record add karo:
   - Name: `@` → Value: EC2 Elastic IP
   - Name: `www` → Value: EC2 Elastic IP
4. SSL: Cloudflare → SSL/TLS → Full (Strict)

**Option B — Direct DNS:**
- Godaddy/Namecheap mein A record: `@` → EC2 Elastic IP

---

## Monthly Cost Estimate

| Service | Config | Cost/Month |
|---------|--------|------------|
| EC2 t3.medium | 24/7 | ~₹3,500 |
| RDS db.t3.micro | 24/7 | ~₹2,500 |
| S3 (videos) | ~500GB | ~₹1,500 |
| Elastic IP | 1 IP | ~₹300 |
| Data transfer | ~100GB | ~₹500 |
| **Total** | | **~₹8,300/month** |

---

## Future Scaling (10L+ Users)

- EC2: t3.medium → t3.large → Auto Scaling Group
- RDS: db.t3.micro → db.t3.small → Read Replicas
- Add: CloudFront CDN for static files
- Add: ElastiCache Redis for session caching
