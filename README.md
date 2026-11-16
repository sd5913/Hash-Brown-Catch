# Hash Brown Catch — Crunch Club

An English pixel-art browser game for casual players who enjoy short, playful challenges. Move a fry basket to catch golden hash browns, avoid burnt bites and bombs, and receive immediate visual and synthesized sound feedback. The red-and-cream diner and expressive potatoes make the interaction easy to recognize and playful to revisit.

## Current increment

**Integrated core experience.** A complete round with hazards, five difficulty choices, increasing difficulty, pause/results/replay and local personal bests.

Review scope: **12 November 2026**. Source imported on **16 November 2026**, not backdated to the review target. This is a preserved imported baseline.

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

## Team planning and evidence

- [Team Project board](https://github.com/orgs/sd5913/projects/6) — confirm tutor visibility and all three members' Write access.
- [Iteration history](docs/iterations.md) and [current scope](docs/current-scope.md).
- [Shared plan and owners](docs/plan.md), [team roles and contribution evidence](docs/team-contributions.md).
- [Design decisions](docs/design-decisions.md), [review feedback and response](docs/review-feedback.md).
- [Automated check output](docs/tests/automated-results.txt) and [platforms/limitations](docs/limitations.md).

## Checks and course mapping

Node.js is optional for automated verification. From `game/`, run `node check-stage.cjs` and `node check-rules.cjs`. These are logic/scope checks, not a substitute for another person using the game.

Week 4 input is implemented in `game/game.js`; Week 5 sprites and frame selection are in the same sketch; Week 6 feedback uses synthesized Web Audio. Pure rules are separate in `game/game-core.js`. 

## Limitations and credits

Saves are browser/origin-specific. There is no account, cloud save or global authenticated leaderboard. Phone/two-player compatibility and real user observations still need evidence. No user photos, participant identities, credentials or personal save files are included.

See [Credits and AI use](docs/credits.md) and bundled third-party licenses. AI assisted with implementation; team design, review and testing roles are stated separately. Original assets are not assigned a blanket license by publication.

This public repository is owned by **sd5913**. The group-project final deadline remains **6 December 2026, 23:59 HKT**; this upload covers only material appropriate through the **19 November review scope**. Later review packages and the full-prototype reel are not included.
