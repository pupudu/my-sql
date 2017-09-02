/**
 * Created by pubudud on 8/29/17.
 */

import mysql, {
    createPool as createPool_,
    Types as Types_,
    createQuery as createQuery_,
    createConnection as createConnection_,
    createPoolCluster as createPoolCluster_,
    format as format_,
    escapeId as escapeId_,
    escape as escape_
} from 'mysql';
import mysqlFacade from './mysqlFacade';
import dbManager from './dbManager';

Error.prototype.appendDetails = function (className, method, cause) {
    this.path = `${(this.path || '#')} -> [${className}]|(${method})`;
    this.causes = `${(this.causes || '#')} -> (${method})|${cause}`;
};


export * from 'mysql';
export default mysql;

export const executeQuery = mysqlFacade.execute.bind(mysqlFacade);
export const executeTransaction = mysqlFacade.executeTransaction.bind(mysqlFacade);

export const initSession = dbManager.init.bind(dbManager);
export const endSession = dbManager.end.bind(dbManager);

export const createPool = createPool_;
export const Types = Types_;
export const createQuery = createQuery_;
export const createConnection = createConnection_;
export const createPoolCluster = createPoolCluster_;
export const format = format_;
export const escapeId = escapeId_;
export const escape = escape_;
