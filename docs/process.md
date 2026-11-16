# Development process

This retrospective was compiled on 2026-11-16 from team-supplied conversation screenshots. Dates describe discussions and shared outputs, not Git commit dates. Times are omitted. Original private conversations and images are not published. Proposals, informal feedback and implemented work are distinguished below.

## 2026-10-22 — Concept and visual exploration

- Crystal initiated the topic discussion and proposed a cute pixel-art cooking direction.
- Renna suggested a website as a manageable format and responded to the visual and gameplay ideas.
- Sherry proposed a hash-brown mini-game: move a draining basket horizontally to catch falling food and earn points inspired by its price.
- Sherry developed the initial brief: increasing falling speed, crunchy catch feedback, missed potatoes turning into sad mash with a ghost face, a timer and replay.
- Crystal proposed sad mashed potatoes as a visible failure state and shared several visual studies, including a red-and-cream diner, a softer breakfast kitchen and a minimal character-focused direction. These were alternatives, not successive completed game releases.
- Renna suggested a potato-dog character; Sherry proposed using it as an occasional double-coin surprise. This records the origin of the idea, not a verified implementation date.
- Initial planning mentioned p5.js / p5.play and course topics covering input, animation and sound. This is a planning record, not a claim that both libraries are used by the current build.

## 2026-10-28 — Playable prototypes and replay motivation

- Crystal reported several prototype revisions, shared two playable alternatives and proposed spending earned coins on cosmetic skins.
- Shared screens showed the diner setting, a round result, difficulty controls, accumulated catches and a potato-dog concept page.
- Renna confirmed access to the shared prototype, supplied a gameplay screenshot and reported encountering the potato-dog surprise. This was internal team testing; device and browser were not recorded.
- Crystal shared two demonstration videos. Their sharing date does not establish when every represented feature was implemented.
- Team reactions supported the playful visual direction. These informal reactions are not an external usability study.

## 2026-11-02 — Shared planning

- Crystal shared the group Project board created from the course template.
- Sherry and Renna confirmed they could access it.
- Sherry reported completing the initial goal / Definition of Done card.

## 2026-11-12 — Feedback and interaction proposals

- An external player's written feedback described the mini-game as complete but simple and found the cosmetic choices insufficiently differentiated, particularly color-based flavor variants.
- A separate relayed exchange raised difficulty locating the playable entry inside the delivery materials. The team distinguished packaging/navigation clarity from understanding the game itself. The available screenshots do not establish whether this was a different participant.
- Sherry proposed a temporary larger basket. Crystal noted that a larger collision area could also increase accidental bomb catches at higher difficulties and suggested a smaller-basket option.
- Sherry suggested clearer, large countdown feedback around timed effects after reporting that the clock interaction felt abrupt. The exact clock behavior was not verified in the conversation.
- Sherry explored a meme-character variant and shared an HTML file and package. Crystal proposed a mystery/random character selection; Renna supported the surprise-selection idea.
- Sherry shared image-to-pixel experiments. These demonstrate exploration, not external IP partnerships.
- Sherry summarized candidate improvements: same-screen multiplayer, customizable characters, ESC exit and a prominent countdown, and planned another prototype.
- Crystal shared updated review-board entries covering replay motivation, the coin shop, testing roles and a leaderboard suggestion. These are team-entered summaries; direct tutor wording is not available in the supplied conversation.

## 2026-11-15 — External progression suggestions

An external contact suggested earning coins to upgrade collecting containers, increasing challenge, automation, multiple collectors and stage progression. Restaurant-themed career progression was also discussed.

The team identified a tradeoff: larger collectors make both rewards and hazards easier to catch. These remain exploratory suggestions, not approved scope or completed features. The screenshots show an original exchange dated 2026-11-15; it was forwarded to and discussed by the team on 2026-11-16.

## 2026-11-16 — Optimized prototype and follow-up

- Sherry shared an optimized prototype package.
- Crystal tried the two-player mode and clarified that both players use the same computer, with keyboard and mouse controls. This is local same-screen multiplayer; the conversation does not establish online networking.
- Sherry forwarded the progression suggestions; Crystal proposed a hash-brown career theme and Renna supported exploring upgrade items. No implementation was confirmed.
- Crystal reported that a purchased skin did not appear to apply. Renna independently reported trying it and observing the same problem.
- The skin issue remains open in this record. The exact prototype, item, browser, reproduction steps, cause and successful fix are not yet established.

## Current follow-up

1. Identify the affected skin build, reproduce purchase/equip behavior and record a verified fix and retest.
2. Make the game entry and setup instructions easy to find.
3. Evaluate cosmetic differentiation and replay depth with players before expanding the feature list.
4. Keep proposed progression and basket-size changes separate from implemented scope.

See [feedback records](playtest/results.md), [iteration scope snapshots](iterations.md) and [team roles](team-contributions.md).
