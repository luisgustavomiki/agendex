var assert = require('assert');
var _ = require('lodash');
var Procedure = require('../procedure.js');

module.exports = function(agenda) {
  var procedure = new Procedure('ninja.miki.json', agenda);
  
  procedure.define('fromstring', function(data, filters, params, done) {    
    assert(_.isString(data));
    data = JSON.parse(data);
    done(data, filters);
  });

  procedure.define('pick', function(data, filters, params, done) {
    done(data, filters);
  });
}