var assert = require('assert');
var _ = require('lodash');
var Procedure = require('../procedure.js');

module.exports = function(agenda) {
  var procedure = new Procedure('ninja.miki.string', agenda);
  
  procedure.define('reverse', function(data, filters, params, done) { 
    assert(_.isString(data));
    data = data.split("").reverse().join("");
    done(data, filters);
  });

  procedure.define('truncate', function(data, filters, params, done) {
    assert(_.isString(data));
    data = _.truncate(data, {'length': params.length, 'separator': params.separator, 'omission': params.omission});
    done(data, filters);
  });
}