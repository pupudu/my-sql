/**
 * Created by pubudud on 8/30/17.
 */

/* eslint-disable */

import {initSession, executeQuery, executeTransaction, endSession} from './index';

/**
 * Tester module for demonstrations and dev testing
 */
class Tester {

    /**
     * Start Example program
     */
    start() {
        initSession({
            "connectionLimit": 50,
            "acquireTimeout": 60000,
            "host": "localhost",
            "port": "3306",
            "user": "root",
            "password": "gvt123",
            "database": "MY_SQL_NPM",
            "charset": "UTF8_GENERAL_CI",
            "debug": false,
            "waitForConnections": true,
            "queueLimit": 15000
        });

        executeTransaction({
            queries: [
                {
                    query: 'SELECT * FROM ABC'
                }, {
                    query: 'SELECT ID FROM ABC'
                }
            ]
        })
            .then((result) => {
                console.log(JSON.stringify(result));
                // endSession();
            })
            .catch((err) => {
                console.log(err)
            });

        executeQuery('SELECT * FROM ABC where ID > ?', [13])
            .then((result) => {
                console.log(result);
            })
            .catch((err) => {
                console.log(err);
            })

    }
}

const tester = new Tester();

tester.start();
