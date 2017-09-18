var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

module.exports = function(agenda) {
  agenda.define('ninja.miki.mongodb.find', function(job, done) {
    var params = job.attrs.data.params;
    
    MongoClient.connect(params.mongouri, function(err, db) {
      assert.equal(null, err);

      db.collection(params.collection).find(params.query).toArray(function (err, res) {
        assert.equal(null, err);
        
        job.attrs.data.data = res;

        db.close();
        done();
      });
    });
  }); 

  agenda.define('ninja.miki.mongodb.aggregate', function(job, done) {
    var params = job.attrs.data.params;

    console.log(params.query);
    
    MongoClient.connect(params.mongouri, function(err, db) {
      assert.equal(null, err);

      db.collection(params.collection).aggregate(params.query).toArray(function (err, res) {
        assert.equal(null, err);
        
        job.attrs.data.data = res;

        db.close();
        done();
      });
    });
  }); 
}