# /bin/ - User Binaries

## Purpose
Command-Line Interface (CLI) utilities for the player. These allow manual 
interaction with the Kernel and Database.

## Responsibilities
- Providing human-readable telemetry of the system state.
- Allowing manual overrides and emergency system management.

## Files
- **top.js**: Displays the current Process Registry and RAM usage.
- **psql.js**: Allows manual querying of the internal Database.
- **sysctl.js**: Manually triggers system-wide commands (Scanner, Killall).