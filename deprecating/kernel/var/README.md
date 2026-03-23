# /var/ - Variable Data

## Purpose
Persistence. This directory holds the serialized "Save States" of your 
database so that data survives a game refresh or script crash.

## Responsibilities
- Handling the disk-writing (ns.write) of the in-memory Database.
- Providing a recovery point for the Process Registry after a crash.

## Files
- **db/network.txt**: The serialized state of the network map.
- **db/registry.txt**: A snapshot of the process list for recovery.