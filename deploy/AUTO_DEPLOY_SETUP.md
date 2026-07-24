# 🚀 Auto-Deploy Setup — Site khud-ba-khud update kaise ho

## Ye kya hai?

Ab aapko har fix ke liye server me SSH karke commands chalane ki
**zaroorat nahi**. Bas GitHub par apne code ko `main` branch me
**merge/push** karo — site (https://bcplt20.com) **apne aap** update
ho jayegi.

Ye kaam GitHub ka ek "robot" (GitHub Actions) karta hai. Wo aapke
server me chup-chaap login karke naya code laata hai aur build + restart
kar deta hai.

Iske liye sirf **ek baar** neeche diye 3 secret (raaz) GitHub me
daalne hain. Ye ek baar ki setting hai — dobara nahi karni padegi.

---

## Ek-baar ka setup: 3 Secrets GitHub me daalo

### Ye 3 secrets chahiye

| Secret ka naam  | Iski value kya hai / kahan se milegi                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| `EC2_HOST`      | Aapke server (EC2) ka **IP address** ya domain. (Jaisa aap SSH me use karte the.)           |
| `EC2_USER`      | Bilkul yahi likho: **`ubuntu`**                                                              |
| `EC2_SSH_KEY`   | Aapki **SSH private key** ki poori file (`~/.ssh/...` wali). Ye Replit chat me di gayi hai.  |

> ⚠️ **Value kahan se milegi?**
> - **EC2_HOST** → wahi server ka pata jahan `ssh ubuntu@...` karte the.
>   Yaad na ho to Replit chat me poochh lo.
> - **EC2_USER** → hamesha `ubuntu`. Kuch aur mat likho.
> - **EC2_SSH_KEY** → ye wo **private key file** hai jo aapke computer par
>   `~/.ssh/` folder me hai (ya Replit chat me di gayi hai). Poori file
>   copy karni hai — **`-----BEGIN ...`** wali pehli line se lekar
>   **`-----END ...`** wali aakhiri line tak, sab kuch.

### Step-by-step (screenshots ki jagah shabdo me)

1. GitHub me apni repo **`bcplt20/bcpl-t20`** kholo.
2. Upar wale menu me **Settings** (⚙️) par click karo.
3. Baayen (left) side wali list me neeche jaake
   **Secrets and variables** → uske andar **Actions** par click karo.
4. Hara button **"New repository secret"** par click karo.
5. **Name** wale box me `EC2_HOST` likho, **Secret** wale box me apne
   server ka IP/pata paste karo → **"Add secret"** dabao.
6. Fir se **"New repository secret"** → `EC2_USER` likho, value `ubuntu`
   → **"Add secret"**.
7. Fir se **"New repository secret"** → `EC2_SSH_KEY` likho, value me
   apni **poori private key** paste karo (BEGIN se END tak) →
   **"Add secret"**.

Bas! Ab teeno secrets add ho gaye. Secrets list me teeno naam dikhne
chahiye (value dobara nahi dikhegi — ye normal hai, GitHub isse chhupa
deta hai).

---

## Ab site kaise update hogi?

Kuch nahi karna! Jab bhi naya code `main` branch me aata hai (aap ya
Replit merge karta hai), GitHub robot khud:

1. Server me login karta hai
2. Naya code laata hai (`git pull`)
3. Build + restart karta hai (`deploy/deploy.sh --ci`)

Thodi der (~2-5 min) me site update ho jayegi.

---

## Kaise check kare ki sab theek chala? (Verify)

1. GitHub repo me upar **Actions** tab par click karo.
2. Sabse upar aapke latest push ka naam dikhega
   (**"Deploy to bcplt20.com"**).
3. Uske aage:
   - ✅ **Hara tick (green check)** = deploy safal, site update ho gayi.
   - 🟡 **Peela ghera (spinning)** = abhi chal raha hai, thoda ruko.
   - ❌ **Laal cross (red X)** = kuch gadbad hui. Us par click karke
     laal wala step kholo — error Replit chat me bhej do.
4. Aakhri check: browser me **https://bcplt20.com** kholo aur dekho
   ki aapka naya fix dikh raha hai.

---

## 🔁 Rollback (kuch bigad jaye to purana wapas laao)

Agar naye deploy ke baad site me kuch kharabi aayi, to **purana
theek chalne wala version** wapas laa sakte ho:

1. GitHub repo → **Actions** tab kholo.
2. List me neeche jaake **wo purana run dhoondo jispe hara tick tha**
   (jab site theek chal rahi thi).
3. Us run par click karo.
4. Upar-daayen (top-right) **"Re-run jobs"** → **"Re-run all jobs"**
   par click karo.

Ye us purane (theek) code ko dobara server par laga dega, aur site
wapas theek ho jayegi.

> 💡 Zaruri ho to Replit chat me batao — hum aapke saath rollback
> kar denge.

---

## Manual deploy (agar kabhi zaroorat pade)

Auto-deploy fail ho ya pehli baar koi nayi key set karni ho, to purana
tareeka abhi bhi kaam karta hai — server me SSH karke:

```bash
cd /home/ubuntu/app && bash deploy/go.sh
```

Ye poori tarah manual chalta hai aur zaroorat padne par aapse keys
poochh sakta hai.
