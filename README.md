# Bitburner-Kernel
## Philosophy
The philosophy behind this project was to create a foundation upon which I could build scripts in bitburner that would all play well with each other while centralizing management.
I found the idea of making a "kernel" for Bitburner very funny. So I did it.

## Pulling the kernel
I have provided a script (`Pull.js`) that automatically pulls the latest kernel 'image' from this repository.


You can pull the script to your instance using the following command :
```
wget https://raw.githubusercontent.com/BlaserE/Bitburner-Kernel/main/Pull.js Pull.js
```

You can alias it to the command `pull` using this :
```
alias -g pull="run Pull.js"
```

[WARNING] Pulling the latest version of the kernel may break your save. Do so at your own risk.

# Kernel Components
The kernel is intended to be the communication layer between the software and the hardware.
In this case, however, the 'hardware' is all the servers to which scripts can be executed.

The kernel is intended to be the only script that is capable of doing `ns.exec`. It will read ports 1-20 to receive information, requests and updates. It uses that to orchestrate running scripts across all servers.

## Ports
Here is a detailed list of every port and their uses : <br>
1 - CRITICAL (Kill, stop, reboot, etc.) <br>
2 - STANDARD (Register new resources, free up space, etc.) <br>
3 - REQUESTS (Executing scripts, running scans, etc.) <br>
...<br>
the rest remains to be done, once I actually start using them.

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