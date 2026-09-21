# Real peer-to-peer integration test

Run from a normal Linux environment with Python 3.11+ and Node 20+:

```sh
python -m venv .rtc-venv
.rtc-venv/bin/pip install aiortc==1.15.0
RR_RTC_PYTHON=.rtc-venv/bin/python node real-rtc-tests.cjs
```

The test runs two independent production game contexts over actual aiortc
RTCPeerConnections using ICE, DTLS and SCTP. Data travels over direct host
candidates. No STUN or TURN server is configured. Signalling is local and the
game's DataConnection API is adapted to this real transport.

Assertions cover host/join handshake, separate ships, remote movement,
replicated game state, remote shopping ownership and checkpoints over 16KB.

This is **not** a browser, PeerJS matchmaking/serialization, cross-Internet NAT,
or iPhone/Safari test. DOM and animation scheduling are stubbed. Those layers
still need independent validation; do not claim they passed from this result.

The managed browser also failed the unmodified official WebRTC data-channel
sample, producing null ICE candidates. The managed local runtime denied network
interface enumeration with PermissionError. GitHub Actions runs the real test
without modifying either environment's security policy.
