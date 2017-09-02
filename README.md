# My-Sql

[![Code Climate](https://codeclimate.com/github/pupudu/my-sql/badges/gpa.svg)](https://codeclimate.com/github/pupudu/my-sql)
[![Build Status](https://travis-ci.org/pupudu/my-sql.svg?branch=master)](https://travis-ci.org/pupudu/my-sql)
[![Coverage Status](https://coveralls.io/repos/github/pupudu/my-sql/badge.svg?branch=master)](https://coveralls.io/github/pupudu/my-sql?branch=master)

my-sql is a wrapper on the popular npm [mysql](https://www.npmjs.com/package/mysql) 
package for providing means to painlessly interact with a mysql database. 

**This library by default exposes everything that mysql exposes**. Thus you 
don't need to install mysql separately if you use my-sql.
 
 In other words, **my-sql** is **mysql** + some_extras

The idea is that the pain of creating and managing a connection pool, and
the need to release connections as required is taken care of internally, without
compromising any performance at all.

## Table of Contents

- [Install](#install)
- [Migrating from mysql](#migrating-from-mysql)
- [Basic Usage](#basic-usage)
- [Closing All Connections](#closing-all-connections)

## Install

```
npm install my-sql
```

## Migrating from mysql

The default export in this library is the original `mysql` package. For example you can
do the following.

```js
import mysql from 'my-sql'

mysql.createConnection({/*database_config*/});
```
    
or in another way,

```js
import {createPool} from 'my-sql';
```

This library will always continue to be up-to-date with the original mysql package.

Thus the migration involves only the following change; wherever you are importing
something from the original `mysql` package, just replace it with `my-sql`.
 
 That is Replace, `import mysql from 'mysql'` with `import mysql from 'my-sql'`
     
Please refer to the [original docs](https://www.npmjs.com/package/mysql) to see what 
awesome things that [npm mysql](https://www.npmjs.com/package/mysql) can do. 
Continue reading to see what additional methods we have included in this library. 

## Basic Usage

First you need to create a session by providing db configurations. These are the same
 configs that you would provide to create a connection pool using the `mysql` package.
  
```js
import {initSession, executeQuery, executeTransaction} from 'my-sql'

initSession({
  connectionLimit : 10,
  host            : 'example.org',
  user            : 'bob',
  password        : 'secret',
  database        : 'my_db'
});
```
    
Then you can simply execute queries or transactions on the `my_db` database. 

```js
    executeQuery('SELECT * FROM test_table WHERE count > ? LIMIT ?', [100, 10])
        .then((result)=>{
            // Do something with the result array  
        })
        .catch((err)=>{
            // Some error has occured
        });
```
    
or multiple queries as an atomic transaction

```js
executeTransaction({
    queries: [{
        query: 'SELECT * FROM test_table WHERE 1 limit ?',
        args: [10]
    }, {
        query: 'INSERT INTO test_table (ID, Name) VALUES (1234, ?)',
        args: ["Dodan"]
    }]
}).then((results)=>{
    // Do something with the results array array (i.e: an array of result arrays)  
});
```

**As of now all new methods send back data as promises. If you want us to provide support for
callbacks, please open an issue in the github repository.**

## Closing All Connections

All connections, which are created internally, are sent back to the pool instead of destroying. That is,
the methods exposed from this package are optimized. However, since the released
connections are sent back to the pool without destroying, it will keep the NodeJs
event-loop active. 

Thus if all queries that are supposed to be run by the entire application are finished,
you can call the endSession to destroy all connections in all pools. Yet we
don't think this is required at all in a real world application since database
operations will normally continue to run as long as the NodeJs server is
running

```js
import {endSession} from 'my-sql'

endSession();
```
