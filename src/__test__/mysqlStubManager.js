/**
 * Created by pubudud on 9/4/17.
 */

import sinon from 'sinon';
import mysql from 'mysql';

/**
 * Stub Manager for Device Dao
 */
class DeviceDaoStubManager {

    /**
     * Constructor
     */
    constructor() {
        this.sandbox = sinon.sandbox.create();
    }

    /**
     * Initialize all stubs of this module
     */
    initStubs() {
        // this.restoreStubs();
        // this.initCreatePool();
    }

    /**
     * Restore all stubs of this module
     */
    restoreStubs() {
        this.sandbox.restore();
    }

    /**
     * Init stub for getFirstDevice method
     * @returns {Object} - stub for reference
     */
    initCreatePool() {
        const createPool = this.sandbox.stub(mysql, 'createPool');

        const getConnectionStub = this.sandbox.stub();

        getConnectionStub.returns({
            execute: sinon.spy()
        });

        createPool.returns({
            getConnection: getConnectionStub,
            end: sinon.spy()
        });

        return createPool;
    }

}

export default new DeviceDaoStubManager();
