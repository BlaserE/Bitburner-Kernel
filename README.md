# Bitburner-Kernel
The philosophy behind this project was to create a foundation upon which I could build scripts in bitburner that would all play well with each other while centralizing management.

You can pull the kernel to your instance using the following command :
```
wget https://raw.githubusercontent.com/BlaserE/Bitburner-Kernel/main/Pull.js Pull.js
```

You can alias it to the command `pull` using this :
```
alias -g pull="run Pull.js"
```

Pulling the latest version of the kernel may break your save. Do so at your own risk.

It (badly) emulates a 'kernel', in which every script that is run by the the `kernel.js` script will register itself to the kernel before it can start deploying other scripts. 

# Kernel
The kernel is intended to be the only script that is capable of doing `ns.exec`. It will read ports 1-20 to receive information, requests and updates. It uses that to orchestrate running scripts across all servers.

## Ports
Here is a detailed list of every port and their uses :
(to be done)

# Ledger.js
The ledger is what holds the information of every server and their running processes, indicating available RAM.
It is the source of truth for executing scripts.
