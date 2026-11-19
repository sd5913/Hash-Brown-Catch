# Project record
Updated: 2026-11-19 · [Play online](https://sd5913.github.io/Hash-Brown-Catch/game/) · [Team board](https://github.com/orgs/sd5913/projects/6)

This page brings together the team's development history, responsibilities, design decisions, feedback and next steps. Dates refer to actual discussions where available; review targets and source-import dates are separate.

## Contents

[Current build](#current-build) · [Team](#team) · [Development timeline](#development-timeline) · [Feedback and open issues](#feedback-and-open-issues) · [Review snapshots](#review-snapshots) · [Next steps](#next-steps) · [Technical notes](#technical-notes)

## Current build

The 2026-11-19 release imports the supplied complete game originally packaged as Stage-05 / Final Review. It includes six Career kitchens, four upgrade tracks, automated catching, magnet attraction, chef bonuses, the full cosmetic shop, pixel avatars, local ranking, solo and same-screen VS/co-op, clock Fever, coffee, cola and the rare double-coin Spud Imp.

English, Simplified Chinese, Traditional Chinese and Italian are available during play, including menus, dialogs, dynamic HUD text, canvas labels and the player guide. Language choice is stored locally and does not restart the round. Game rules and browser-local saves are shared across all four language settings.

The shop renderer applies a manual scene immediately and remembers that choice across reloads. Selecting or advancing to another Career stage restores the stage setting. Automated checks cover the source logic; a visual browser retest of purchase, equip and reload remains to be recorded.

### Release and iteration labels

| Display date | Iteration label | Scope |
| --- | --- | --- |
| 2026-11-12 | Complete round | Catch/avoid rules, difficulty, results and replay |
| 2026-11-15 | Wallet and feedback | Persistent coins, cosmetic choices and progression proposals |
| 2026-11-17 | Career integration | Restaurant progression, upgrades and customization refinements |
| 2026-11-19 | Initial bilingual release | Imported complete scope, live language switch, full scenes and updated guide |
| 2026-11-19 | Localization update | Added Traditional Chinese and Italian options to the game and player guide |

These intermediate display dates were supplied by the team for its iteration presentation. They are not backdated commits or independent evidence that every listed feature was implemented on that date. Existing discussion dates below and archived source branches remain intact.

## Team

| Member | GitHub | Responsibilities and recorded contributions |
| --- | --- | --- |
| CHEN Yueru (Crystal) | [@Crystalll0](https://github.com/Crystalll0) | Visual direction, prototype preparation, coordination, integrating suggestions, sharing playable alternatives and identifying the skin issue. |
| MA Qianran (Renna) | [@maqianran](https://github.com/maqianran) | Internal playtesting, inviting additional players, gameplay feedback, early potato-dog suggestion and confirming the skin issue. |
| LI Jiarui (Sherry) | [@SherryLi919](https://github.com/SherryLi919) | Initial game brief, concept and interaction extensions, character experiments, sharing feedback and the optimized package, and initial goal-card preparation. |

Code was generated with AI assistance; the team directs, reviews and tests the work. This role table describes reported work, not independent code authorship inferred from commits. Add individual issue, change and retest links as work proceeds. External IP references remain exploratory; no partnership is claimed.

## Design decisions

Crunch Club uses a red-and-cream breakfast diner, golden elongated hash browns and simple expressive faces. Earlier dense surface flecks were reduced after visual critique; broad highlights and toasted edges make the character clearer.

Caught potatoes accumulate in the basket/plate; misses become mash and drifting ghosts. These visible outcomes give catching and missing a playful identity. The persistent wallet and cosmetic shop respond to limited motivation from round-only scores. Pixel avatars, local ranking and same-screen play explore personalization and social replay. Their effect on enjoyment or retention still needs player evidence.

## Development timeline

### 2026-10-22 — Concept and visual exploration

- Crystal initiated the topic discussion and proposed a cute pixel-art cooking direction.
- Renna suggested a website as a manageable format and responded to the visual and gameplay ideas.
- Sherry proposed a hash-brown mini-game: move a draining basket horizontally to catch falling food and earn points inspired by its price.
- Sherry developed the initial brief: increasing falling speed, crunchy catch feedback, missed potatoes turning into sad mash with a ghost face, a timer and replay.
- Crystal proposed sad mashed potatoes as a visible failure state and shared several visual studies, including a red-and-cream diner, a softer breakfast kitchen and a minimal character-focused direction. These were alternatives, not successive completed game releases.
- Renna suggested a potato-dog character; Sherry proposed using it as an occasional double-coin surprise. This records the origin of the idea, not a verified implementation date.
- Initial planning mentioned p5.js / p5.play and course topics covering input, animation and sound. This is a planning record, not a claim that both libraries are used by the current build.

### 2026-10-28 — Playable prototypes and replay motivation

- Crystal reported several prototype revisions, shared two playable alternatives and proposed spending earned coins on cosmetic skins.
- Shared screens showed the diner setting, a round result, difficulty controls, accumulated catches and a potato-dog concept page.
- Renna confirmed access to the shared prototype, supplied a gameplay screenshot and reported encountering the potato-dog surprise. This was internal team testing; device and browser were not recorded.
- Crystal shared two demonstration videos. Their sharing date does not establish when every represented feature was implemented.
- Team reactions supported the playful visual direction. These informal reactions are not an external usability study.

### 2026-11-02 — Shared planning

- Crystal shared the group Project board created from the course template.
- Sherry and Renna confirmed they could access it.
- Sherry reported completing the initial goal / Definition of Done card.

### 2026-11-12 — Feedback and interaction proposals

- An external player's written feedback described the mini-game as complete but simple and found the cosmetic choices insufficiently differentiated, particularly color-based flavor variants.
- A separate relayed exchange raised difficulty locating the playable entry inside the delivery materials. The team distinguished packaging/navigation clarity from understanding the game itself. The available screenshots do not establish whether this was a different participant.
- Sherry proposed a temporary larger basket. Crystal noted that a larger collision area could also increase accidental bomb catches at higher difficulties and suggested a smaller-basket option.
- Sherry suggested clearer, large countdown feedback around timed effects after reporting that the clock interaction felt abrupt. The exact clock behavior was not verified in the conversation.
- Sherry explored a meme-character variant and shared an HTML file and package. Crystal proposed a mystery/random character selection; Renna supported the surprise-selection idea.
- Sherry shared image-to-pixel experiments. These demonstrate exploration, not external IP partnerships.
- Sherry summarized candidate improvements: same-screen multiplayer, customizable characters, ESC exit and a prominent countdown, and planned another prototype.
- Crystal shared updated review-board entries covering replay motivation, the coin shop, testing roles and a leaderboard suggestion. These are team-entered summaries; direct tutor wording is not available in the supplied conversation.

### 2026-11-15 — External progression suggestions

An external contact suggested earning coins to upgrade collecting containers, increasing challenge, automation, multiple collectors and stage progression. Restaurant-themed career progression was also discussed.

The team identified a tradeoff: larger collectors make both rewards and hazards easier to catch. These remain exploratory suggestions, not approved scope or completed features. The screenshots show an original exchange dated 2026-11-15; it was forwarded to and discussed by the team on 2026-11-16.

### 2026-11-16 — Optimized prototype and follow-up

- Sherry shared an optimized prototype package.
- Crystal tried the two-player mode and clarified that both players use the same computer, with keyboard and mouse controls. This is local same-screen multiplayer; the conversation does not establish online networking.
- Sherry forwarded the progression suggestions; Crystal proposed a hash-brown career theme and Renna supported exploring upgrade items. No implementation was confirmed.
- Crystal reported that a purchased skin did not appear to apply. Renna independently reported trying it and observing the same problem.
- The team later entered a 17 November fix/retest report (see the feedback table). The original 16 November screenshots do not establish the affected item, browser or exact reproduction steps.



### 2026-11-16 — Publication and documentation

GitHub Pages was enabled and the live game was started successfully. A direct Play link was added to the repository homepage. Development and feedback notes were consolidated into this page for easier assessment. Publication itself was not a skin fix. See the later team report and the 19 November source update.

## Feedback and open issues

Compiled on 2026-11-16 from supplied conversation screenshots. These are retrospective informal records, not controlled usability sessions. Private screenshots, names and chat handles of external contacts are omitted. Participant totals are not inferred from message counts; the same external contact may appear on multiple dates. Devices, browsers and exact build identifiers were not supplied.

| Date | Source | Recorded observation or suggestion | Response / status |
| --- | --- | --- | --- |
| 2026-10-28 | Renna, internal team play | Opened the shared prototype, shared a gameplay image and reported encountering the potato-dog surprise. | Supports access and informal feature exposure on that occasion; no device-wide compatibility claim. |
| 2026-11-12 | External contact A | The basic mini-game appeared complete but simple; skins seemed differentiated mainly by color. | Consider more recognizable cosmetic designs and replay depth. No validated improvement recorded. |
| Date not independently visible; shared with the 2026-11-12 discussion | Relayed external exchange | Finding the playable entry within the delivery materials could be difficult, even when the game itself was understandable. | Simplify delivery navigation and test independent startup. Participant identity overlap is unknown. |
| 2026-11-12 | Sherry, internal team play | The clock interaction felt abrupt; suggested prominent countdown feedback. | Proposal recorded; no verified cause or before/after retest in the conversation. |
| 2026-11-15; forwarded to team 2026-11-16 | External progression feedback | Suggested container upgrades, coin progression, automation, more collectors and staged restaurant progression. | Exploratory backlog. Team noted larger baskets also increase hazard exposure. |
| 2026-11-16 | Crystal, internal team play | Tried the two-player prototype and described separate controls on one computer. | Record as local same-screen multiplayer. |
| 2026-11-16 | Crystal and Renna, internal team play | Purchased skin did not appear to apply; Renna reported the same outcome after trying it. | Original defect report; see the later team-entered retest and current release notes. |
| 2026-11-17 | Sherry, internal team work | Fixed the skin purchase/equip failure; external players invited to playtest. | Team-reported fix and successful retest. Device, browser and tested cosmetic were not recorded; this is not an independent verification. |


### Follow-up: purchased skin not visibly applied

- Report date: 2026-11-16.
- Reporters: Crystal and Renna.
- Expected: purchasing/equipping an owned cosmetic visibly changes the appropriate game element.
- Reported actual behavior: the selected skin did not appear to apply.
- Still needed: affected build, cosmetic item, purchase/equip steps, game mode, browser, reload behavior and saved state.
- Next verification: reproduce, distinguish ownership from equip state, verify rendering and persistence, and retest the affected item.
- 2026-11-17: team-entered report says the issue was fixed and retested; supporting reproduction detail remains incomplete.
- 2026-11-19: imported the complete renderer and added persisted manual scene selection. Automated checks pass; live visual purchase/equip/reload retesting remains pending.



## Review snapshots

These are prepared source scopes imported in sequence on 2026-11-16, not backdated development commits. Branches preserve source comparisons. Review labels alone do not prove a meeting occurred.

| Review target | Scope | Source |
| --- | --- | --- |
| 2026-11-05 | Gentle 30-second core interaction: movement, catch +10, miss -2 (minimum zero), animation, audio, mash/ghost feedback, pause and replay. No hazards or wallet UI. | [Core snapshot](https://github.com/sd5913/Hash-Brown-Catch/tree/review/core-interaction) |
| 2026-11-12 | Complete round, burnt bites, bombs, five difficulty choices, acceleration, results and personal bests. | [Integrated snapshot](https://github.com/sd5913/Hash-Brown-Catch/tree/review/integrated-core) |
| 2026-11-19 | Complete Career, upgrades, shop, powers, avatars, local ranking, same-screen play and selectable English/Chinese UI. Superseded by the complete bilingual release on the same displayed review date. | [Current source](https://github.com/sd5913/Hash-Brown-Catch/tree/main/game) |

### Review feedback

[Repository Issue #1](https://github.com/sd5913/Hash-Brown-Catch/issues/1), dated 2026-11-15, reported an empty repository and requested a clear concept/audience, runnable interaction, setup, accessible planning, ownership, credits and anonymous playtest evidence with a resulting change.

The subsequent import provides source, setup, snapshots and checks; publication adds a direct playable entry. These do not complete all human testing or establish each person's authorship. Earlier team-entered review summaries mention replay motivation and a player leaderboard. Direct earlier tutor wording is not available in the supplied conversations.

## Next steps

| Action | Lead / review focus | Completion evidence |
| --- | --- | --- |
| Retest the reported skin purchase/equip fix | Crystal: UI clarity; Renna: reproduction/regression; Sherry: concept consistency | Affected build/item, steps, before/after result and dated retest |
| Test independent startup and a complete round | Renna coordinates; Crystal reviews instructions | Device/browser, tasks, help needed and observations |
| Evaluate customization and replay motivation | Sherry coordinates concept review; team discusses | Player reasons, priority decision and any resulting change |
| Record the 2026-11-19 review | All three, coordinated in the board | Actual tutor feedback, next owner and action |

### Next playtest

1. Give a non-team player the repository README and observe whether they find and start the live game without coaching.
2. Observe catch/avoid recognition, movement, pause, exit and replay.
3. Check score versus coins, purchasing, equipping and reload persistence.
4. Try an avatar preset or a voluntarily chosen photo, then same-screen VS/co-op on desktop.
5. Ask what the local leaderboard means and why they would or would not replay.
6. Record an anonymous ID, actual date, build, device/browser, help needed and a concrete observation; assign a change and retest it.

A small group of 3–5 is a planning suggestion, not a claimed completed sample. Do not publish participant photos or private identities.

### Completion criteria

Another person can start from the README; rules and feedback match the game; purchase/equip/persistence work; house targets are labeled; an external player observation leads to a documented decision and, where a change is made, a verified retest.

## Technical notes

- Implementation: p5.js, plain JavaScript and Web Audio; p5.play is not required. Runtime assets are included.
- Local setup: Python 3 serves the game; Node.js is optional for checks. No runtime AI service, API key or backend is needed.
- Controls: solo uses pointer/touch, arrows or A/D; P/Space pauses, ESC exits, R replays from results. Same-screen modes are primarily for desktop.
- Saves are browser/origin-specific; there are no accounts, cloud saves or networked multiplayer. Clearing storage or changing origin/port affects saves.
- Hall of Fame is local. House targets are seeded examples, not participant scores; cross-difficulty competitive balance is not validated.
- Photos are processed client-side and optional pixel portraits stored locally.
- Wider keyboard, touch, layout, audio and persistence compatibility remains to be tested. Automated logic checks do not establish usability.
- Course mapping: input, sprites/frame selection and audio are in game/game.js; pure rules in game/game-core.js; avatars/ranking in game/arcade.js; coins/shop in game/economy.js and game/shop.js.
- [Automated check output](tests/automated-results.txt): rerun from game/ with node check-stage.cjs, node check-rules.cjs, node check-progression.cjs, node check-innovations.cjs and node check-i18n.cjs.
- [Credits and licenses](credits.md).

The original source-import manifest is retained in docs/import-manifest.json for provenance. The final course deadline is 2026-12-06 at 23:59 HKT; this is not a claim of final submission.

## 2026-11-19 source integration

The user-supplied local Stage-05 folder was copied into the current game, including all nine background images and bundled runtime/font licenses. The original folder name is provenance, not the live release date. UI source copy was normalized to English; an embedded Chinese dictionary and dynamic-message rules supply the alternate interface. This work does not add new playtest participants or claim the 3 December review has occurred. Browser screenshots in the README retain their original captions/dates.

