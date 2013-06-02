var express = require('express')
  , app = express()
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , Config = require('./config.js').Config
  , dbCollection = require("mongojs").connect(Config.databaseName).collection(Config.databaseCollection)
  , md5 = require("MD5")
  , ent = require("ent")
  , moment = require("moment");

function parseData(data) {
	for (var i = 0; i < data.length; i++) {
		data[i].message = ent.decode(data[i].message);
		data[i].color = md5(data[i].nick).substring(1,7);
	}
	return data;
}

function emitChattyData(socket) {
	dbCollection.group({
		key: {nick: true},
		cond: {channel: Config.filter},
		reduce: function(o,p){p.count += 1;},
		initial: {count:0}
	}, function(err, data) {
		data = data.sort(function(a,b) { return parseInt(b.count) - parseInt(a.count) } );
		socket.emit("chatty", data);
	});
}

function emitLogData(socket, limit, ascending) {
	dbCollection.find({channel: Config.filter}).sort({$natural: (ascending ? 1 : -1)}).limit(limit, function(err, data) {
		if(data.length > 0) {
			socket.lastId = data[data.length-1]._id;
			socket.emit("logs", parseData(data));
		}
	});
}

function emitLogDataOnDate(socket, from, to) {
	console.log(from, to);
	dbCollection.find({channel: Config.filter, date: {$gte: from, $lt: to}}, function(err, data) {
		if(socket.isToday) {
			socket.lastId = data[data.length-1]._id;
		}
		socket.emit("date logs", parseData(data));
	});
}

function emitNewLogData(socket) {
	dbCollection.find({channel: Config.filter, _id: {$gt: socket.lastId}}, function(err, data) {
		if(data.length > 0) {
			socket.lastId = data[data.length-1]._id;
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

if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

if ('production' == app.get('env')) {
	app.use(express.errorHandler()); 
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');
	io.set('log level', 1);
}

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function(socket) {
	socket.isToday = true;

	emitLogData(socket, 500, false);
	emitChattyData(socket);

	socket.on('date change', function(date) {
		var now = moment();
		var from = moment(date, "YYYY/MM/DD HH:mm:ss");
		var to = from.clone().add('days', 1);

		if(now.diff(from, 'days') == 0) {
			socket.isToday = true;
		} else {
			socket.isToday = false;
		}

		emitLogDataOnDate(socket, from.format("YYYY/MM/DD HH:mm:ss"), to.format("YYYY/MM/DD HH:mm:ss"));
	});

	setInterval(function() {
		if(socket.isToday) {
			emitNewLogData(socket);
		}
	}, 1000);
});

app.get('/', routes.index);
