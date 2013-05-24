var express = require('express')
  , app = express()
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , Config = require('./config.js').Config
  , db = require("mongojs").connect(Config.databaseName, Config.databaseCollections)
  , md5 = require("MD5")
  , ent = require("ent")
  , moment = require("moment");

var lastId;
var isToday = true;

function parseData(data) {
	for (var i = 0; i < data.length; i++) {
		data[i].message = ent.decode(data[i].message);
		data[i].color = md5(data[i].nick).substring(1,7);
	}
	return data;
}

function emitChattyData(socket) {
	db.logs.group({
		key: {nick: true},
		cond: {channel: Config.filter},
		reduce: function(o,p){p.count += 1;},
		initial: {count:0}
	}, function(err, data) {
		data = data.sort(function(a,b) { return parseInt(b.count) - parseInt(a.count) } );
		socket.emit("chatty", data);
	});
}

function emitLogData(socket, limit) {
	db.logs.find({channel: Config.filter}).limit(limit, function(err, data) {
		if(data.length > 0) {
			lastId = data[data.length-1]._id;
			socket.emit("logs", parseData(data));
		}
	});
}

function emitLogDataOnDate(socket, from, to) {
	console.log(from, to);
	db.logs.find({channel: Config.filter, date: {$gte: from, $lt: to}}, function(err, data) {
		if(isToday) {
			lastId = data[data.length-1]._id;
		}
		socket.emit("date logs", parseData(data));
	});
}

function emitNewLogData(socket) {
	db.logs.find({channel: Config.filter, _id: {$gt: lastId}}, function(err, data) {
		if(data.length > 0) {
			lastId = data[data.length-1]._id;
			socket.emit("new logs", parseData(data));
			emitChattyData(socket);
		}
	});
}

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

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function(socket) {
	emitLogData(socket, 500);
	emitChattyData(socket);

	socket.on('date change', function(date) {
		var now = moment();
		var from = moment(date, "YYYY/MM/DD HH:mm:ss");
		var to = from.clone().add('days', 1);

		if(now.diff(from, 'days') == 0) {
			isToday = true;
		} else {
			isToday = false;
		}

		emitLogDataOnDate(socket, from.format("YYYY/MM/DD HH:mm:ss"), to.format("YYYY/MM/DD HH:mm:ss"));
	});

	setInterval(function() {
		if(isToday) {
			emitNewLogData(socket);
		}
	}, 1000);
});

app.get('/', routes.index);
