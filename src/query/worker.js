/**
 * Created by pubudud on 8/30/17.
 */

import * as constants from '../constants';

/**
 * This module uses an actual mysql connection to execute a single query
 */
class QueryWorker {

    /**
     * Final execution of the query is from here
     * Note - parameters are expected to be validated before calling this method
     *
     * @param {Object} conn - mysql connection
     * @param {String} query - final query to execute
     * @param {Array} args - arguments corresponding to the query
     * @returns {Promise} - Rows and Info
     */
    execute(conn, query, args) {
        return new Promise((resolve, reject) => {
            conn.query(query, args, (err, rows) => {
                conn.release();
                if (err) {
                    err.appendDetails('QueryWorker', 'execute', 'QueryHandler syntax issue or processing issue');
                    return reject(err);
                }
                return resolve(rows);
            });
        });
    }

    /**
     * Add group concat length constraint to the current session
     *
     * @param {Object} conn - mysql connection
     * @param {Object} options - query execute configurations
     * @return {Promise} <- status
     */
    setSession(conn, options) {
        return new Promise((resolve, reject) => {

            if (!options.lengthConstraint) {
                return resolve();
            }

            const MAX_LENGTH = typeof options.lengthConstraint === 'number' ? options.lengthConstraint : constants.GROUP_CONCAT_MAX_LN;

            conn.query(`SET SESSION group_concat_max_len=${MAX_LENGTH}`, (err) => {
                if (err) {
                    conn.release();
                    err.appendDetails('QueryWorker', 'setSession', 'Error setting group_concat_max_len to 55555');
                    return reject(err);
                }
                return resolve();
            });
        });
    }

}

export default new QueryWorker();
