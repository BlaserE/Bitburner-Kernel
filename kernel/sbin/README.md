# /sbin/ - System Binaries

## Purpose
The "Kernel Space." This directory contains scripts with "Ring 0" privileges. 
Only scripts in this folder should interact directly with sensitive hardware APIs.

## Responsibilities
- Acting as the sole arbiter of the `ns.exec` command.
- Managing the lifecycle of all running processes.
- Interfacing with the game's hardware layer (scanning/server queries).

## Files
- **kernel.js**: The "Brain." The only script permitted to use `ns.exec`.
- **hw-scanner.js**: The "Eyes." Performs expensive scans and pushes updates via Port 3.