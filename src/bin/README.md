# Bitburner Kernel
In this here kernel, the `bin` directory is dedicated to user-side scripts.
These scripts also subscribe into the kernel ecosystem using `KernelScript`,
a class dedicated for managing scripts. 
That class is not found in `bin`, it is instead found in `lib`, because it is never directly called by the user themselves.

## User-Script architecture
Every new script must look like the following :

```typescript
import {KernelScript} from "./KernelScript";

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {

    const script: NewScript = new NewScript(ns, ns.args);
}

class NewScript extends KernelScript {
    
    // mandatory implementation because the constructor calls this method to begin the loop
    protected override onInit():void {
        // ... main loop stuff
    }
}
```