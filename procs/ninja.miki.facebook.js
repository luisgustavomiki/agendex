const async = require('async');
const FB = require('fb');
const URL = require('url');

module.exports = function(agenda) {
	agenda.define('ninja.miki.facebook.fetch_timeline', function(job, done) {
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
    }); // async.doUntil
}