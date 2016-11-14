'use strict';

const nconf = require('nconf');
const async = require('async');
const _ = require('lodash');
const Converter = require("csvtojson").Converter;

const defaults = {
    host: 'localhost',
    user: 'admin',
    password: 'admin',
    database: 'test',
    table: 'test',
    file: './test.csv',
    maxRecords: 20,
    maxTransactions:10
};

nconf
    .argv()
    .env()
    .defaults(defaults);


const envVars = nconf.get();

const knex = require('knex')({
    client: 'pg',
    connection: {
        host: envVars.host,
        user: envVars.user,
        password: envVars.password,
        database: envVars.database
    },
    pool: {min: 2, max: 10}
});



let converter = new Converter({});

let maxRecords = envVars.maxRecords;
let maxTransactions = envVars.maxTransactions;
let table = envVars.table;
let file = envVars.file;

function treatObject(jsonObj) {
    let newObj = {};

    _.forEach(jsonObj, function (value, key) {
        if ('string' === typeof value) {
            if (value === '') {
                return;
            }

            //parse float numbers like 3,1416 to 3.1416
            let parsed = value.replace(',', '.');
            parsed = Number(parsed);
            if (!isNaN(parsed)) {
                value = parsed;
            }
        }
        newObj[key] = value;
    });

    return newObj;
}

function sendTransaction(recordsInTransaction, cb) {
    knex
        .transaction(function (trx) {
            return knex(table)
                .transacting(trx)
                .insert(recordsInTransaction)
                .timeout(60000)
                .then(trx.commit)
                .catch(trx.rollback);
        })
        .catch(function (err) {
            let message = err.message;

            //code for timeout is undefined
            if (_.includes(message, 'timeout') && _.includes(message, 'exceeded')) {
                return sendTransaction(recordsInTransaction, cb);
            }

            console.log('Records with ids ', JSON.stringify(_.map(recordsInTransaction, 'id')), ' couldn\'t be saved');
            console.error(err.detail);
        })
        .finally(cb);
}

converter.on("end_parsed", function (jsonArray) {
    async.timesLimit(Math.ceil(jsonArray.length / maxRecords), maxTransactions, function (index, cb) {
        let tempRecords = _.map(jsonArray.splice(0, maxRecords), treatObject);
        sendTransaction(tempRecords, cb);
    }, function () {
        let endTime = Date.now();
        console.log('Finished at ', (endTime - startTime) / (60000), 'Min');
        clearInterval(intervalId);
        process.exit(0);
    });

    let startTime = Date.now();
    console.log(`Starting to fill "${table}" table with ${jsonArray.length} records`);

    let intervalId = setInterval(function () {
        console.log('Remaining records: ', jsonArray.length);
    }, 60000);
});

//read from file
require("fs").createReadStream(file).pipe(converter);