const _ = require("lodash");
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

module.exports = class {
  constructor (module, agenda) {
    this.module = module;
    this.agenda = agenda;
  }
  define (name, code) {
    var module = this.module;
    var agenda = this.agenda; 

    // Defining the job agenda-wise
    agenda.define(module + '.' + name, function(job, done) {
      var envelope = job.attrs.data;
      var params = envelope.params;

      // Resolving 'source' param into /input/ so we can 
      // push it into the downstream variable
      var input = resolveParameter(params.source);
      if(!input) {
        // if there isnt any set for source, expect it to
        // be from 'data' field in envelope
        input = envelope.data;
      }

      // resolving parameters
      // the 'resolveParameter' function is recursive so
      // we can do pretty much any combination of ~codes
      _.forOwn(params, function(value, key) {
        params[key] = resolveParameter(value);
      });

      // when the defined job is called, after all the
      // setting up we did, finally call the procedure
      // code

      // for parameters, we send the envelope and not the
      // whole job object and as our custom 'done' callback
      // we set the data in the envelope as the only 
      // parameter for that callback and then call the actual
      // agenda /done/ callback :)
      code(job.attrs.data, function(downstream) {
        // TODO update filters
        job.attrs.data.data = downstream;
        done();
      });
    });
  }
}

function resolveParameter(input, envelope) {
  if(_.isObject(input) && input) {
    if(_.size(input) == 1) {
      var entries = _.toPairs(input);

      var key = entries[0][0];
      var value = entries[0][1];

      if(key == "~data") {
        return resolveParameter(envelope.data);
      }

      if(key == "~filter") {
        return resolveParameter(envelope.filters[value]);
      }

      if(key == "~xpath") {
        var source = resolveParameter(value['~source']);
        var path = resolveParameter(value['path']);

        var doc = new dom().parseFromString(source);
        return xpath.select(path, doc)[0].toString();
      }

      if(key == "~jpath") {
        
      }
    }
  }
  
  return input;
}