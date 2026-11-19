# Hash Brown Catch — Crunch Club

A pixel-art breakfast arcade: catch golden hash browns, dodge burnt bites and bombs, and customize your potato.

**[▶ PLAY ONLINE](https://sd5913.github.io/Hash-Brown-Catch/game/)** · [English](https://sd5913.github.io/Hash-Brown-Catch/game/?lang=en) · [Simplified Chinese](https://sd5913.github.io/Hash-Brown-Catch/game/?lang=zh) · [Traditional Chinese](https://sd5913.github.io/Hash-Brown-Catch/game/?lang=zh-HK) · [Italian](https://sd5913.github.io/Hash-Brown-Catch/game/?lang=it) · **[PROJECT RECORD](docs/project-record.md)** · [Team board](https://github.com/orgs/sd5913/projects/6)

## The game

Six-stage Career, solo and same-screen VS/co-op, adjustable arcade difficulty, permanent local coins, a full cosmetic shop, pixel avatars and a local Hall of Fame. Switch among English, Simplified Chinese, Traditional Chinese and Italian using the language button in the header or a dialog.

- Move with mouse/touch, arrows or A/D. Space/P pauses; ESC exits; R replays from results.
- Golden catch: +10 score and +2 coins. Miss: -2; burnt catch: -10; bomb: -20. Score never drops below zero.
- Two-player: P1 uses A/D; P2 uses arrows or mouse. VS includes basket bumps; alternating co-op catches earn +5 relay score.
- Saves and rankings stay in the current browser. House targets are demo benchmarks.

Current release: **19 November 2026**. Imported from the supplied complete build, originally packaged under a 3 December review folder. The release date does not change Git commit history.

- Career: Street Stall → Wallace → Burger King → McD → KFC → Blue Frog, with promotion targets, wage multipliers, bonuses and unlockable backgrounds.
- Upgrade catcher width, an automatic second catcher, magnet strength and chef skills using earned coins.
- Clocks add 5 seconds (15 extra maximum per round) and trigger golden-only Fever; coffee slows drops; cola provides a shield. The rare Spud Imp doubles round coins.
- Shop selections apply immediately. Manual backgrounds survive reload until a Career stage change restores the stage backdrop.
- Existing Stage 03 wallet, avatars and local scores migrate when a new-version save does not yet exist. Career upgrades start separately.

[Player guide](https://sd5913.github.io/Hash-Brown-Catch/game/delivery.html). Automated logic and localization checks are recorded below; full browser/device retesting remains outstanding.

## Screenshots

The first three images show the earlier prototype captured on 16 November 2026. The later team-supplied images illustrate ranking, Career and scene customization; they are retained as development evidence.

### Breakfast arcade

![Crunch Club game menu and difficulty selection](docs/images/01-game-menu.jpg)

The diner interface, game menu and difficulty selection.

### Same-screen multiplayer

![Two-player game with separate baskets and score displays](docs/images/02-local-multiplayer.jpg)

Two players share one screen, with separate baskets and score displays.

### Pixel Avatar Studio

![Pixel Potato Avatar Studio with character presets and palette controls](docs/images/03-pixel-avatar.jpg)

Character presets, pixel preview and palette controls for personalized potatoes.

### Top Potato Leaderboard

<img width="782" height="644" alt="image" src="https://github.com/user-attachments/assets/681f8abb-f6a2-4174-8db8-5078e9d8ff03" />

Local player rankings and clearly labeled sample targets.

### Promotion mode

<img width="1263" height="776" alt="image" src="https://github.com/user-attachments/assets/69795b3d-324d-4dd6-8f60-0e918d51fe6d" />

Choose the promotion mode and challenge to enter high-end restaurants from street stalls.

### Switch to new scenes

<img width="835" height="699" alt="image" src="https://github.com/user-attachments/assets/bf101372-79a3-4648-a473-d5e8b311318b" />

Spend earned coins on backgrounds and equip them in the Shop.

## Team and development

| Member | GitHub | Focus |
| --- | --- | --- |
| CHEN Yueru (Crystal) | [@Crystalll0](https://github.com/Crystalll0) | Visual direction, prototyping, coordination, GitHub updates, website visual refinements and typography adjustments |
| MA Qianran (Renna) | [@maqianran](https://github.com/maqianran) | Internal testing and player feedback |
| LI Jiarui (Sherry) | [@SherryLi919](https://github.com/SherryLi919) | Game concept and interaction exploration |

**[Read the project record](docs/project-record.md)** for the dated timeline, design decisions, team contributions, feedback, review snapshots, known issues and next steps, all on one page. AI assisted with code implementation; team roles are documented separately from commit authorship.

## Run locally

Download and extract [the repository ZIP](https://github.com/sd5913/Hash-Brown-Catch/archive/refs/heads/main.zip). In the repository root:

- macOS/Linux: `python3 Launch-Game.py`
- Windows: `py -3 Launch-Game.py`

Python 3 and a modern browser are required. Keep the terminal open; Ctrl+C stops the server. Do not open the HTML with file://. All runtime assets are bundled; no npm installation or API key is needed.

## Repository guide

| Location | Purpose |
| --- | --- |
| `game/` | Playable game, source, assets and rule-check scripts |
| `docs/project-record.md` | Consolidated development and assessment record |
| `docs/credits.md` | Asset sources, AI assistance and licenses |
| `docs/tests/` | Automated check results |
| `docs/import-manifest.json` | Original source-import provenance |
| Root launch files and `index.html` | Local startup and online entry |

Optional checks: from `game/`, run `node check-stage.cjs`, `node check-rules.cjs`, `node check-progression.cjs`, `node check-innovations.cjs` and `node check-i18n.cjs`. See [recorded output](docs/tests/automated-results.txt) and [credits](docs/credits.md).

Final course deadline: **6 December 2026, 23:59 HKT**.

