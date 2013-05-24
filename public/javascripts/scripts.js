function scrollToBottom() {
	$("#logs").scrollTop($("#logs")[0].scrollHeight);
}

function scrollToTop() {
	$("#logs").scrollTop(0);
}

$(document).ready(function() {
	var socket = io.connect('http://localhost:3000');

	scrollToBottom();

	$("#datepicker").datepicker({ 
	    dateFormat: "yy/mm/dd",
	    defaultDate: 0,
	    maxDate: 1,
	    changeMonth: true,
	    changeYear: true,
	    onSelect: function(dateText, inst) {
	        var date = $.datepicker.formatDate("yy/mm/dd 00:00:00", $('#datepicker').datepicker('getDate'));
	        socket.emit("date change", date);
        }
    });

    socket.on('date logs', function(data) {
  		$("#logs").html('');
    	for (var i = 0; i < data.length; i++) {
    		$("#logs").append('<li><span class="date">' + data[i].date + '</span> <span style="color: #' + data[i].color + '">' + data[i].nick + "</span>: " + data[i].message + '</li>');
    	}
    	scrollToTop();
  	});

  	socket.on('logs', function(data) {
  		$("#logs").html('');
    	for (var i = 0; i < data.length; i++) {
    		$("#logs").append('<li><span class="date">' + data[i].date + '</span> <span style="color: #' + data[i].color + '">' + data[i].nick + "</span>: " + data[i].message + '</li>');
    	}
    	scrollToBottom();
  	});

  	socket.on('new logs', function(data) {
    	for (var i = 0; i < data.length; i++) {
    		$("#logs").append('<li><span class="date">' + data[i].date + '</span> <span style="color: #' + data[i].color + '">' + data[i].nick + "</span>: " + data[i].message + '</li>');
    	}
    	scrollToBottom();
  	});

  	socket.on('chatty', function(data) {
  		var numberOfUsers = data.length >= 5 ? 5 : data.length;
  		$("#mostChatty").html('');
    	for (var i = 0; i < numberOfUsers; i++) {
    		$("#mostChatty").append('<li>' + data[i].nick + " with a total of " + data[i].count + ' lines.</li>');
    	}
    	$("#leastChatty").html('')
    	for (var i = data.length-1; i >= data.length-numberOfUsers; i--) {
    		$("#leastChatty").append('<li>' + data[i].nick + " with a total of " + data[i].count + ' lines.</li>');
    	}
  	});
});