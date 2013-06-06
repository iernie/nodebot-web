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

function makeLogLine(data) {
    return '<li><span class="date">&#91;' + data.date.substr(11) + '&#93;</span> <span class="color" style="color: #' + data.color + '">&lt;' + data.nick + "&gt;</span> " + data.message + '</li>';
}

function makeLogSearchLine(data) {
    return '<li><span class="date">&#91;' + data.date + '&#93;</span> <span class="color" style="color: #' + data.color + '">&lt;' + data.nick + "&gt;</span> " + data.message + '</li>';
}

function makeChattyLine(data) {
    return '<li>' + data.nick + " with a total of " + data.count + ' lines.</li>';
}

$(document).ready(function() {
    var socket = io.connect('http://localhost:3000');
    $("#new-logs-message").hide();

    $("#logs").scroll(function() {
        if (isScrolledToBottom()) {
            $("#new-logs-message").slideUp(function() {
                $("#number-of-new-logs").html("0");
            });
        }
    })

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
            socket.emit("date change", $('#datepicker').datepicker('getDate'));
        }
    });

    $("#search-log").on('change', function() {
        socket.emit("search log", $(this).val(), $('#datepicker').datepicker('getDate'));
    });

    $("#search-nick").on('change', function() {
        socket.emit("search nick", $(this).val(), $('#datepicker').datepicker('getDate'));
    });

    socket.on('date logs', function(data) {
        $("#logs").html('');
        for (var i = 0; i < data.length; i++) {
            $("#logs").append(makeLogLine(data[i]));
        }
        scrollToTop();
    });

    socket.on('search', function(data) {
        $("#logs").html('');
        for (var i = 0; i < data.length; i++) {
            $("#logs").append(makeLogSearchLine(data[i]));
        }
        scrollToBottom();
    });

    socket.on('logs', function(data) {
        $("#datepicker").datepicker('setDate', new Date(data[0].date));
        $("#logs").html('');
        for (var i = data.length-1; i >= 0; i--) {
            $("#logs").append(makeLogLine(data[i]));
        }
        scrollToBottom();
    });

    socket.on('new logs', function(data) {
        var shouldScrollToBottom = isScrolledToBottom();
        for (var i = 0; i < data.length; i++) {
            $("#logs").append(makeLogLine(data[i]));
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
            $("#mostChatty").append(makeChattyLine(data[i]));
        }
        $("#leastChatty").html('')
        for (var i = data.length-1; i >= data.length-numberOfUsers; i--) {
            $("#leastChatty").append(makeChattyLine(data[i]));
        }
    });

    socket.on('no logs', function() {
        $("#logs").html('');
    });
});
