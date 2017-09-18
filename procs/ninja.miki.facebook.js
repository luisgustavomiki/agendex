const async = require('async');
const FB = require('fb');
const URL = require('url');
const _ = require('lodash');
var assert = require('assert');

module.exports = function(agenda) {
	agenda.define('ninja.miki.facebook.fetch_timeline', function(job, done) {
    var envelope = job.attrs.data;
    var params = envelope.params;
    var timelines = [];

    if(params['bulk?']) {
      timelines = envelope.data;
    } else {
      timelines = [envelope.data];
    }

    var fields = params['fields'];
    var page_limit = params['page-limit'];

    async.eachSeries(timelines, function(tl, callback) {
      var threshold = _.get(tl, params['threshold-property']);

      if(params.authentication.type == 'credentials') {
        if(params.authentication['fetch-from'] == 'data') {
          var client_id = _.get(tl, params.authentication['client-id-property']);
          var client_secret = _.get(tl, params.authentication['client-secret-property']);
        } else if(params.authentication['fetch-from'] == 'params') {
          var client_id = params.authentication['client-id'];
          var client_secret = params.authentication['client-secret'];
        }

        retrieveAccessToken({ client_id: client_id, client_secret: client_secret }, function(error, token) {
          assert.ifError(error);
          FB.setAccessToken(token);

          var unixtime = threshold.getTime()/1000;
          var fbparams = { 
            since: unixtime,
            fields: fields,
            limit: page_limit
          }

          processFacebookFeed (_.get(tl, params['fbobject-property']) + '/feed', fbparams, function(error, data) {
            assert.ifError(error);
            envelope.data = data;
          });
        });
      }
    });
    //console.log(job.attrs.data);
		console.log("HELLO FROM FETCH TIMELINE");
		done();
	});	
}

function processFacebookFeed (feed, params, cb) {
  var totalResults, done;
    totalResults = []; // progressively store results here
    done = false; // will be set to true to terminate loop

  async.doUntil(function(callback) {
    // body of the loop
    FB.napi(feed, params, function(err, result) {
      if (err) return callback(err);
        totalResults = totalResults.concat(result.data);
        // console.log("PAGING CYCLE");
        if (result.data.length === 0 || !result.paging.next) {
          done = true;
        } else {
          params = URL.parse(result.paging.next, true).query;
        }
        callback();
      }); // FB.napi
    }, function() {
      // test for loop termination
      return done;
    }, function (err) {
      cb(err, totalResults);
    }
  ); // async.doUntil
}

function retrieveAccessToken(credentials, callback) {
  FB.api('oauth/access_token', {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    grant_type: 'client_credentials'
  }, function (res) {
    callback(res.error, res.access_token);
  });
}