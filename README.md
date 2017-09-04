# My-Sql

[![Code Climate](https://codeclimate.com/github/pupudu/my-sql/badges/gpa.svg)](https://codeclimate.com/github/pupudu/my-sql)
[![Build Status](https://travis-ci.org/pupudu/my-sql.svg?branch=master)](https://travis-ci.org/pupudu/my-sql)
[![Coverage Status](https://coveralls.io/repos/github/pupudu/my-sql/badge.svg?branch=master)](https://coveralls.io/github/pupudu/my-sql?branch=master)
[![License](https://img.shields.io/npm/l/sequelize.svg?maxAge=2592000?style=plastic)](https://github.com/pupudu/my-sql/blob/master/LICENSE)

my-sql is a wrapper on the popular [mysql](https://www.npmjs.com/package/mysql) 
package for easily executing mysql **queries** and **transactions**. The pain of managing connection pools and
releasing connections after executing a query, is all taken care of internally. My-Sql also provides the 
ability to add custom middleware to modify the query and arguments dynamically. 

**This library by default exposes everything that mysql exposes. Thus you don't need to install 
mysql separately if you use my-sql.**
 
 In simple words, `my-sql`  =  `mysql` + **awesome_features**

## Table of Contents

- [Install](#install)
- [Migrating from mysql](#migrating-from-mysql)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Middleware](#middleware)
- [Closing All Connections](#closing-all-connections)

## Install

```
npm install my-sql
```

## Migrating from mysql

The default export in this library is the original `mysql` package. All other exports of the `mysql` package
are also exported by `my-sql` *without any modification*. 

Thus the migration involves only the following change; wherever you are importing something from the 
original `mysql` package, just replace it with `my-sql`.

For example

```js
import mysql, {createConnection, createPool} from 'my-sql';
```
... is identical to ...

```js
import mysql, {createConnection, createPool} from 'mysql';
```

**This library will always continue to be up-to-date with the original mysql package.**
     
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
        // Some error has occurred
    });
```
    
or multiple queries as an atomic transaction. We will take care of rolling back the transaction if something
goes wrong and make sure that the result is consistent.

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
    // Do something with the results array array (i.e: an array of result rows)  
}).catch((err)=>{
    // Some error has occurred
});
```

**As of now all new methods send back data as promises. If you want us to provide support for
callbacks, please open an issue in the github repository.**

## Advanced Usage

When using the `executeQuery` method, you can specify an options object as the 
first argument instead of the query itself. All possible built in fields are listed below

```json
{
    "query": "SELECT * FROM ...",
    "args": [],
    "pool": "vipPool",
    "lengthConstraint": 5555
}
```

For the `executeTransaction` method, you should anyway specify an object{query, args} array. The `pool`
and `lengthConstraint` arguments should be supplied after the {query,args} array.

you already know what `query` and `args` stand for. So let's talk about the other two fields.

##### Pool
When initializing the my-sql session by providing the database configs, we internally create a connection
 pool. This is the default connection pool. It will be used whenever you don't specify a connection pool 
  explicitly. However, you can use the `addInternalPool` method to create any number of additional 
  connection pools. This is useful when you want to have different thresholds for different use cases. 
  *If you don't understand why you need additional connection pools, you probably don't.*

```js
import {addInternalPool} from 'my-sql';

addInternalPool("vipPool", 5);
```

addInternalPool takes takes the form, `addInternalPool(poolName, poolSize, [overrideConfig])`. The optional 
3rd argument is useful when the pool should be configured with database config which is different from the
one you specified in `initSession` method. It is worth noting that even the database can be different here.

Now that a pool with name `vipPool` is created, you can use it as follows.

```js
executeQuery('SELECT * FROM test_table WHERE count > ? LIMIT ?', [100, 10], {pool: "vipPool"})
    .then((result)=>{
        // Do something with the result array  
    })
    .catch((err)=>{
        // Some error has occurred
    });
```
or 
```js
executeQuery({
    query: 'SELECT * FROM test_table WHERE count > ? LIMIT ?', 
    args:[100, 10], 
    pool: "vipPool"
})
    .then((result)=>{
        // Do something with the result array  
    })
    .catch((err)=>{
        // Some error has occurred
    });
```

##### Length Constraint
This parameter is useful when you have queries that group concat columns. When the concatenated string is
too long, it can cause problems. So to avoid that you can specify the maximum number of characters that 
would be concatenated. The rest will be discarded. 

You can pass in `true` as the lengthConstraint to use the default value of 5555 which is JSON parse-able.

## Middleware
One of the coolest things about this library is the ability to use custom middleware. A middleware in
my-sql context is a function which dynamically modifies the arguments supplied to the query execution method.
The function will basically accept the original options argument and will return a modified version of it.

A middleware is identified by a unique key or a name. Later, when you call the execute method with an 
 options object containing one or more middleware keys, corresponding middleware will be activated.
 
Let's elaborate this with a trivial example.

Suppose you have have an optional variable `count` and based on its value, you want to do the following.

* CASE 1: If count < 10 then Do not modify the query
* CASE 1: If count > 10 then you want to add an additional where condition to the query
* CASE 2: If count > 100 then you want to add an additional where condition and limit the results
 
For this scenario you can break the query into two parts and append parts as necessary.

```js
import {setMiddleware} from 'my-sql';

setMiddleware("countChecker", (options) => {
    
    let {query, count, suffix} = options;
    if (count > 10) {
       query += ` AND COUNT > ${count} ` // Case 1
    } 
    
    query += suffix; // Complete the query
    
    if (count > 100) {
        query += ' LIMIT 30'; // Case 2
    }
    
    options.query = query;
    
    return options;
});

```

Now when you can call the execute method as follows to activate the middleware,

```js
executeQuery({
    query: "SELECT * FROM ABC WHERE VALUE > 4 ", // First part of the query
    countChecker: true, // Activate the middleware
    count: my_variable, // Variable required to modify the query
    suffix: " GROUP BY CATEGORY " // Second part of the query
})
```

When the my_variable changes the resulting query will also change as follows,

* my_variable = 15 : `"SELECT * FROM ABC WHERE VALUE > 4 AND COUNT > 15 GROUP BY CATEGORY "`
* my_variable = 4 : `"SELECT * FROM ABC WHERE VALUE > 4 GROUP BY CATEGORY "`
* my_variable = 120 : `"SELECT * FROM ABC WHERE VALUE > 4 AND COUNT > 15 GROUP BY CATEGORY LIMIT 30"`

If you don't want to use a middleware, you just simply ignore the key("countChecker" in this case).
But you can even remove the middleware at any time by calling the `removeMiddleware` method with
the corresponding key.

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
