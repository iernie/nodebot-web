/*
 * GET home page.
 */

var Config = require('../config.js').Config;

exports.index = function(req, res){
	res.render('index',
	  	{
	  		"title": Config.title
	  	}
	);
};