# /lib/ - Shared Libraries

## Purpose
The "Knowledge Base." This folder contains the functional DNA of the OS. 
To keep the Kernel lean, everything here is a 0GB RAM pure-logic export.

## Responsibilities
- Providing 0GB logic classes for data manipulation.
- Standardizing communication protocols via IPC.
- Managing the math behind RAM allocation (MMU).

## Files
- **Database.js**: In-memory SQL-style engine.
- **IPC.js**: Packing/unpacking logic for Port communication.
- **Registry.js**: The "Shadow State" logic for tracking PIDs and RAM.