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
     *      @param {string} [options.pool = DEFAULT] - Mysql connection pool type.
     *      @param {Object[]} options.queries - Object array of query and args pairs -> [{query: query, args:args}^n].
     * @returns {Promise} - Transactions results as an object
     */
    executeTransaction(options) {
        return new Promise((resolve, reject) => {

            const connectionPool = dbManager.getConnectionPool(options.pool);

            // Check if the specified pool is a valid one
            if (!connectionPool) {
                const err = new Error('Invalid pool type');
                err.appendDetails('TransactionHandler', 'executeQuery', `Pool: ${options.pool}`);
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

                    worker.executeOrRollbackLoop(conn, options.queries, 0)
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
