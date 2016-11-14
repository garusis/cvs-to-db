Simple script to fill a table database with large csv files
===================


This Node.js script was writted thinking in use large cvs files to fill postgresql databases using [csvtojson](https://github.com/Keyang/node-csvtojson) and [knex](knexjs.org). 

----------

Instructions
-------------

 - Install npm modules with `npm install`.
 - run `node migrate.js --option1 val1 --option2 val2 ... --optionN valN`

**Example**

	node formatData.js --host localhost --user userdb --password passdb --database test --table tabletest --file ./seeder.csv


**options:**

> - host: `String (Default: localhost)`
> - user: `String (Default: admin) `
> - password: `String (Default: admin) `
> - database: `String (Default: test) `
> - table: `String (Default: test) `
> - file: `String (Default: ./test.csv) `
> - maxRecords: `Number (Default: 20) `
> - maxTransactions: `Number (Default: 10) `