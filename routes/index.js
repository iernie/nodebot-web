/*
 * GET home page.
 */

var db = require("mongojs").connect("nodebot", ["logs"]);
var ent = require("ent");

exports.index = function(req, res){
	db.logs.find({channel: '#channel'}, function(err, data) {
		for (var i = 0; i < data.length; i++) {
			data[i].log.message = ent.decode(data[i].log.message);
		}
		res.render('index',
		  	{
		  		title: 'Channel logs',
		  		logs: data
		  	}
		);
	});
};