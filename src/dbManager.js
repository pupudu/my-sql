/**
 * Created by pubudud on 2/25/17.
 */

import {createPool} from 'mysql';

/**
 * Mysql DB Manager which creates sql connection pools and expose methods to fetch them
 */
class DbManager {

    /**
     * Initiate an active session with a default connection pool
     * @param {Object} dbConfig - mysql db configuration
     */
    init(dbConfig) {
        this.pools = {
            default: {
                default: createPool(dbConfig)
            }
        };
        this.dbConfig = dbConfig;
    }

    /**
     * Get a connection pool given the pool name
     *
     * @param {string} [poolName] - key to identify the pool
     * @param {string} [database] - optional database name if the pool is not in the default db
     * @returns {object} - Requested connection pool
     */
    getConnectionPool(poolName, database = 'default') {
        if (!poolName) {
            return this.pools[database].default;
        }
        if (!this.pools[database] || !this.pools[database][poolName]) {
            return null;
        }
        return this.pools[database][poolName];
    }

    /**
     * Create new connection Pool
     * @param {string} name - connection pool name
     * @param {number} [size] - connection limit
     * @param {object} [overrideConfig] - optional db config if needed to override the default; possibly for a separate database
     */
    createConnectionPool(name, size, overrideConfig) {
        let dbConfig = overrideConfig || this.dbConfig;

        dbConfig = {
            ...dbConfig,
            connectionLimit: size || dbConfig.connectionLimit
        };

        const database = (overrideConfig || {}).database || 'default';

        if (!this.pools[database]) {
            this.pools[database] = {};
        }

        this.pools[database][name] = createPool(dbConfig);
    }

    /**
     * End the session by terminating all available connection pools
     */
    end() {
        Object.keys(this.pools).forEach((dbKey) => {
            Object.keys(this.pools[dbKey]).forEach((poolKey) => {
                this.pools[dbKey][poolKey].end();
            });
        });
    }
}

export default new DbManager();
