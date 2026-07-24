# AWS Phase 1 — Owner Guide (सुबह के लिए, ~1–2 घंटे, browser only)

सब कुछ AWS Console (browser) से होगा — कोई SSH/coding नहीं।
हर step के बाद मुझे Replit chat में बताते जाओ, मैं verify करता जाऊंगा।

---

## STEP 1 — RDS की 4 जानकारियां (5 मिनट) ⭐ सबसे पहले

AWS Console → ऊपर region **Mumbai (ap-south-1)** चुनो → **RDS** → **Databases** → अपने DB पर click करो।

मुझे ये 4 चीज़ें बताओ:
1. **Instance class** (Configuration tab — जैसे db.t3.micro)
2. **Multi-AZ**: Yes या No (Configuration tab)
3. **Automated backups**: Enabled? Retention कितने दिन? (Maintenance & backups tab)
4. **Storage autoscaling**: Enabled? (Configuration → Storage)

⚠️ अगर Automated backups **0 days / disabled** दिखे — तुरंत बताओ, यह सबसे risky चीज़ है।

## STEP 2 — Billing alerts (10 मिनट)

1. Console में search: **Budgets** → **Create budget**
2. **Use a template** → **Monthly cost budget**
3. Amount: जो महीने की limit चाहिए (जैसे $100) → अपना email डालो → Create।
4. दूसरा budget भी बना दो double amount का ("emergency" alert)।

## STEP 3 — मेरे लिए read-only चाबी (10 मिनट)

इससे मैं आगे की inspections खुद कर पाऊंगा (सिर्फ देखना — कुछ बदलना नहीं):
1. Console search: **IAM** → **Users** → **Create user** → नाम: `bcpl-readonly-agent`
2. "Provide user access to the AWS Management Console" ❌ (untick रहने दो)
3. **Attach policies directly** → search करके tick करो: **`ViewOnlyAccess`** → Create user।
4. User खोलो → **Security credentials** tab → **Create access key** → "Third-party service" → Create।
5. जो **Access key ID** और **Secret access key** मिले, उन्हें **Replit के Secrets pane** में डालो
   (नाम: `AWS_READONLY_ACCESS_KEY_ID`, `AWS_READONLY_SECRET_ACCESS_KEY`) —
   **chat में कभी paste मत करना।**

## STEP 4 — CloudFront + WAF (45–60 मिनट, मेरे साथ मिलकर)

यह थोड़ा बड़ा step है — जब तुम STEP 1–3 करके फ्री हो, मुझे बोलो, मैं
एक-एक screen साथ में करवाऊंगा। मोटा नक्शा:

1. **Certificate (पहले):** Console → **Certificate Manager** → region ऊपर से
   **US East (N. Virginia) us-east-1 में बदलकर** → Request certificate →
   `bcplt20.com` + `www.bcplt20.com` → DNS validation → जो CNAME records मिलें
   वो अपने domain DNS में डालो → "Issued" होने तक रुको।
   (CloudFront को certificate सिर्फ us-east-1 का चाहिए — यह AWS का नियम है।)
2. **CloudFront distribution:** Origin = तुम्हारा EC2 domain (bcplt20.com origin
   नहीं — पहले EC2 का अलग hostname बनाएंगे, मैं बताऊंगा) । Behaviors:
   - `/assets/*` → Caching **enabled** (1 साल तक ठीक है — filenames हर deploy पर बदलते हैं)
   - Default `/*` → Cache policy **CachingDisabled** + Origin request policy **AllViewer**
     (API, player pages, KYC, admin — **कुछ भी private cache नहीं होगा**)
3. **WAF:** CloudFront बनाते समय "Enable security protections" → AWS Managed
   Common rule set + rate limit (हम 2000 requests/5min/IP रखेंगे — carrier NAT
   वाले असली users block न हों)।
4. **DNS cutover सबसे आखिर में** — जब सब test हो जाए तब domain को CloudFront
   पर point करेंगे; कुछ भी गड़बड़ लगे तो DNS वापस EC2 पर = तुरंत rollback।

## STEP 5 — SMS/Email provider limits (15 मिनट, बड़े campaign से पहले)

- **MSG91 dashboard** → अपने plan की per-second/per-day sending limit देखो और
  बताओ। 10 लाख OTP भेजने हों तो rate + balance दोनों चाहिए (~₹2–4 लाख का SMS bill)।
- **Brevo dashboard** → plan की daily email limit देखो (free plan बहुत छोटा होता है)।

---

### इस guide से क्या नहीं होता
Auto-scaling (कई servers), queues (SQS), Redis — वो Phase 2 है, अलग migration।
Phase 1 सिर्फ: सुरक्षा-जाल (backups, alerts), edge protection (CloudFront/WAF),
और मुझे inspection access। Load testing (Phase 3) staging बनने के बाद।
