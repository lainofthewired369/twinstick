"""Real ICE/DTLS/SCTP transport for the Node game integration test (no TURN)."""
import asyncio, json, sys
from aiortc import RTCPeerConnection, RTCConfiguration

def emit(value):
    print(json.dumps(value), flush=True)

async def main():
    host = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    guest = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    channels = {}
    ready = asyncio.Event()

    def attach(side, channel):
        channels[side] = channel
        @channel.on('message')
        def message(data):
            emit({'event':'message', 'side':side, 'data':json.loads(data)})
        @channel.on('open')
        def opened():
            if len(channels)==2 and all(c.readyState=='open' for c in channels.values()):
                ready.set()

    @host.on('datachannel')
    def incoming(channel):
        attach('host',channel)
        if channel.readyState=='open' and channels['guest'].readyState=='open':
            ready.set()

    attach('guest', guest.createDataChannel('rift-game', ordered=True))
    try:
        await guest.setLocalDescription(await guest.createOffer())
        await host.setRemoteDescription(guest.localDescription)
        await host.setLocalDescription(await host.createAnswer())
        await guest.setRemoteDescription(host.localDescription)
        await asyncio.wait_for(ready.wait(), 15)
        assert host.connectionState == guest.connectionState == 'connected'
        assert ' typ host' in host.localDescription.sdp
        assert ' typ relay' not in host.localDescription.sdp
        emit({'event':'ready','transport':'ICE + DTLS + SCTP','route':'direct host candidates','host':host.connectionState,'guest':guest.connectionState})
        while True:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line: break
            command=json.loads(line)
            if command.get('stop'): break
            channels[command['side']].send(json.dumps(command['data'],separators=(',',':')))
    finally:
        await host.close()
        await guest.close()

asyncio.run(main())
