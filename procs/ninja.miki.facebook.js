
module.exports = function(agenda) {
	agenda.define('ninja.miki.facebook.fetch_timeline', function(job, done) {
    console.log(job.attrs.data);
		console.log("HELLO FROM FETCH TIMELINE");
		done();
	});	
}