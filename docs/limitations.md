# Platforms and limitations

- Current implementation uses p5.js, plain JavaScript and Web Audio; p5.play is not required.
- Local hosting requires Python 3; Node.js is only needed to run automated checks. No API keys, passwords or backend secrets are required.
- Runtime assets are bundled locally. Start through HTTP rather than opening the HTML with file://.
- Solo supports pointer/touch and keyboard. Same-screen two-player modes are designed primarily for a desktop keyboard and have not been validated on phone hardware in this import.
- Coins, cosmetics, portraits, records and the leaderboard stay in the current browser/site origin. They do not sync across devices or with a server; changing ports or clearing site storage changes/removes saves.
- Hall of Fame is a local ranking, not a global or authenticated leaderboard. The three house targets are seeded examples, not real player-study results. Cross-difficulty rankings are not a validated competitive comparison.
- Uploaded photos are processed client-side; optional pixel portraits are saved locally. No participant photos or personal save data are committed.
- Keyboard focus, pointer movement, responsive layout, audio playback and browser-storage behavior still need direct device/playtest evidence. Passing logic checks does not establish usability or clinical/other external effects.
- Future review packages and full-prototype power-up/rare-character releases are outside the current upload scope. Dormant shared rendering/rule helpers may remain, but bonus spawning is disabled in the included review build.
