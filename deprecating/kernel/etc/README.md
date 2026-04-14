# /etc/ - System Configuration

## Purpose
The "Static Truth." Contains configuration files and constants that define 
how the OS operates. No executable logic is allowed here.

## Responsibilities
- Centralizing all hard-coded values (Ports, IDs, Timings).
- Defining strict JSON schemas for IPC and Database entries.

## Files
- **ports.js**: Constant mapping of Port 1 through 20.
- **schemas.js**: Data structure definitions for Syscalls and DB rows.
- **settings.js**: Global tunables like logging verbosity and update frequencies.