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
			data[i].log.color = '';
			for (var j = 0; i < 3; i++) {
				data[i].log.color += data[i].log.nick.charCodeAt(i);
			};
		}
		res.render('index',
		  	{
		  		title: Config.title,
		  		logs: data
		  	}
		);
	});
};