gib
===

#### This is a simple multiplayer top-down shooter made for Ludum Dare 30. ####

## Controls: ##

- WASD to move
- Mouse to shoot
- Tab to check score

## Changes: ##

### v1.0.0 ###

- First Release

### v1.0.1 ###

- Show players, pings, and scores when tab is pressed.
- Add short delay before player can respawn.
- Show socket count, and dead player count on server.
- Fix bug where a player could join using an in-use name if the other player is dead.
- Draw 'connecting', etc. on screen before the game starts.

### v1.0.2 ###

- Fix bug where a player may occasionally shoot through a wall.
- Unload level and show 'disconnected' message if connection lost.
- Restructure code to be more tidy and readable.

### v1.0.3 ###

- Server: Fix infinite loop bug that crashes the server.

### v1.0.4 ###

- Added an explosive weapon upgrade

## TODO: ##

- Add iPod touch support similar to X-Type.
- Add spawn invulnerability.
- Show who killed who.
- Add the ability to kick.
- Add the ability to ban by name and/or IP.
- Add one bot that disappears if ever two real players are present.
- Catch failure to connect to server due to 404 error on script load.
