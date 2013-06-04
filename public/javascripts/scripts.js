function scrollToBottom() {
    $("#logs").scrollTop($("#logs")[0].scrollHeight);
}

function scrollToTop() {
    $("#logs").scrollTop(0);
}

function isScrolledToBottom() {
    var logs = $("#logs")[0];
    return (logs.scrollTop >= (logs.scrollHeight - logs.offsetHeight));
}

function showNewLogsMessage(logs) {
    var totalNumberOfLogs = parseInt($("#number-of-new-logs").html()) + logs;
    $("#number-of-new-logs").html(totalNumberOfLogs);
    $("#new-logs-message").slideDown();
}

$(document).ready(function() {
    var socket = io.connect('http://localhost:3000');

    $("#logs").scroll(function() {
        if (isScrolledToBottom()) {
            $("#number-of-new-logs").html("0");
            $("#new-logs-message").slideUp();
        }
    })

    $("#new-logs-message").hide();
    $("#new-logs-message a").on('click', function(e) {
        e.preventDefault();
        scrollToBottom();
        $("#new-logs-message").slideUp();
    });

    $("#scroll a").on('click', function(e) {
        e.preventDefault();
        scrollToBottom();
    });

    $("#datepicker").datepicker({ 
        dateFormat: "yy/mm/dd",
        defaultDate: 0,
        maxDate: 0,
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
            $("#logs").append('<li><span class="date">&#91;' + data[i].date.substr(11) + '&#93;</span> <span class="color" style="color: #' + data[i].color + '">&lt;' + data[i].nick + "&gt;</span> " + data[i].message + '</li>');
        }
        scrollToTop();
    });

    socket.on('logs', function(data) {
        $("#datepicker").datepicker('setDate', new Date(data[0].date));
        $("#logs").html('');
        for (var i = data.length-1; i >= 0; i--) {
            $("#logs").append('<li><span class="date">&#91;' + data[i].date.substr(11) + '&#93;</span> <span class="color" style="color: #' + data[i].color + '">&lt;' + data[i].nick + "&gt;</span> " + data[i].message + '</li>');
        }
        scrollToBottom();
    });

    socket.on('new logs', function(data) {
        var shouldScrollToBottom = isScrolledToBottom();
        for (var i = 0; i < data.length; i++) {
            $("#logs").append('<li><span class="date">&#91;' + data[i].date.substr(11) + '&#93;</span> <span class="color" style="color: #' + data[i].color + '">&lt;' + data[i].nick + "&gt;</span> " + data[i].message + '</li>');
        }
        if(shouldScrollToBottom) {
            scrollToBottom();
        } else {
            showNewLogsMessage(data.length);
        }
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

    socket.on('no logs', function() {
        $("#logs").html('');
    });
});
