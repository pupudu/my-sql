/**
 * Created by pubudud on 8/30/17.
 */

import worker from './worker';
import dbManager from '../dbManager';

/**
 * Handle the execution of transactions
 */
class TransactionHandler {

    /**
     * Execute a transaction with any given number of queries
     *
     * @param {Object} options - transaction options.
     *      @param {string} [options.poolType] - Mysql connection pool type.
     *      @param {Object[]} options.queries - Object array of query and args pairs -> [{query: query, args:args}^n].
     * @returns {Promise} - Transactions results as an object
     */
    executeTransaction(options) {
        return new Promise((resolve, reject) => {

            // Parameter destructing
            const {queries, poolType} = options;

            const connectionPool = dbManager.getConnectionPool(poolType);

            // Check if the specified poolType is a valid one
            if (!connectionPool) {
                const err = new Error('Invalid poolType');
                err.appendDetails('TransactionHandler', 'executeQuery', `PoolType: ${options.poolType}`);
                return reject(err);
            }

            connectionPool.getConnection((err, conn) => {
                if (err) {
                    err.appendDetails('TransactionHandler', 'executeTransaction', '[MySQL]Error getting connection from pool');
                    return reject(err);
                }
                conn.beginTransaction((err) => {
                    if (err) {
                        err.appendDetails('TransactionHandler', 'executeTransaction', '[MySQL]Error starting transaction');
                        conn.release();
                        return reject(err);
                    }

                    worker.executeOrRollbackLoop(conn, queries, 0)
                        .then((results) => {
                            conn.release();
                            return resolve(results);
                        })
                        .catch((err) => {
                            err.appendDetails('TransactionHandler', 'executeTransaction', '[MySQL]Failed to complete transaction');
                            conn.release();
                            return reject(err);
                        });
                });
            });
        });

    }
}

export default new TransactionHandler();
