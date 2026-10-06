# DON'T BLINK — Standalone

A self-contained browser game designed for fast sharing on X.

## Run locally

Just open `index.html` in a modern browser.

For a local server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Deploy

This is a static site. Upload the three files to:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any normal web host

No database or server is required for the current MVP.

## Viral loop

A finished score creates:

`?challenge=87`

The recipient opens that URL and is challenged to beat the score.

The game uses:
- local browser score calculation
- Web Share API when available
- X share fallback
- responsive desktop/mobile UI
- reduced-motion support
- no camera/microphone access
- no account or personal-data collection

## Next production upgrades

1. Add Supabase for global leaderboard.
2. Add signed challenge/result IDs so scores cannot be trivially edited.
3. Add daily challenge mode.
4. Generate OG share images dynamically.
5. Add analytics with privacy-conscious aggregate events.
6. Add a custom domain.
