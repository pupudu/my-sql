/**
 * Created by pubudud on 8/30/17.
 */

/**
 * Transaction worker which actually does the query operations
 */
class Worker {


    /**
     * Executes cycle of a transaction recursively, one by one.
     * Calls a separate method to commit transaction when iterations are over(i.e. All queries have executed)
     * If an error occurs rollback current query execution and end further processing
     *
     * @param {Object} conn - mysql connection
     * @param {Array} queries - {query,args}
     *      @param {string} queries.query - query
     *      @param {Array} queries.args - arguments
     * @param {number} iteration - current iteration(int)
     * @param {Object[]} resultsArray - Rows returned from the current iteration will be appended to this array
     * @returns {Promise} - Transaction results object
     */
    executeOrRollbackLoop(conn, queries, iteration, resultsArray = []) {
        return new Promise((resolve, reject) => {
            if (iteration >= queries.length) {
                return this.commitTransaction(conn, resultsArray).then(resolve).catch((err) => {
                    err.appendDetails('MysqlFacade', '_executeOrRollbackLoop', `Invalid query detected for iteration:${iteration}`);
                    return reject(err);
                });
            }
            // Check validity of the query corresponding to this iteration
            if (!queries[iteration] || !queries[iteration].query) {
                const err = new Error(`Invalid query detected for iteration:${iteration}`);
                err.appendDetails('MysqlFacade', '_executeOrRollbackLoop', `Invalid query detected for iteration:${iteration}`);
                return reject(err);
            }
            return conn.query(queries[iteration].query, queries[iteration].args || [], (err, rows) => {
                if (err) {
                    return conn.rollback(() => {
                        err.appendDetails('MysqlFacade', '_executeOrRollbackLoop', '[MySQL]Error executing query');
                        return reject(err);
                    });
                }
                // Append the mysql result of current query to results array
                resultsArray.push({
                    rows: rows
                });
                iteration++;
                return this.executeOrRollbackLoop(conn, queries, iteration, resultsArray)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /**
     * Commit transaction and call the callback with the results collected
     *
     * @param {Object} conn - mysql connection
     * @param {Array} results - Final result list of all queries (Array of mysql rows objects)
     * @private
     * @returns {Promise} - Transaction results object
     */
    commitTransaction(conn, results) {
        return new Promise((resolve, reject) => {
            conn.commit((err) => {
                if (err) {
                    return conn.rollback(() => {
                        err.appendDetails('MysqlFacade', '_commitTransaction', 'Error while rolling-back transaction');
                        return reject(err);
                    });
                }
                return resolve(results);
            });
        });
    }
}

export default new Worker();
