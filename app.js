
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , Config = require('./config.js').Config
  , startStopDaemon = require('start-stop-daemon')
  , moment = require("moment")
  , db = require("mongojs").connect(Config.databaseName, Config.databaseCollections)
  , md5 = require("MD5")
  , ent = require("ent");

// all environments
app.set('port', process.env.PORT || Config.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

startStopDaemon(function() {

	server.listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port'));
	});

	var now = moment().format("YYYY/MM/DD HH:mm:ss");

	io.sockets.on('connection', function(socket) {
		setInterval(function() {
	    	db.logs.find({channel: Config.filter, date: {$gt: now}}, function(err, data) {
	    		if(data.length > 0) {
	    			for (var i = 0; i < data.length; i++) {
						data[i].message = ent.decode(data[i].message);
						data[i].color = md5(data[i].nick).substring(1,7);
					}
	    			socket.emit("logs", data);
	    			now = moment().format("YYYY/MM/DD HH:mm:ss");
	    		}
	    	});
	    }, 1200);
	});

	app.get('/', routes.index);
});
