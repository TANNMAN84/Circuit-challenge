# Circuit Disarm

An interactive, 100% client-side educational circuit puzzle game designed for Years 7–10 Science classrooms (Australian English, zero external APIs or backend required).

## Features
- **10 Progressive Circuit Missions** covering series & parallel switches, short-circuit protection, Ohm's Law (`V = I × R`), fuses, energy efficiency, and one-way diodes.
- **3 Selectable Mission Worlds**: *Locked Evidence Case*, *Deep-Sea Sub Rescue*, and *Outback Solar Station*.
- **Hybrid Hardware Panels**: Visual **Wired Bays** for introductory circuits (Missions 01–04, 07) and clean industrial **Switchboards** with unlockable bolted sub-panels for complex multi-branch circuits (Missions 05, 06, 08–10).
- **Highlighted Inline Check Zones** (Missions 06–10) for 1-tap live Voltage (`V`) and Current (`A`) readings directly on the panel.
- **Confidence Countdown Timer** (*No Timer*, *Learner*, *Standard*, *Extreme*) with retro red 7-segment display.
- **Print-Ready A4 Circuit Map Sheets** (Page 1 student sheet + optional Page 2 Teacher Answer Key when Teacher Mode is unlocked; default Teacher PIN: `2026`).

## Publish to GitHub Pages

This project is pre-configured with relative asset paths (`base: './'`), `.nojekyll`, and an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

1. Create a new repository on GitHub and push this project to the `main` branch.
2. In your GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Push any commit to `main` (or click **Run workflow** under the **Actions** tab). Your live app will publish automatically at:
   `https://<your-username>.github.io/<your-repo-name>/`

## Local Development

```bash
npm install
npm run dev      # Start dev server on http://localhost:3000
npm run lint     # TypeScript type-check
npm run build    # Build static site into dist/
npm run preview  # Preview the production dist/ bundle locally
```
