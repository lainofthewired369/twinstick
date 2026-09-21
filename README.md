# Rift Runners — Afterburn (v1.4)
Play: https://lainofthewired369.github.io/twinstick/

## Build a run
Choose CHARACTER & STARTER before playing. You begin with one Common weapon, level 1, and no materials. Five starter choices are available; all ten weapon types can appear in shops and supply crates. Up to six weapons fire together.

Defeated enemies drop green materials that also award XP. Nearby drops are drawn toward your ship. Tank enemies can drop gold supply crates containing a Common weapon. In co-op, a collected drop rewards both players. A crate fills an empty slot, upgrades a matching Common weapon when full, or gives 12 materials. Leftover drops are collected automatically when the wave ends.

## Field shop
After each wave, each player receives a survival bonus plus their Harvesting stat. Downed teammates revive; ships recover health. Spend your own materials on four personal offers: weapons and passive stat items. Shops always roll at least two weapon offers unless locked items occupy those slots.
- Common / Uncommon / Rare / Epic weapons deal 100% / 155% / 230% / 340% base damage. Later waves and Luck improve rarity odds.
- Combine two identical weapons of the same tier into one of the next tier, up to Epic. Combining frees a slot and costs no materials.
- A matching purchase automatically combines when all six slots are full. Other purchases require space.
- Sell extra weapons for materials; you cannot sell your last weapon.
- Lock an offer to preserve it through rerolls and wave transitions. Reroll costs rise with each use and reset each wave.
- Passive items apply permanent-for-this-run stat bonuses, multiplied by their rarity tier.
- Each XP level grants a choice of three stat upgrades at the next shop. Spend all pending choices before Ready.
- Both players must be Ready before the next wave starts. Cancel Ready to resume shopping. Local co-op uses SWITCH PLAYER to shop for each ship.

Stats include damage, attack speed, maximum health, movement speed, armor, regeneration, luck, harvesting and critical chance. Armor reduces incoming damage; critical hits deal double damage. Run equipment, currency, items and levels reset on restart.

## Character progression
Ranger is available immediately (+10% damage). Clear wave 3 to unlock Scout (+20% speed, +50% pickup range, -20 HP), wave 5 for Bulwark (+40 HP, +4 armor, -15% speed), and wave 8 for Engineer (+8 harvesting, +20 luck, -10% damage).
Unlocks, best cleared wave and highest character level persist in this browser's local storage. They do not sync between devices. Clearing browser data resets them. Unlocks are character options, not permanent damage upgrades.

## Two-player online co-op
Choose your own character and starter before entering ONLINE P2P.
1. Host leaves the room password blank to generate one, or enters a unique game-only password of 8–64 characters.
2. Tap HOST ROOM and wait for “Room ready”.
3. Share the password; your friend enters it and taps JOIN ROOM.
4. Both players must refresh to v1.4 before connecting.

## Boss waves
A Rift Warden arrives after the regular enemies finish spawning on every fifth wave (5, 10, 15…). It cycles through five-shot aimed volleys, 16-shot rings and nine-shot fans, warning before firing. Below half health it fires faster and rings grow to 20 shots. It periodically summons runners and gunners. Defeating it grants a guaranteed weapon crate plus bonus materials and XP; all remaining enemies must also be defeated to open the shop.

Boss scaling snapshots the team's equipped weapon damage, rarity, attack speed, critical chance and projectile count, plus maximum HP, armor, shields, regeneration and life-steal when the boss spawns. This adjusts a wave-scaled baseline, with separate two-player health scaling. Loadout pressure is capped at 4× health, 1.3× attack frequency and 1.35× projectile damage. Warnings stay 0.8 seconds. The snapshot stays fixed for that encounter; it does not change when players take damage or pick up a weapon. The boss HUD shows its health multiplier.

## Afterburn interface and enemies
Landscape phones use a compact header, safe-area-aware sticks, a compact run HUD, and a split shop with persistent Ready/Reroll controls. Market, Weapons and Augments have separate tabs; each content area scrolls independently. Portrait remains supported. A dark navy, mint and violet interface replaces the earlier stacked panels.

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

Passwords ignore letter case and surrounding whitespace. Anyone with the password can join; never use an account password. Each player controls their own ship, wallet, shop, XP upgrades and inventory. The host validates transactions, including phase, price, capacity, matching tiers and state revisions. Guests send requests, not authoritative stats. The host controls restarting a run.

## Controls
Touch: left stick moves; right stick aims and fires. Tap DASH to evade. Landscape recommended; shopping panels scroll on phones.
Desktop: WASD + mouse, Space dash. Local player 2: arrows + numpad 8/4/2/6, Enter dash. Online supports one touchscreen per player; local co-op requires a keyboard.
Switching apps clears inputs. If the host backgrounds active gameplay, the team pauses; tap Pause to resume.

## Networking and hosting
Static HTML/CSS/JS; GitHub Pages publishes main / (root). PeerJS 1.5.5 loads from jsDelivr when requested. PeerJS Cloud provides matchmaking; WebRTC carries host-authoritative gameplay. Shared service availability and NAT/firewall restrictions can still block connections. A dedicated TURN relay is not configured, so not every mobile carrier or restrictive network is guaranteed to connect.

This is an original Brotato-inspired game, not a full port or a copy of its content.

## Validation
Run `node tests.cjs` from the repository root. Tests cover economy, leveling, combining, locked offers, capacity, transaction replay, two-player readiness, shared loot, character stats, all ten weapon attacks, and guest transaction ownership. Simulated networking tests do not prove Internet reachability on every network.
