/**
 * Created by pubudud on 9/4/17.
 */

import dbManager from '../dbManager';
import mysqlStubManager from './mysqlStubManager';
import {expect} from 'chai';

let createPoolStub = {},
    poolCount = 1;
const dbConfig = {
    database: 'my_db',
    connectionLimit: 10
};

describe('DB Manager Tests', () => {

    before(() => {
        createPoolStub = mysqlStubManager.initCreatePool();
    });

    after(() => {
        mysqlStubManager.restoreStubs();
    });

    it('Initializes dbManager by creating the default pool', () => {
        dbManager.init(dbConfig);

        expect(dbManager.dbConfig).to.deep.equal(dbConfig);
        expect(createPoolStub.calledOnce).to.be.true;
    });

    it('creates a new pool given the minimal configs', () => {
        dbManager.createConnectionPool('pool1');
        poolCount++;

        expect(dbManager.pools).not.to.be.undefined;
        expect(dbManager.pools.default).not.to.be.undefined;
        expect(dbManager.pools.default.pool1).not.to.be.undefined;

        expect(createPoolStub.calledTwice).to.be.true;
        expect(createPoolStub.getCall(1).args[0]).to.deep.equal(dbConfig);
    });

    it('creates a new pool given the second minimal configs', () => {
        const POOL_SIZE = 5;
        dbManager.createConnectionPool('pool2', POOL_SIZE);
        poolCount++;

        expect(dbManager.pools).not.to.be.undefined;
        expect(dbManager.pools.default).not.to.be.undefined;
        expect(dbManager.pools.default.pool2).not.to.be.undefined;

        expect(createPoolStub.calledThrice).to.be.true;
        expect(createPoolStub.calledWith({
            ...dbConfig,
            connectionLimit: POOL_SIZE
        })).to.be.true;
    });

    it('creates a new pool with override configs', () => {
        const POOL_SIZE = 7;
        dbManager.createConnectionPool('db2_pool1', POOL_SIZE, {
            ...dbConfig,
            database: 'second_db'
        });
        poolCount++;

        expect(dbManager.pools).not.to.be.undefined;
        expect(dbManager.pools.default).not.to.be.undefined;
        expect(dbManager.pools.second_db.db2_pool1).not.to.be.undefined;

        expect(createPoolStub.callCount).to.eq(poolCount);
        expect(createPoolStub.calledWith({
            ...dbConfig,
            connectionLimit: POOL_SIZE,
            database: 'second_db'
        })).to.be.true;
    });

    it('returns the correct connection pool', () => {
        expect(dbManager.getConnectionPool()).not.to.be.undefined;
        expect(dbManager.getConnectionPool('pool1')).not.to.be.undefined;
        expect(dbManager.getConnectionPool('pool2')).not.to.be.undefined;
        expect(dbManager.getConnectionPool('db2_pool1', 'second_db')).not.to.be.undefined;
        expect(dbManager.getConnectionPool('pool_not')).to.be.null;
        expect(dbManager.getConnectionPool('pool_not', 'db_not')).to.be.null;
    });

    it('ends the session', () => {
        dbManager.end();
        expect(dbManager.getConnectionPool().end.callCount).to.eq(poolCount);
    });

});
