const async = require('async');
const request = require('request');
const loggingTools = require('auth0-log-extension-tools');
const config = require('../config');
const logger = require('../logger');
//const maskJson = require('mask-json')
//const { delete } = require('request');

module.exports = () => {
  const now = Date.now();

  const sendLog = function(log, callback) {
    try{
    if (!log) {
      return callback();
    }
    const docid = Date.now();
    logger.info(JSON.stringify(log));
    const index = config('ELASTIC_INDEX');
    const data = {
      message: loggingTools.logTypes.get(log.type),
      auth:{},
      event:{dataset:"auth0"},
      log:{level:"info"}
    };

    //var redacter = require('mask-json')(['user_name','ip','email']);
    

   /* Object.keys(redacter(log)).forEach((key) => {
      data.auth[key] = log[key];
    });*/
    data["@timestamp"]=log.date
    const options = {
      method: 'POST',
      timeout: 2000,
      url: `${config('ELASTIC_HOST')}/${index}/_doc/`,
      headers: {'Content-Type': 'application/json' },
      body: data,
      json: true
    };

    options['auth'] = {
      user: config('ELASTIC_USER'),
      pass: config('ELASTIC_PASSWORD'),
      sendImmediately: true
    }
    
    request(options, (err, resp, body) => {
      if (err || (resp && resp.statusCode >= 300)) {
        const error = {
          error: {req:options,error:err, resp:resp, body:body},
          status: (resp && resp.statusCode) || 500,
        };
        logger.error(err);
        logger.error(JSON.stringify(resp));
        return callback(error);
      }

      return callback();
    });
  }
  catch(e) {
    const error = {
      error: {req:e.message},
      status: (resp && resp.statusCode) || 500,
    };
    return callback(error);
  }
  };

  return (logs, callback) => {
    logger.error(`Sending some logs to Elastic Cloud.`);
    if (!logs || !logs.length) {
      return callback();
    }

    logger.info(`Sending ${logs.length} logs to Elastic Cloud.`);

    async.eachLimit(logs, 10, sendLog, callback);
  };
};
