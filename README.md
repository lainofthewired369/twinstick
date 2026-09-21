# Rift Runners

A static, peer-to-peer twin-stick wave survival game built for GitHub Pages.

## Publish on GitHub Pages

1. Upload the contents of `dist/` to a GitHub repository.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the branch and `/ (root)`, then save.

## Controls

- Player 1: WASD, mouse aim/fire, Space to dash.
- Local Player 2: Arrow keys, numpad 8/4/2/6 aim/fire, Enter to dash.
- Online: Host and joiner exchange the displayed WebRTC offer/answer codes through chat.

Online play is direct WebRTC and needs no game server. The included public STUN servers allow most home-network connections. Some restrictive or symmetric-NAT networks require a TURN relay; that can be added later without changing the game design.
