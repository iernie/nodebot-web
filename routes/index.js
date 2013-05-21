/*
 * GET home page.
 */

var Config = require('../config.js').Config;
var db = require("mongojs").connect(Config.databaseName, Config.databaseCollections);
var ent = require("ent");

exports.index = function(req, res){
	db.logs.find({channel: Config.filter}, function(err, data) {
		for (var i = 0; i < data.length; i++) {
			data[i].log.message = ent.decode(data[i].log.message);
		}
		res.render('index',
		  	{
		  		title: Config.title,
		  		logs: data
		  	}
		);
	});
};