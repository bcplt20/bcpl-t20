---
name: Bulk media pipeline (Drive → site galleries)
description: Patterns for bulk-downloading the owner's Drive media and shipping optimized photo galleries / video clips on the website
---
- Drive folder listing: fetch `https://drive.google.com/embeddedfolderview?id=FOLDER#list` and parse HTML → tsv of file ids/names (works without auth for shared folders).
- Photo files: plain `curl -sL "https://drive.google.com/uc?export=download&id=ID"` works (no confirm page for <25MB). Big video files: `uvx gdown ID` (`uv tool install` is broken here; use `uvx`).
- Long batch jobs: background processes (nohup/setsid) die unreliably under ShellExec; use FOREGROUND time-boxed batches (`timeout ~200 bash script.sh`) where the script is skip-existing/resume-safe. Heavy parallel load caused workspace recycles twice — keep parallelism modest and calls ≤~240s.
- **Partial-file trap**: a timeout mid-ffmpeg/mid-download leaves a partial output that skip-existing logic then skips forever. After batch encodes, verify with ffprobe durations (a truncated mp4 shows empty duration); re-encode any offender.
- Optimize recipes that worked: `magick` 1800px q78 (full) + 460px q72 (thumb) with memory limits; clips `ffmpeg -vf scale=-2:720 -crf 26 -preset fast -movflags +faststart` ≈1–8MB per clip; posters via `-ss N` — pick a frame showing the subject, not the pan-in start.
- Gallery shipping pattern: generated TS data file (`{f,w,h}` from thumb dims) + sequential `ps-NNN.jpg` into `public/`; commit a placeholder-empty data file first so tsc/vite stay green; gate the section render on `length > 0`.
- yt-dlp is bot-blocked from this workspace IP (all player clients) — for YouTube content, ask the owner to upload files to Drive instead.
**Why:** two recycles + several dead background jobs burned hours; these patterns finished 845 photos + 12 clips reliably.
**How to apply:** any future bulk media task (team launch videos, match galleries) — reuse media-staging scripts (batch.sh/optimize.sh/compress.sh/gen_gallery.sh patterns).

## Auction Drive (owner re-share, July 2026)
Parent folder 1un0jIeE_t7284ElQtLV1I2Tw5PrHWyCp; structure: photos=1x0dTHcq3aQwKO4IJybOXSICP917zE7xf (2 entries); photos/cam 1=1kRTsZh80CNOv74SrEFJvXhfcFnSV-AMR (948 files); photos/cam 2=1LAtrFhWqDX_9JR1q8B8WcfJBNRQ363Rb (371 files); videos=1Cm6OZt7Be6ISIEHQfhKXBcsJelcqYjrF (173 entries). List via embeddedfolderview?id=<ID> (public). yt-dlp re-confirmed blocked (bot-check) — owner downloads own videos via YouTube Studio → uploads to this Drive → we pull from Drive.
