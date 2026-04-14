# /srv/ - Managed Services

## Purpose
The "Userland." This is where the game is actually played. Modules here 
contain the heavy math and strategy for specific game mechanics.

## Responsibilities
- Calculating optimal gameplay strategies (Hacking, Corps, Gangs).
- Submitting resource requests (EXEC_REQ) to the Kernel.
- Monitoring domain-specific progress and reporting to the Database.

## Files
- **hack/hwgw-mgr.js**: The batch-orchestration service.
- **corp/corp-mgr.js**: The high-level corporation manager.
- **gang/gang-mgr.js**: The gang-ascension and task manager.