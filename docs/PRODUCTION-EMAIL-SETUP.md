# Production Email/SMS Setup — bcplt20.com

**Yeh document owner ke liye hai: production server (EC2) par receipt email/SMS chalne ke liye kya chahiye.**

## Email (Brevo) — sabse zaroori

Abhi **email bilkul nahi ja rahe** kyunki Brevo API key invalid hai (Brevo bolta hai: "Key not found").
Shayad key rotate/delete ho gayi hai.

Theek karne ke liye:

1. [Brevo dashboard](https://app.brevo.com) me login karein → **SMTP & API** → **API Keys** → nayi key banayein (v3 key).
2. Check karein ki **sender verified** hai: Brevo → **Senders & IP** → `info@bcplt20.com` verified hona chahiye
   (agar nahi hai to "Add a sender" karke email verify karein).
3. **IP restriction:** Agar Brevo me "Authorised IPs" security on hai
   ([app.brevo.com/security/authorised_ips](https://app.brevo.com/security/authorised_ips)) to server ki IP
   whitelist me honi chahiye, warna har email 401 "unrecognised IP address" se fail hogi.
   **Aasan tareeka: yeh restriction deactivate kar dein** — kyunki server/Replit ki IP badalti rehti hai.
3. EC2 server par key update karein:
   ```bash
   cd /home/ubuntu/app
   nano .env        # BREVO_API_KEY=nayi-key-yahan
   pm2 restart all --update-env
   ```

Env variables jo email ke liye lagte hain:

| Variable | Kya hai | Zaroori? |
|---|---|---|
| `BREVO_API_KEY` | Brevo v3 API key | ✅ Haan |
| `BREVO_FROM_EMAIL` | Sender email (default: `info@bcplt20.com`) | Optional — par Brevo me verified hona chahiye |
| `SITE_URL` | Email ke buttons/links ke liye (`https://bcplt20.com`) | ✅ Haan |

## SMS (2Factor)

- OTP SMS chal rahe hain (balance: ~152).
- **Receipt SMS** alag service se jaate hain (Transactional SMS addon — balance ~₹200 hai).
- Dhyaan: India me transactional SMS ke liye **DLT-approved template** chahiye. Agar SMS fail ho raha hai
  to 2Factor dashboard me TSMS template approve karwana hoga.
- Alag task already bana hai: **MSG91 par switch (Task #23)** — aapke approved templates wahan hain.

| Variable | Kya hai |
|---|---|
| `TWOFACTOR_API_KEY` | 2Factor API key (OTP + SMS dono ke liye) |

## WhatsApp (Interakt)

`INTERAKT_API_KEY` **kahin set nahi hai** — isliye WhatsApp messages nahi jaate (ab log me "skipped" dikhega).
Agar WhatsApp receipts chahiye to Interakt account banakar key set karein, aur templates approve karwayein
(`bcpl_phase1_receipt`, `bcpl_phase2_receipt`, etc.).

## Kaise pata chalega ki message gaya ya nahi?

Ab **har attempt database me record hota hai** (`notification_logs` table):

- `status = sent` — provider ne accept kiya
- `status = failed` — provider ne reject kiya (`error` column me exact wajah)
- `status = skipped` — API key hi set nahi thi

Server logs me bhi ab loud errors aate hain:

```bash
pm2 logs --lines 200 | grep -E "EMAIL-FAILED|SMS-FAILED|WA-FAILED|NOTIFY"
```

> Database me naya `error` column server start hote hi apne aap ban jata hai
> (startup migration) — koi manual SQL nahi chalana.

## Admin panel se invoice bhejna

Finance & GST → transaction kholein → **Send Invoice** — ab yeh sach me email bhejta hai
(GST breakdown ke saath). Fail hone par exact error screen par dikhega.
