



export class RAMLedger {
    constructor() {
        this.ledger = new Map(); // hostname -> { used: number, total: number }
        

        this.SCHEMA = {
            PID: 0,
            RAM: 0,
            HOST: "unknown"
        }
    
    }

}