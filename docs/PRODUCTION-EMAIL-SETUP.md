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

## SMS (MSG91)

SMS ab **MSG91** se jaate hain (login OTP + receipt SMS dono) — aapke approved DLT templates
aur balance wahin hain. Code taiyaar hai; bas 3 cheezein chahiye:

### 1. IP whitelist (sabse pehle — isi wajah se SMS block ho rahe the)

MSG91 dashboard me **Settings → Security → IP Security / Whitelist IP** kholein aur server ki IP add karein
(MSG91 ne jo email bheja tha, usme bhi iska direct link hai). EC2 server ki IP nikaalne ke liye
server par yeh chalayein: `curl ifconfig.me`

### 2. Env variables (EC2 ke `.env` me)

| Variable | Kya hai | Kahan milega |
|---|---|---|
| `MSG91_AUTH_KEY` | MSG91 Auth Key | MSG91 dashboard → upar-right username → **Authkey** |
| `MSG91_OTP_TEMPLATE_ID` | Approved OTP template ki ID | MSG91 → **OTP** section → templates |
| `MSG91_SENDER_ID` | 6-letter DLT sender ID (jaise `KRIPLA`) | MSG91 → DLT / Sender ID settings |

```bash
cd /home/ubuntu/app
nano .env        # upar wali 3 lines add karein
pm2 restart all --update-env
```

(Purani `TWOFACTOR_API_KEY` ab istemaal nahi hoti — .env se hata sakte hain.)

### 3. Check kaise karein ki SMS ja rahe hain

```bash
pm2 logs --lines 200 | grep -E "MSG91|SMS-SENT|SMS-FAILED"
```

- `[MSG91-OTP-SENT]` / `[SMS-SENT]` = MSG91 ne message accept kar liya
- `[MSG91-OTP-FAILED]` / `[SMS-FAILED]` = exact wajah saath me hogi (IP blocked / template mismatch / balance)

Dhyaan: receipt SMS ka **text aapke DLT-approved template se match hona chahiye**, warna operator
use rok dega — mismatch par log me error dikh jayega.

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
