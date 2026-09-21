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
