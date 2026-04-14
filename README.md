# Bitburner-Kernel

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Bitburner-orange?style=for-the-badge)


## Philosophy
The philosophy behind this project was to create a foundation upon which I could build scripts in bitburner that would all play well with each other while centralizing management.
I found the idea of making a "kernel" for Bitburner very funny. So I did it.

## Pulling the kernel
I have provided a script (`Pull.js`) that automatically pulls the latest kernel 'image' from this repository.

You can pull the script to your instance using the following command :
```bash
wget https://raw.githubusercontent.com/BlaserE/Bitburner-Kernel/main/tools/Pull.js Pull.js
```

You can alias it to the command `pull` using this :
```
alias -g pull="run Pull.js"
```

[WARNING] Pulling the latest version of the kernel may break your save. Do so at your own risk.

# Kernel Components
Each component has a more detailed entry in the `src` directory of the repository.
Look there for more information on the architectural choices.

The kernel is intended to be the communication layer between the software and the hardware.
In this case, however, the 'hardware' is all the servers to which scripts can be executed.

The kernel is intended to be the only script that is capable of doing `ns.exec`.
It will read ports 1-20 to receive information, requests and updates.
It uses that to orchestrate running scripts across all servers.



## Ports
Here is a detailed list of every port and their uses : <br>
1 - CRITICAL (Kill, stop, reboot, etc.) <br>
2 - STANDARD (Register new resources, free up space, etc.) <br>
3 - REQUESTS (Executing scripts, running scans, etc.) <br>
...<br>
the rest remains to be done, once I actually start using them. They will be added here as I use them.

## KernelScript
This is a class created to facilitate integrating more scripts into the kernel topology.
Every script that is executed **has** to inherit from it. It includes basic methods that allow 
every script extending it to automatically register with the Kernel and the **RAMLedger**.

## RAMLedger
The ledger keeps track of every rooted server, it's RAM and running processes.
It provides methods (used only by the kernel) to add servers, add and free up processes on those servers, 
as well as method to find if there is space for a specific script.

The ledger is what holds the information of every server and their running processes, indicating available RAM.
It is the source of truth for executing scripts. 



## Database (NYI)
The database serves as a static source of information that normally requires `ns` method calls.
It was created to solve a specific objective : keeping the processes 'lean'.
To keep the RAM cost of scripts lean, it was decided that getting the info once was enough and storing it would be simpler.


# License
I am using an MIT license for this project. You are free to use it as you wish, and I am not responsible for any damage caused.
It is free to use and is projected to remain this way forever.