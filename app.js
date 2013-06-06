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
  , moment = require("moment");

function parseData(data) {
	for (var i = 0; i < data.length; i++) {
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

function emitLogData(socket, limit) {
	dbCollection.find({channel: Config.filter}).sort({$natural: -1}).limit(limit, function(err, data) {
		if(data.length > 0) {
			socket.lastId = data[0]._id;
			socket.emit("logs", parseData(data));
		}
	});
}

function emitLogDataOnDate(socket, date) {
	date = moment(date);
	if(date.isValid()) {

		if(moment().diff(date, 'days') == 0) {
			socket.isToday = true;
		} else {
			socket.isToday = false;
		}

		var endDate = date.clone().add('days', 1);
		var searchCriteria = {channel: Config.filter, date: {$gte: date.format("YYYY/MM/DD HH:mm:ss"), $lt: endDate.format("YYYY/MM/DD HH:mm:ss")}};

		dbCollection.find(searchCriteria, function(err, data) {
			if(data.length > 0) {
				if(socket.isToday) {
					socket.lastId = data[data.length-1]._id;
				}
				socket.emit("date logs", parseData(data));
			} else {
				socket.emit("no logs");
			}
		});
	}
}

function emitSearchData(socket, type, search) {

	var searchCriteria = {channel: Config.filter};
	if(type == "nick") {
		searchCriteria.nick = { $regex: search, $options: 'i' };
	} else if(type == "log") {
		searchCriteria.message = { $regex: search, $options: 'i' };
	} else {
		socket.emit("no logs");
	}

	dbCollection.find(searchCriteria, function(err, data) {
		if(data.length > 0) {
			socket.emit("search", parseData(data));
		} else {
			socket.emit("no logs");
		}
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

	emitLogData(socket, 200);
	emitChattyData(socket);

	socket.on('date change', function(date) {
		emitLogDataOnDate(socket, date);
	});

	socket.on('search', function(type, search) {
		if(search != "") {
			socket.isToday = false;
			emitSearchData(socket, type, search);
		} else {
			emitLogData(socket, 200);
		}
	});

	setInterval(function() {
		if(socket.isToday) {
			emitNewLogData(socket);
		}
	}, 1000);
});

app.get('/', routes.index);
