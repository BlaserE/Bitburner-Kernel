/** * Universal In-Memory Database
 * RAM Cost: 0.00GB
 */
export class Database {
    constructor() {
        // The master state: A Map of Tables. 
        this.tables = new Map();

        // A schema definition for default values and structure (not enforced, but used for reference).
        this.SCHEMAS = {
            servers: {
                maxMoney: 0,
                minSecurity: 1,
                maxRam: 0,
                requiredLevel: 1,
                isRooted: false,
                growth: 1
            },
            factions: {
                favor: 0,
                reputation: 0,
                isJoined: false
            }
        };
    }

    /** INTERNAL: Ensure a table exists before writing */
    _initTable(tableName) {
        if (!this.tables.has(tableName)) {
            this.tables.set(tableName, new Map());
        }
    }

    _sanitize(tableName, data) {
        const schema = this.SCHEMAS[tableName];
        if (!schema) return data; // No schema for this table, pass through (Dynamic Table)

        const sanitized = {};
        for (const [key, defaultValue] of Object.entries(schema)) {
            const providedValue = data[key];

            // 1. Validation: Ensure type matches the schema's default type
            if (providedValue !== undefined && typeof providedValue === typeof defaultValue) {
                sanitized[key] = providedValue;
            } else {
                // 2. Defaulting: If missing or wrong type, use schema default
                sanitized[key] = defaultValue;
            }
        }
        return sanitized;
    }

    // ==========================================
    // CORE "SQL" OPERATIONS
    // ==========================================

    /** * UPSERT: Insert new data or update existing data without overwriting.
     */
    upsert(tableName, primaryKey, data) {
        this._initTable(tableName);
        const table = this.tables.get(tableName);
        
        const cleanData = this._sanitize(tableName, data);
        
        const existingData = table.get(primaryKey) || {};
        table.set(primaryKey, { ...existingData, ...cleanData });
    }

    /** * SELECT: Query a table using a filter callback (LINQ-style).
     * Returns an array of objects with the primary key injected as 'id'.
     */
    select(tableName, filterFunc = () => true) {
        if (!this.tables.has(tableName)) return [];
        
        const results = [];
        for (const [id, row] of this.tables.get(tableName).entries()) {
            const record = { id, ...row };
            if (filterFunc(record)) {
                results.push(record);
            }
        }
        return results;
    }

    /** FIND: Get a single exact record by its Primary Key */
    findById(tableName, primaryKey) {
        if (!this.tables.has(tableName)) return null;
        const row = this.tables.get(tableName).get(primaryKey);
        return row ? { id: primaryKey, ...row } : null;
    }

    // ==========================================
    // CONVENIENCE METHODS (Clean Execution)
    // ==========================================

    /** Single call to add or update a server */
    addServer(hostname, data) {
        this.upsert("servers", hostname, data);
    }

    /** Single call to track a faction */
    addFaction(factionName, data) {
        this.upsert("factions", factionName, data);
    }

    // ==========================================
    // DISK I/O (Serialization for the nested Maps)
    // ==========================================

    serialize() {
        const out = {};
        for (const [tableName, tableMap] of this.tables.entries()) {
            out[tableName] = Object.fromEntries(tableMap);
        }
        return JSON.stringify(out, null, 2);
    }

    deserialize(jsonString) {
        if (!jsonString) return;
        const parsed = JSON.parse(jsonString);
        this.tables = new Map();
        
        for (const [tableName, rows] of Object.entries(parsed)) {
            this.tables.set(tableName, new Map(Object.entries(rows)));
        }
    }
}