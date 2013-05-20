/*
 * GET home page.
 */

var db = require("mongojs").connect("nodebot", ["logs"]);

exports.index = function(req, res){
	db.logs.find(function(err, data) {
		res.render('index',
		  	{
		  		title: 'Channel logs',
		  		logs: data
		  	}
		);
	});
};