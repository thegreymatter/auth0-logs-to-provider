const async = require('async');
const request = require('request');
const loggingTools = require('auth0-log-extension-tools');
const { Client } = require('@elastic/elasticsearch')
const config = require('../config');
const logger = require('../logger');

module.exports = () => {
  const now = Date.now();

  const client = new Client({
    cloud: {
      id: config('ELASTIC_ID'),
    },
    auth: {
      username: config('ELASTIC_USERNAME'),
      password: config('ELASTIC_PASSWORD')
    }
  })

  const sendLog = function(log, callback) {
    if (!log) {
      return callback();
    }

    const index = config('ELASTIC_INDEX');

    const data = {
      post_date: now,
      type_description: loggingTools.logTypes.get(log.type)
    };

    Object.keys(log).forEach((key) => {
      data[key] = log[key];
    });
    data.message = JSON.stringify(log);

    client.index({
      index: index,
      body: {
        character: 'Daenerys Targaryen',
        quote: 'I am the blood of the dragon.'
      }
    }).then(x=>callback()).catch(error=>callback(error))
  };

  return (logs, callback) => {
    if (!logs || !logs.length) {
      return callback();
    }

    logger.info(`Sending ${logs.length} logs to Elastic Cloud.`);

    async.eachLimit(logs, 10, sendLog, callback);
  };
};
