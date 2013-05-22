/*
 * GET home page.
 */

var Config = require('../config.js').Config;
var db = require("mongojs").connect(Config.databaseName, Config.databaseCollections);
var ent = require("ent");
var md5 = require("MD5");

exports.index = function(req, res){
	db.logs.find({channel: Config.filter}, function(err, logs) {
		for (var i = 0; i < logs.length; i++) {
			logs[i].message = ent.decode(logs[i].message);
			logs[i].color = md5(logs[i].nick).substring(1,7);
		}
		db.logs.group({
			key: {nick: true},
			cond: {channel: Config.filter},
			reduce: function(o,p){p.count += 1;},
			initial: {count:0}
		}, function(err, chatty) {
			chatty.sort(function(a,b) { return parseInt(b.count) - parseInt(a.count) } );
			res.render('index',
			  	{
			  		"title": Config.title,
			  		"logs": logs,
			  		"chatty": chatty
			  	}
			);
		});
	});
	
};