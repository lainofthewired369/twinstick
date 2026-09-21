# Rift Runners — touch + room-password edition
Play: https://lainofthewired369.github.io/twinstick/

## Two-player online co-op
1. Both players open the game and tap ONLINE P2P.
2. Host leaves the password field blank and taps HOST ROOM to generate a game-only password, or enters a unique password of 8–64 characters.
3. Wait for “Room ready”, then copy and share that password.
4. Friend enters the same password and taps JOIN ROOM. The game starts automatically.

Passwords ignore surrounding whitespace and letter case. Anyone with the password can join; this is a room invitation, not account authentication. Never reuse a real account password. The password is SHA-256-derived into a room identifier; it is not sent as plaintext to matchmaking, but weak passwords remain guessable.

## Touch controls
Left stick moves. Right stick aims and fires while held away from its center.
Tap DASH to evade; cooldown is shown on the button. Multiple fingers work independently.
Landscape is recommended; portrait remains supported without stretching the arena.
Switching apps resets input. If the host backgrounds the game, the team pauses; tap the pause button to resume.

Desktop: WASD + mouse, Space dash. Local player 2 uses arrows + numpad 8/4/2/6, Enter dash. Local co-op is keyboard-based; online supports one touchscreen per player.

## Networking
Pinned PeerJS 1.5.5 is loaded from jsDelivr only when online play is requested.
PeerJS Cloud handles matchmaking/signaling. Gameplay uses an encrypted WebRTC data channel and host-authoritative simulation. The guest sends only input, never positions or health.
Reliable messages synchronize upgrades, wave transitions, pause, death and restart. Host selects upgrades and restarts. Disconnects/timeouts return to the lobby.

This is not guaranteed to connect on every network. PeerJS uses its default ICE configuration; shared service availability and NAT/firewall restrictions can still prevent connections. A dedicated TURN relay would be the next step for reliable restrictive-network/mobile-carrier support. No private TURN credentials are embedded.

## Hosting
Static HTML/CSS/JS, no build step. GitHub Pages publishes main / (root).
