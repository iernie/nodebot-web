function scrollToBottom() {
	$("#logs").scrollTop($("#logs")[0].scrollHeight);
}

$(document).ready(function() {
	scrollToBottom();

	var socket = io.connect('http://moskus.co:3000');
  	socket.on('logs', function (data) {
    	for (var i = 0; i < data.length; i++) {
    		$("#logs").append('<li><span class="date">' + data[i].date + '</span> <span style="color: #' + data[i].color + '">' + data[i].nick + "</span>: " + data[i].message + '</li>');
    	}
    	scrollToBottom();
  	});
});