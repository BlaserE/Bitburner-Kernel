# /boot/ - System Initialization

## Purpose
The entry point for the OS. This directory contains the "Init" sequence 
responsible for transitioning the game from a raw state to a managed state.

## Responsibilities
- Handling the transition from manual play to automation.
- Clearing the 20-port system bus to prevent stale message processing.
- Bootstrapping the Kernel with sufficient priority.

## Files
- **init.js**: The master toggle. Clears ports and executes `/sbin/kernel.js`.