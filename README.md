# Rift Runners (v1.9)
Play: https://lainofthewired369.github.io/twinstick/

## Graphics evolve at waves five, ten and fifteen
There is one game at the main address. The old riftbreak.html link redirects there. Visual preview: https://lainofthewired369.github.io/twinstick/rift-preview.html .

Defeat the boss on wave 5 to fracture reality. Combat and hostile projectiles pause during a three-second transition. Cracks spread over the arena, the scene changes at the midpoint, and a new visual style remains for the rest of the run: faceted ships with engines and visible weapon mounts, armored enemies, a tiled star-lit arena, projectile trails, layered beams and explosions, crystalline loot, spark streaks, and an upgraded HUD/shop theme. This changes presentation, not combat stats or hitboxes. Remaining reinforcements still need to be cleared before shopping.

The host replicates the transition and visual tier; all players receive it in the main game. At wave 10, defeating the boss triggers a second three-second transition into Layer III: real WebGL geometry with raised tiles, extruded ships and enemies, directional lighting, ground shadows and 3D projectiles. Each milestone triggers once per run and all reset on restart. The fixed oblique camera preserves ground-plane aiming and touch controls. WebGL uses a 960×540 drawing surface for phone performance; devices without WebGL render the same lit 3D mesh with a software triangle renderer. If neither renderer is available, enhanced 2D remains playable. Reduced-motion settings replace the crack/light effect with a calm title fade and remove decorative rotation and engine pulsing. The visual preview is separate from gameplay and does not affect saves; its original view is schematic, while the upgraded view uses the actual in-game renderer.

At wave 15, defeating the boss unlocks Layer IV: a tessellated 3D planet rendered at 1280×720 with additional ship detail, a starfield and an atmospheric rim. The camera follows your ship around the globe. Movement and projectiles follow great circles, cross the longitude seam and poles, and use surface distances for enemy pursuit, loot, attacks and collisions. There are no arena walls on the planet. Mouse aiming projects onto the visible surface; touch sticks keep local east/south controls. The planet and its combat state survive host migration.

## Constellation skill tree
Earn one skill point per level in addition to the existing random stat choice. Open SKILL TREE in the shop, or inspect it through CHARACTER & STARTER → PREVIEW SKILL TREE. There are 26 nodes: the core, five branches, and crosslinks between adjacent paths. Pan with touch, zoom with +/−, and tap a node to read its effect. Spend points on a connected path; each ability costs two points after two one-point prerequisite nodes. Points can be saved. Ready players must cancel Ready before buying nodes.

- Storm: damage and critical chance → Arc Relay, chaining hits to two nearby enemies.
- Orbit: firing speed and armor → two Orbiting Blades.
- Impulse: movement and damage → Shockwave Dash.
- Guardian: maximum HP and regeneration → a Repair Drone that heals nearby teammates.
- Arsenal: harvesting and damage → an automatic Missile Drone.
- Each branch ends in a mastery upgrade; crosslinks grant luck and alternate routes.

Skill points, nodes, ability cooldowns and unlocks belong to each ship and reset on a fresh run. They are validated by the host and restored on rejoining or migration. Unlocked abilities contribute to enemy power scaling.

## Build a run
Choose CHARACTER & STARTER before playing. You begin with one Common weapon, level 1, and no materials. Five starter choices are available; all ten weapon types can appear in shops and supply crates. Up to six weapons fire together.

Defeated enemies drop green materials that also award XP. Nearby drops are drawn toward your ship. Tank enemies can drop gold supply crates containing a Common weapon. In co-op, a collected drop rewards every connected player. A crate fills an empty slot, upgrades a matching Common weapon when full, or gives 12 materials. Leftover drops are collected automatically when the wave ends.

## Field shop
After each wave, each player receives a survival bonus plus their Harvesting stat. Downed teammates revive; ships recover health. Spend your own materials on four personal offers: weapons and passive stat items. Shops always roll at least two weapon offers unless locked items occupy those slots.
- Common / Uncommon / Rare / Epic weapons deal 100% / 155% / 230% / 340% base damage. Later waves and Luck improve rarity odds.
- Combine two identical weapons of the same tier into one of the next tier, up to Epic. Combining frees a slot and costs no materials.
- A matching purchase automatically combines when all six slots are full. Other purchases require space.
- Sell extra weapons for materials; you cannot sell your last weapon.
- Lock an offer to preserve it through rerolls and wave transitions. Reroll costs rise with each use and reset each wave.
- Passive items apply permanent-for-this-run stat bonuses, multiplied by their rarity tier.
- Each XP level grants a choice of three stat upgrades at the next shop. Spend all pending choices before Ready.
- All connected players must be Ready before the next wave starts. Cancel Ready to resume shopping. Local co-op uses SWITCH PLAYER to shop for each ship.

Stats include damage, attack speed, maximum health, movement speed, armor, regeneration, luck, harvesting and critical chance. Armor reduces incoming damage; critical hits deal double damage. Run equipment, currency, items and levels reset on restart.

## Character progression
Ranger is available immediately (+10% damage). Clear wave 3 to unlock Scout (+20% speed, +50% pickup range, -20 HP), wave 5 for Bulwark (+40 HP, +4 armor, -15% speed), and wave 8 for Engineer (+8 harvesting, +20 luck, -10% damage).
Unlocks, best cleared wave and highest character level persist in this browser's local storage. They do not sync between devices. Clearing browser data resets them. Unlocks are character options, not permanent damage upgrades.

## Online co-op: up to eight players
Choose your own character and starter before opening ONLINE · UP TO 8.
1. The host enters a unique game-only password (8–64 characters), or leaves it blank to generate one.
2. Share that password with up to seven friends. They select JOIN ROOM.
3. The roster shows each player's number, colour and character. The host selects START RUN once everyone has joined.
4. All players must refresh to v1.9. Local keyboard co-op remains two players.

Every online player has an independent ship, input stream, inventory, upgrades, wallet and shop. The host binds requests to the connection's assigned player ID; a client cannot choose another player's ship. All connected players must mark Ready. Eight colours and numbered ship labels identify the crew. Waves grow with party size above two players; boss health uses 1 + 0.8 × (connected players − 1). Projectile budgets are shared fairly between ships.

### Host migration and rejoining
The host sends full recovery checkpoints twice a second and immediately after important changes, alongside lighter visual updates. If its link is lost, clients first retry that host, then elect a surviving player in player-number order. Combat pauses while the replacement host restores the last checkpoint and rebuilds the party's connections. Ships, purchases, currency, enemies, projectiles, wave progress, difficulty and graphics tier are restored. There can be a small rewind to the last received checkpoint.

A disconnected guest keeps a reserved slot for the current run. Use JOIN ROOM with the same password in the original browser tab (refreshing that tab is supported) to reclaim it. A per-tab session token identifies the ship, including when the original host returns. A living ship gets three seconds of invulnerability after reconnecting. Disconnected players do not block shop readiness or receive new loot. Unused disconnected reservations expire when the host starts a fresh run. New players cannot enter a run already in progress.

The room remembers peer addresses so returning tabs can find the new host; the new host also attempts to reclaim the password directory. Recovery needs at least one surviving browser with a checkpoint and a working peer connection to the replacement host. It cannot restore a run after everyone closes it, recover a lost per-tab token, or bypass a network that blocks WebRTC. No dedicated TURN relay is configured.

## Shared exponential enemy difficulty
At the start of each wave, the host snapshots average team power from equipped weapon DPS, weapon rarity, damage, attack speed, critical chance, projectile count, maximum HP, armor, shields, regeneration and life-steal. Power is normalized to the current wave using the same estimate as boss scaling. Current HP is excluded, and downed teammates still count.

The extra shared multiplier is `S = min(4, 2^(max(0, power - 1) / 2))`. Power 1 or below gives ×1; power 3 gives ×2; power 5 or above gives ×4. All regular enemies, splitter offspring, boss summons and bosses receive ×S health, ×S^0.25 contact/projectile damage (maximum about ×1.41), and ×S^0.15 attack frequency (maximum about ×1.23). Movement, projectile speed and warning durations remain unchanged. Existing boss power and co-op health scaling still apply, so the shared ×4 can stack with the boss's own ×4 health adjustment.

The multiplier stays fixed throughout the wave: loot affects the next wave, and enemies never heal or change strength when a player takes damage. The host replicates the snapshot to the guest. The run HUD displays THREAT ×S. New runs reset it.

## Boss waves
A Rift Warden arrives after the regular enemies finish spawning on every fifth wave (5, 10, 15…). It cycles through five-shot aimed volleys, 16-shot rings and nine-shot fans, warning before firing. Below half health it fires faster and rings grow to 20 shots. It periodically summons runners and gunners. Defeating it grants a guaranteed weapon crate plus bonus materials and XP; all remaining enemies must also be defeated to open the shop.

Boss scaling snapshots the team's equipped weapon damage, rarity, attack speed, critical chance and projectile count, plus maximum HP, armor, shields, regeneration and life-steal when the boss spawns. This adjusts a wave-scaled baseline, with separate party-size health scaling. Loadout pressure is capped at 4× health, 1.3× attack frequency and 1.35× projectile damage. Warnings stay 0.8 seconds. The snapshot stays fixed for that encounter; it does not change when players take damage or pick up a weapon. The boss HUD shows its health multiplier.

## Afterburn interface and enemies
Landscape phones use a compact header, safe-area-aware sticks, a compact run HUD, and a split shop with persistent Ready/Reroll controls. Market, Weapons, Augments and Ship Stats have separate tabs; each content area scrolls independently. Portrait remains supported. A dark navy, mint and violet interface replaces the earlier stacked panels.

Eight regular enemy types: drones, tanks, fast runners, ranged gunners, telegraphed charging enemies, splitters that release three small swarm enemies, and durable spread-firing sentinels. New types enter from waves 2 and 4. Silhouettes and colors distinguish threats.

## Random augments
Each new shop roll has two weapons and two random augments, respecting locks. Augments have the same four rarities as weapons, with bonuses and trade-offs multiplied by rarity tier. Installed augments are listed in the Augments tab.

| Augment | Common-tier effect |
|---|---|
| Longshot Scope | +15% range |
| Tractor Coil | +35 pickup range, +2 harvesting |
| Ceramic Plating | +3 armor, −4% speed |
| Unstable Reactor | +25% damage, −10 maximum HP |
| Belt Loader | +20% attack speed, −5% damage |
| Nanite Garden | +10 HP, +0.4 HP/s |
| Vampire Circuit | Heal 2% of dealt damage, capped at 12% |
| Cryo Rounds | Hits slow 12% for one second, capped at 50% |
| Phase Drill | +1 projectile penetration, capped at +8 |
| Aegis Battery | +15 shield; regenerates after four seconds unharmed |
| Vector Thrusters | +5% speed, 10% shorter dash cooldown |
| Hunter Chip | +7% critical chance, capped at 80% |
| Salvage Heart | Heal 1 HP per kill |
| Ore Scanner | +15% pickup materials |
| Neural Link | +20% pickup XP |
| Blast Lens | +20% rocket blast radius |
| Scrap Printer | +6 harvesting |
| Lucky Comet | +15 luck, +3 pickup range |
| Prism Splitter | +1 projectile, −12% damage |
| Redline Core | +20% damage below half HP |

Range and blast radius cap at 2.5×, projectile count at 7, speed at 100–480, max HP has a floor of 25, and dash cooldown has a floor of 0.35 seconds. Shields regenerate 15% of maximum per second. Economy bonuses apply on collection; survival/harvest payouts are separate.

Passwords ignore letter case and surrounding whitespace. Anyone with the password can join; never use an account password. Each of up to eight online players controls their own ship, wallet, shop, XP upgrades and inventory. The host validates transactions, including phase, price, capacity, matching tiers and state revisions. Guests send requests, not authoritative stats. The host controls restarting a run.

## Controls
Touch: left stick moves; right stick aims and fires. Tap DASH to evade. Landscape recommended; shopping panels scroll on phones.
Desktop: WASD + mouse, Space dash. Local player 2: arrows + numpad 8/4/2/6, Enter dash. Online supports one touchscreen per player; local co-op requires a keyboard.
Switching apps clears inputs. If the host backgrounds active gameplay, the team pauses; tap Pause to resume.

## Networking and hosting
Static HTML/CSS/JS; GitHub Pages publishes main / (root). PeerJS 1.5.5 loads from jsDelivr when requested. PeerJS Cloud provides matchmaking; WebRTC carries host-authoritative gameplay. Shared service availability and NAT/firewall restrictions can still block connections. A dedicated TURN relay is not configured, so not every mobile carrier or restrictive network is guaranteed to connect.

This is an original Brotato-inspired game, not a full port or a copy of its content.

## Validation
Run `node tests.cjs` from the repository root. Tests cover economy, leveling, combining, locked offers, capacity, transaction replay, eight-player readiness, host migration, rejoining, skill paths and abilities, spherical movement and collisions, shared loot, character stats, all ten weapon attacks, and guest transaction ownership. Simulated networking tests do not prove Internet reachability on every network.


### v1.10 — planet controls and late-wave combat
The planet is 58% larger on screen. Each ship transports its camera orientation continuously across poles; stick movement stays screen-relative. Wave 8 onward adds rising enemy health and attack pressure (1.8× at wave 15). Wave 10 introduces Lancers with 1.15-second dim aim lines and 0.65-second damaging beams. Wave 12 adds tank/splitter fire and gunner spreads; wave 15 adds sentinel five-shot spreads, boss secondary rings and boss beams. Projectile enemies have no laser aim tells. Upgrade choices fill the shop until all pending picks are spent. Fullscreen enters on tap and hides its button only after success; exiting restores it. Browser support required. All players should refresh to v1.10 before joining.

### v1.11 — desktop and gamepad controls
WASD move; mouse aim; left mouse fire; Space/Shift dash; Escape/P pause. Mouse picking updates continuously on the moving planet. Standard-mapped gamepads: left stick move, right stick aim and auto-fire, RT fire with last aim, A/LB dash, Start pause. D-pad/left stick navigates menus, A confirms, B returns where a Back control exists. Analog sticks have a radial 18% deadzone. For local co-op, one controller drives player 2 alongside keyboard player 1; two controllers drive players 1 and 2. Online players each use their own keyboard, touch or controller. Press a controller button to let the browser detect it.

### v1.11.2 — connection handling
Explicit UDP and TCP routes to the existing PeerJS shared TURN service; additional Cloudflare STUN discovery. Binary transport uses PeerJS chunking, avoiding JSON's 16KB message limit for game checkpoints. Join first checks the current room directory before stale saved host addresses. Missing hosts advance immediately to fallback addresses. Host rejection messages survive channel closure. Network diagnostics distinguish signalling, gathering and candidate types without logging IPs or credentials. These changes do not provide a dedicated TURN/TLS 443 service; restrictive networks may still need one.

### v1.12.0 — adaptive rival

Bosses on waves 10, 15, 20 and every fifth wave thereafter learn from observed ship positions. Bounded running averages track speed, preferred distance and orbit direction per player. Rivals pressure stationary ships, intercept habitual circling, retreat from close-range play, and favour isolated targets with a target-switching bias to avoid jitter. Visible bullet observations trigger occasional evasive movement; sudden ship displacement can provoke an aimed volley. No player input is read. Decisions sample every 350 ms, use a previous position, and cap prediction at 0.6 seconds; attack aim locks during windup. Existing damage, boss scaling, attack warnings and rewards remain. The boss HUD names its current tactic. This is lightweight adaptive game AI, not a hosted language model or neural-network training service. Memory carries between boss encounters and through host checkpoints within one run, then resets on a new run.

### v1.13.0 — mirror rivals, larger planet and survival pressure

The planet has twice the physical radius (2,560 travel units around the equator) at the same camera size. Ships, enemies and their collision footprints appear roughly half as wide. Surface area is quadrupled; screen-relative steering and normal movement speeds are preserved.

Wave 5 keeps the Warden. Bosses on waves 10, 15, 20 and every fifth wave thereafter copy the strongest connected player's character, weapons and rarity, damage modifiers, armor, shield and combat augments. Strength is ranked by estimated weapon DPS plus 30% of defensive power. Mirrors use the fastest team movement speed and shortest team dash cooldown (minimum 0.65 s), plus the union of the team's five unlocked combat abilities. Copied builds are independent snapshots; shopping or disconnecting cannot lower an already-spawned boss. They render as magenta player ships and retain adaptive observation, target choice, circling interception and range control. Melee attacks warn for 0.55 s and lasers for 0.9 s; aim locks and the mirror stops moving during those warnings. Projectile weapons fire visible projectiles. Dash, chain lightning, orbiting blades, repair and missile abilities have hostile equivalents. Boss healing and shield recharge share a finite reserve of 20% maximum HP.

The mirror's estimated weapon output targets 135% of combined team weapon DPS at wave 10, rising by 2.5 percentage points per wave to 220%. Health exceeds combined team defensive power and includes a team-DPS allowance. This is a budget estimate, not a guarantee of landed damage: dodging, geometry, shot limits and hit immunity still apply. Beam warning cadence is included in its damage budget.

From wave 8, enemies gain compounded health (1.14 per wave) and damage (1.085 per wave), plus faster attacks (1.045 per wave, capped at 3.5x); health/damage exponents cap after 80 additional waves. Regular movement now rises toward a 350 speed cap. Late projectile hit grace is 0.2 seconds instead of 0.6. Armor gradually loses effectiveness against late-wave attacks, while regeneration, shield recharge, life-steal, kill healing and repair scale by 1/(1+0.065*(wave-7)), with a 30% floor. The HUD displays the combined health threat multiplier and recovery percentage. Shop healing and early waves are unchanged.

All players must refresh to v1.13.0 before hosting a new room: protocol 13 separates the changed sphere physics from older builds. Tests cover copied loadout isolation, team ability union, combined power budgets, all ten hostile weapons, laser windup safety, rising survival pressure, larger-sphere controls, snapshot restoration and mirror rendering.

### v1.14.0 — boss every wave and floating damage

Every wave now ends with one boss, after all regular spawns have been defeated. Waves 1–2 use smaller Wardens (320/420 base solo HP before scaling); wave 3 onward uses the adaptive player-build mirror. The shop waits for the boss and any reinforcements to die. Mirror build copying, team power scaling and in-run learning remain. Graphics still upgrade only after bosses on waves 5, 10 and 15.

Floating damage numbers show actual health removed after armor, excluding overkill, with separate blue SH values for shield absorption. Outgoing damage is pale gold; incoming health damage is red. Rapid ticks on the same target merge for 150 ms. Text has an outline, fades after 0.95 s, respects reduced motion and projects onto the sphere. The host replicates numbers in game snapshots; the queue is capped at 64 for mobile readability and bounded network traffic. Refresh all players to v1.14.0 for matching boss schedules and damage displays.

### v1.15.0 — tracking bosses and tactical ram

Fixed a mirror-boss deadlock: overlapping weapon windups could suppress movement continuously and carry the oldest aim direction into subsequent attacks. Mirrors now keep moving independently of windups, turn toward observed targets at up to 3 radians/second, and update warning directions until firing. Wall avoidance reflects outward movement back into the arena. Warden bosses also track during warnings. Fired projectiles keep their original trajectories.

Dash becomes RAM on touch, keyboard and controllers using the same buttons. It moves forward in the facing direction for 0.45 seconds at 900 units/second (405 units on unobstructed ground), with swept collision and one impact per target for three times the damage stat. The first 0.15 seconds grant full invulnerability; afterward the red 120-degree front shield reduces incoming frontal damage by 70%, while rear hits remain dangerous. Cooldown is exactly 30 seconds of active combat for players and bosses, persists across waves and migration, and cannot be reduced by upgrades. Vector Thrusters now grant speed and armor. Shockwave Ram retains the nova unlock. Bosses show a 0.65-second red shield warning before charging. Cooldown appears on the RAM button and run HUD. Sphere travel transports the ram direction continuously. All players must refresh to v1.15.0 and create a new room (protocol 14).

### v1.16.0 — smoother guests and shared damage attribution

Joining clients now interpolate remote ships, enemies and projectiles every rendered frame using a 100 ms snapshot buffer. The local ship has immediate presentation-only movement and aim, with gradual host correction; combat, collisions, purchases and damage remain host-authoritative. Prediction stops after 250 ms without a snapshot. Wave, pause, migration and graphics transitions clear the visual buffer. Sphere interpolation follows the short great-circle path, including heading transport. Stable projectile IDs prevent one bullet being blended into another. Frequent snapshots omit boss learning memory; full migration checkpoints retain it. Unchanged room metadata is no longer written to session storage for every packet.

All players receive the same floating damage events. Outgoing hits are grouped separately for each attacking player and labelled P1–P8 in that player's colour. Clients merge repeated events without resetting their animation or resurrecting expired labels. Labels remain capped at 64 for mobile performance. These changes address presentation stutter; they cannot remove Internet latency or packet loss.

Protocol 15 separates this version's rooms. All players should refresh to v1.16.0 and create a new room. Automated tests cover intermediate render frames, immutable host state, local response, stale connections, transitions, projectile identity, spherical seams and shared damage. The real WebRTC integration test also verifies that both players' hits reach the guest.

### v1.17.0 — containment break and the endless frontier

The wave-7 boss now unlocks a new refined 2D phase between the wave-5 upgrade and wave-10 3D. Arena wall segments break outward during the reveal. A streamed, seeded landscape replaces the enclosed arena: buried conduits, ruins, crystals, rocks and vegetation, with detailed ship panels. Scenery is decorative flyover terrain. Only 32 terrain tiles are cached; travel does not grow the world cache indefinitely.

Players can travel in any direction. Each online player's camera follows their own ship, including on joining clients; local co-op shares the first player's camera. Coloured edge pointers help locate distant teammates. Mouse aiming, ram movement, projectiles, loot and boss/enemy spawning use world coordinates. Distant enemies are repositioned offscreen near the crew so waves can still end. The open world and following camera continue through wave-10 3D. At wave 15, player positions are folded onto the sphere around the host's focus. World seed, phase and coordinates are replicated and retained in migration checkpoints.

Damage numbers use the attacking player's colour, without P1/P2 text. Simultaneous teammates' hits retain separate display positions. Protocol 16 requires everyone to refresh to v1.17.0 and create a fresh room. Added regression coverage for wave-7 transitions, world travel, aiming, spawns, beam transforms, deterministic chunks, seed restoration and later graphics phases. Real WebRTC tests verify frontier state on the guest.

### v1.17.1 — lighter wave 3–15 bosses

Mirror bosses on waves 3 through 15 now have 20% less health and shield, and 15% less build-based attack damage. Their finite healing reserve decreases with max health. Learning, movement and attack timings remain intact. Bosses from wave 16 onward and waves 1–2 keep their existing balance. This is a host-authoritative balance change on the same network protocol; refresh the host before starting a new run.

### v1.18.0 — three lives and proximity revival

Includes the wave 3–15 boss relief above. Each player starts with three lives per run; each defeat consumes one. With lives remaining, the ship becomes a downed beacon. A living, connected teammate within 100 world units contributes to a shared 10-second revive timer. Progress pauses when nobody is nearby and is retained; multiple rescuers do not accelerate it. Revival restores half max health and grants three seconds of protection. The third defeat eliminates the ship for that run. Lives never refill between waves or on reconnect.

Revive rings and remaining time render in every graphics phase, including the planet; frontier edge pointers include downed teammates. The HUD displays remaining lives. A co-op team wipe ends the run. Solo respawns automatically after ten active seconds while combat waits. Pausing, shopping and host migration pause timers. Downed/eliminated ships automatically mark ready in shops; shop healing and health purchases cannot bypass revival. Their progress is carried into the next wave. Host-authoritative player snapshots preserve lives and revive progress for guests, rejoining and migration.

Protocol 17: all players must refresh to v1.18.0 and create a fresh room. Regression tests cover all three lives, range boundaries, accumulated time, shop protection, team wipe, solo respawn, sphere seams and checkpoint recovery. Real WebRTC tests cover downed state, remaining lives, partial progress and revival on a guest.

Boss schedule in v1.18.0: normal Warden bosses on waves 1–5 inclusive; adaptive player-build mirror bosses start at wave 6. Wave 3–5 Wardens also receive 20% less health and 15% less projectile/ram damage; mirror relief continues through wave 15. Waves 1–2 and 16+ retain their prior balance.

### v1.19.0 — slower bosses, instant respawns and free rescues

All bosses move 30% slower and ram 35% slower. The wave 1–5 Warden / wave 6+ mirror schedule and wave 3–15 health/damage relief remain.

Players start with 10 instant-respawn lives. Being downed no longer spends a life. Choose **Respawn Now** (touch/mouse button, keyboard R, controller A) to spend one and return immediately at full health with four seconds of invulnerability, shown by a gold ring. Alternatively, a living teammate can complete the existing cumulative 10-second proximity revive for free, with the same health/protection. Leaving the radius pauses progress. Free rescues still work with zero respawn lives. A team wipe only ends the run when nobody has a life left to respawn; solo players choose immediate respawn instead of waiting for an automatic timer. Respawning also works while the team is shopping. Local co-op displays a separate button for each downed ship.

Respawn requests are validated by the host against the connection's player identity; duplicate requests cannot spend additional lives. Lives, downed state and progress survive checkpoints and reconnects. Protocol 18 requires everyone to refresh to v1.19.0 and start a fresh room. Tests cover free vs paid revival, protection, replay/ownership checks, zero-life rescues, team wipes, shopping, planet coordinates and boss movement/ram speed.

### v1.20.0 — slower aim and low-health boss relief

All bosses now rotate aim at at most 1.2 radians/second (60% slower than before); Warden attack warnings no longer snap aim directly at their target. Waves 6–15 receive an additional 20% reduction to boss HP, shield and build damage, on top of the previous relief. Earlier Wardens and wave 16+ retain their existing health/damage balance.

During waves 6–15, if any living, connected player is at or below 35% health, bosses get temporary low-health relief: 30% less damage, 20% slower movement/ram, half normal aiming speed, and weapon/ability cooldowns count down at 75% speed. Damage relief applies at impact, including already-fired mirror projectiles, melee, ram, burn and contact. Ordinary enemies are unaffected. The boss HUD shows LOW-HEALTH RELIEF. It ends when all living players are above the threshold; no boss base stats are repeatedly multiplied and no player HP is altered by the relief itself.

Host-authoritative balance update on protocol 18. Refresh all players to v1.20.0 before starting a new run. Regression tests verify turn caps, angle wrapping, Warden warnings, damage attribution, threshold/connection/death handling, cooldowns, recovery and unchanged later waves.

The shop also sells extra respawn lives: **25 + 15 × your current remaining lives** materials. Examples: 0 lives → 25, 5 → 100, 10 → 175. Each purchase adds one life and immediately raises the next price; spending lives lowers it again. The price and wallet are personal, computed by the host. Downed auto-ready players may buy lives and then choose Respawn Now; buying does not revive automatically. Purchase revisions reject duplicate requests. The real WebRTC test verifies guest purchases, host-calculated pricing and player ownership.


### v1.21.0 — synth audio, impact weight and recoil

Original Web Audio synth/noise effects give each weapon a distinct voice, with hits, explosions, kills, pickups, damage and rams. Audio unlocks on a tap/click/key press. The header sound button remembers mute locally. Voice limits, sound rate limits and distance attenuation keep eight-player combat manageable. No Geometry Wars recordings or music are included.

Shotguns add a backward impulse (roughly 21 arena units), snipers and rockets smaller kicks. Impulses combine with steering, decay independently of frame rate, cap at 240 units/second and parallel-transport on the planet. Host-authoritative recoil is included in guest prediction and checkpoints; respawning clears it.

Rocket blasts have a 55 ms local display freeze and up to 420 ms of shake. Shotgun/sniper hits have a 22 ms freeze. Freeze triggers have a 300 ms cooldown, never stack, and do not pause simulation, input delivery or heartbeats. Reduced-motion preferences disable both freeze and shake. Ordinary targets briefly stun for 120 ms on rockets and 45 ms on shotgun/sniper hits, with a 500 ms resistance window. Bosses take 30% of that stun and have 1.2 seconds of resistance.

Bounded, attributed combat events travel in host snapshots; clients deduplicate their IDs. Protocol 19 requires everyone to refresh to v1.21.0 and start a fresh room. Unit tests cover recoil distance and frame rate, sphere motion, caps, stun resistance, effect cooldowns, reduced motion and replication. The real WebRTC integration test verifies sound-event and recoil delivery (it does not test iPhone audio hardware).


### v1.22.0 — evolving audio and orbital mesh models

Audio follows the same post-boss transitions as graphics: wave 5 adds bright synth harmonics; wave 7 adds low-frequency impact layers and echoes; wave 10 introduces stereo positioning; wave 15 adds HRTF positioning and short reverb. A rising synth cue announces each transition. The sound button shows I–V and its tooltip names the current sound layer. Mute persists across stages; new runs reset to stage I and reconnect/checkpoint restoration selects the current layer without replaying earlier upgrades. Positional sound follows the local camera orientation on the sphere. Older browsers fall back to stereo or mono if a spatial node is unavailable. Spatial stages cap simultaneous voices at 16.

Wave 15 now uses original cached indexed 3D models: ships have fuselages, swept wings, cockpit glass, engine nacelles and weapon mounts; enemies have interceptor, armored gunship, drone, splitter and heavy turret silhouettes. Mirror bosses use the ship model. Full models contain roughly 200–550 triangles each. WebGL lighting adds metallic highlights; software rendering uses lighter mesh variants. Rear-hemisphere models are culled and crowded WebGL scenes use lower detail after 40 ordinary enemies. Existing hitboxes, movement and progression are unchanged. All model geometry is bundled locally, with no third-party asset downloads.

Protocol remains 19. Refresh all players to v1.22.0 to hear and see the new effects. Regression tests cover the actual boss-triggered audio stages, reconnect/reset behavior, mesh topology, cached geometry and software sphere rendering. The existing transformation preview loads the same production audio and model modules for manual stage comparison.


### v1.23.0 — performance, milestone bosses and inventory clarity

Player-build mirror bosses now appear only at waves 10, 15, 20 and every fifth wave thereafter. Wave 5 and all other waves use normal Wardens. Mirrors still learn movement habits, but rotate through FAN, SWEEP, RING and RAM patterns with one-second warnings and 1.65-second recovery windows (longer during low-health relief). They use one copied weapon at a time, show their phase on the boss HUD and slow down during recovery. Ring attacks leave an escape gap; ram keeps its 30-second cooldown. Pattern state survives host migration.

Performance changes:
- Spatial collision bins conservatively narrow projectile candidates in both flat and spherical worlds; the existing swept collision test remains authoritative. Large simulation steps fall back to the complete candidate list.
- Live snapshots use rounded presentation coordinates, compact player/enemy fields and presentation-only hostile bullets. Clients merge personal build/shop fields by player ID; full-precision recovery checkpoints remain every 0.5 seconds. Idle/shop updates drop to 2 Hz. Congested links skip transient snapshots instead of piling them up; purchase/respawn messages remain deliverable.
- Sphere projection reuses camera and model tangent bases and cached planet vertices, discards invisible ground triangles and reduces geometry allocations. Software mesh variants use fewer rings/segments. HUD refreshes are limited to 10 Hz while gameplay/input remain per frame.

Measured synthetic stress case on the development runner: 8 players, 160 enemies, 288 player bullets and 200 hostile bullets. Median combat step dropped from approximately 25 ms to 3 ms in the frontier and from 43 ms to 5 ms on the sphere. Live JSON snapshot representation dropped from approximately 102 KB to 65 KB (37%); full checkpoints stayed around 138 KB. Sphere geometry construction plus software sorting dropped from approximately 152 ms to 52 ms in a separate 160-enemy mock-canvas test. These are development microbenchmarks, not end-to-end phone FPS or exact PeerJS wire-byte counts. `node performance-check.cjs` reproduces the simulation/snapshot scenario.

Ownership audit: shop actions are bound to the sender's connection, and foreign weapon/offer IDs are rejected. Eight-player regression tests and the real WebRTC test cover independent weapon/item purchases and preservation of inventories during compact updates. Supply crates intentionally reward every player; weapon cards now distinguish shared-crate rewards, personal shop purchases, starters and combined equipment. The shop says YOUR SHIP and includes the player ID in its UI refresh key. Crate rewards now increment inventory revision as well.

Protocol 20 requires all players to refresh to v1.23.0 and create a fresh room. The release also includes the v1.22 audio and mesh-model evolution at boss milestones 5, 7, 10 and 15.

### v1.24.0 — ship selection and mounted weapons
Starting solo, local or online now opens ship selection, with distinct hull previews and starter selection. Bulwark unlocks on reaching wave 5, Vanguard at 10 and Spectre at 15. Scout and Engineer retain their existing clear-wave unlocks. Progress is saved per browser; unlocks become available for the next run. Vanguard has +25% damage, +2 armor and -10% speed; Spectre has +30% speed, +25 luck and -25 HP.

Matching shop offers now have COMBINE: spend the shown price to consume that offer and upgrade a matching owned weapon of the same rarity, even with six slots filled. Buying a separate copy and combining owned duplicates remain available. Epic weapons cannot combine further.

Weapons occupy mounts around the hull and fire from their barrels. Mouse aim converges at the cursor; touch/controller aim converges along the chosen direction. Mount coordinates are shared by firing and both renderers, including sphere movement. Weapon rarity colors and wide/narrow weapon bodies distinguish equipment. Protocol 21: refresh every player before creating a room.

### v1.25.0 — wave-20 third-person arena
Defeating the wave-20 boss triggers the next main-run transformation. The sphere unfolds into a 4,800 × 4,800 world-space hover arena with a perspective chase camera, 3D ship/enemy meshes, tiled floor, perimeter walls, skyline towers and twelve solid pylons. Movement stays on the hover plane; this is not six-axis flight. Movement is camera-relative, aim turns the chase camera smoothly, cursor targeting projects onto the floor, and a radar shows offscreen hostiles. Pylons stop travel, projectiles and direct laser hits; nearby enemies steer around them. The camera shortens its trailing distance near cover. Existing weapons, ram, shops, revives, lives and skills continue. Spatial audio retains its highest unlocked quality.

The phase and camera heading are included in normal snapshots and migration checkpoints. Client prediction understands the new arena bounds and pylons. The renderer uses a real perspective WebGL projection; a clipped and depth-sorted software renderer remains available without WebGL. Protocol 22 requires everyone to refresh before creating a room. The transformation preview includes WAVE 20 · THIRD PERSON for inspecting the same renderer without playing twenty waves. Tests cover the actual wave-20 boss trigger, coordinate conversion, camera projection and input, collision, reset, prediction and phase/camera delivery over real WebRTC. Physical phone performance and separate-network joins still require device testing.

### v1.26.0 — enemy roles and smarter pursuit
Skirmishers enter the spawn pool at wave 3, strafe at range and fire predictive three-shot volleys. Bombers enter at wave 6 with one-second windups and expanding projectile rings with an escape gap; their rings become denser at wave 15. Repair ships enter at wave 8, retreat from players, and restore 12% health to up to three nearby ordinary enemies every 3.5 seconds. They cannot heal bosses, themselves or other repair ships, and third-person cover blocks repairs.

Ranged enemies retreat when crowded and strafe at their preferred distance; runners and swarms approach along offset paths. Gunners, sentinels and skirmishers estimate recent target velocity, with capped prediction that grows with waves. Firing direction commits at the start of the windup. Projectile attacks use body warnings rather than laser targeting lines. Existing boss schedule and relief remain intact. Steering adds constant work per enemy; repair scans occur only on pulses. Full checkpoints preserve target tracking and attack state. Protocol 23 requires every player to refresh to v1.26.0 before a new room.

### v1.27.0 — expanded constellation and capstone powers
The tree doubles from 26 to 52 connected nodes. Existing IDs and abilities remain; each branch gains four stat nodes followed by a three-point capstone. A Fortune Nexus adds an optional luck node connected to branch masteries. The map grows to 2200 × 2100, zoom supports 6–140%, and FIT frames the full tree. Zoom buttons preserve the viewed center.

New automatic powers: Chain Lightning jumps through up to five enemies every three seconds; Freeze Ray fires along aim every four seconds with damage, a brief freeze and a slow (reduced on bosses); Gravity Well pulls ordinary enemies into a damage pulse every six seconds; Aegis Pulse clears nearby hostile bullets and briefly protects nearby teammates every ten seconds; Cluster Barrage launches five explosive rockets every five seconds. All damage is attributed to the owning player. Host simulation owns effects and cooldowns, snapshots preserve unlocks, and the existing boss power calculation counts the extra abilities. Original Arc Relay remains an earlier on-hit power. New capstones are player powers; mirror bosses retain their existing five-ability attack set.

Protocol 24: refresh every player before creating a room. Tests cover connected graph, gated purchases, cooldowns and actual combat effects in all four world geometries.
