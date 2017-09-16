var assert = require('assert');
var _ = require('lodash');

module.exports = function(agenda) {
  var procedure = require('procedure.js')('ninja.miki.json', agenda);

  procedure.define('fromstring', function(envelope, input, done) {
    var data = input;
    
    assert(_.isString(data));
    data = JSON.parse(data);
    done(data);
  });

  procedure.define('pick', function(envelope, input, done) {

  });

  agenda.define('ninja.miki.json.fromstring', function(job, done) {
    
  }); 

/*
    - proc: "ninja.miki.json.pickby"
      params:
        criteria: ['']
*/ 
  agenda.define('ninja.miki.json.pick', function(job, done) {
    var params = job.attrs.data.params;
    var data = job.attrs.data.data;
    
    assert(_.isString(data));
    data = JSON.parse(data);
    done();
  }); 

}