# Hash Brown Catch — Crunch Club

An English pixel-art browser game for casual players who enjoy short, playful challenges. Move a fry basket to catch golden hash browns, avoid burnt bites and bombs, and receive immediate visual and synthesized sound feedback. The red-and-cream diner and expressive potatoes make the interaction easy to recognize and playful to revisit.

## Current increment

**Playtest-ready optimized prototype.** Solo and same-screen VS/co-op; hazards and difficulty; permanent local coins and a starter cosmetic shop; photo-to-pixel avatar customization; a browser-local Hall of Fame; final countdown and quick exit.

Review scope: **19 November 2026**. Source imported on **16 November 2026**, not backdated to the review target. The 19 November meeting and its playtest findings are not yet completed records.

## Run the game

Prerequisites: Python 3 for local hosting and a modern browser. All runtime assets, including p5.js, backgrounds and the font, are included. No npm installation, API key or backend secret is required.

1. Download this repository with **Code → Download ZIP**, then extract it completely, or clone it.
2. Open a terminal in the extracted repository root.
3. On macOS/Linux run `python3 Launch-Game.py`; on Windows run `py -3 Launch-Game.py`.
4. The browser opens automatically. Keep the terminal open; press Ctrl+C to stop.

Alternatively, from the repository root run `python3 -m http.server 8000` (Windows: `py -3 -m http.server 8000`) and open **http://localhost:8000/game/**. VS Code Live Server can also serve the root. Do not open the HTML using file://. Use another port if 8000 is occupied; browser saves are origin/port-specific.

The source and local run instructions are the reproducible assessment handoff. No live deployment is claimed by this import. Download the current source at [GitHub ZIP](https://github.com/sd5913/Hash-Brown-Catch/archive/refs/heads/main.zip).

## Controls and feedback

- Solo: mouse/touch drag, arrows or A/D to move. Space/P pauses. Audio starts after a user gesture; the music button mutes it.
- Golden catch: +10 score; miss: −2; minimum score 0. Burnt catch: −10 and bomb catch: −20 where hazards are enabled. Dodging hazards costs nothing.
- Catches remain in the basket/plate; misses produce mash and ghosts. A new round clears the round collection.
- Same-screen play: P1 uses A/D; P2 uses arrows or mouse. VS allows basket bumps. Co-op alternating catches earn +5 relay score. These modes are intended primarily for desktop keyboards.
- Pixel Face: choose a preset or upload a portrait for local 24×24 conversion. Hall of Fame saves local scores with the chosen pixel face; HOUSE TARGET entries are demonstration benchmarks.
- Each normal catch earns 2 wallet coins. Starter unlocks: Strawberry Social 120, Ketchup Cutie 60 and Minty Phantom 60. Cosmetics do not change collision or scoring. Misses/hazards affect round score only. ESC closes an open modal first or exits to menu; R replays from results.

## Team planning and evidence

| Member | GitHub |
| --- | --- |
| CHEN Yueru (Crystal) | [@Crystalll0](https://github.com/Crystalll0) |
| MA Qianran (Renna) | [@maqianran](https://github.com/maqianran) |
| LI Jiarui (Sherry) | [@SherryLi919](https://github.com/SherryLi919) |

- [Team Project board](https://github.com/orgs/sd5913/projects/6) — confirm tutor visibility and all three members' Write access.
- [Iteration history](docs/iterations.md) and [current scope](docs/current-scope.md).
- [Shared plan and owners](docs/plan.md), [team roles and contribution evidence](docs/team-contributions.md).
- [Design decisions](docs/design-decisions.md), [review feedback and response](docs/review-feedback.md).
- [Automated check output](docs/tests/automated-results.txt) and [platforms/limitations](docs/limitations.md).
- [Playtest plan](docs/playtest/plan.md), [actual observation record](docs/playtest/results.md), [changes and retests](docs/playtest/changes.md). The latter records remain pending where raw evidence is unavailable.

## Checks and course mapping

Node.js is optional for automated verification. From `game/`, run `node check-stage.cjs` and `node check-rules.cjs` and `node check-innovations.cjs`. These are logic/scope checks, not a substitute for another person using the game.

Week 4 input is implemented in `game/game.js`; Week 5 sprites and frame selection are in the same sketch; Week 6 feedback uses synthesized Web Audio. Pure rules are separate in `game/game-core.js`. `game/arcade.js` handles avatar processing and local ranking; `game/economy.js` and `game/shop.js` handle wallet/shop behavior.

## Limitations and credits

Saves are browser/origin-specific. There is no account, cloud save or global authenticated leaderboard. Phone/two-player compatibility and real user observations still need evidence. No user photos, participant identities, credentials or personal save files are included.

See [Credits and AI use](docs/credits.md) and bundled third-party licenses. AI assisted with implementation; team design, review and testing roles are stated separately. Original assets are not assigned a blanket license by publication.

This public repository is owned by **sd5913**. The group-project final deadline remains **6 December 2026, 23:59 HKT**; this upload covers only material appropriate through the **19 November review scope**. Later review packages and the full-prototype reel are not included.
