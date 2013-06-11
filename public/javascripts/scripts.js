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
    var el = document.createElement('li');
    el.innerHTML = '<span class="date">&#91;' + data.date.substr(11) + '&#93;</span> <span class="color" style="color: #' + data.color + '">&lt;' + data.nick + "&gt;</span> " + data.message;
    return el;
}

function makeLogSearchLine(data) {
    var el = document.createElement('li');
    el.innerHTML = '<span class="date">&#91;' + data.date + '&#93;</span> <span class="color" style="color: #' + data.color + '">&lt;' + data.nick + "&gt;</span> " + data.message;
    return el;
}

function makeChattyLine(data) {
    var el = document.createElement('li');
    el.innerHTML = '<strong>' + data.nick + "</strong> with a total of " + data.count + ' lines.';
    return el;
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

    var delay = (function(){
        var timer = 0;
        return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
        };
    })();

    $("#search").on('keyup', function() {
        delay(function(){
            if($("#search").val() != "") {
                $("#datepicker").prop('disabled', true);
            } else {
                $("#datepicker").prop('disabled', false);
            }
            socket.emit("search", $("input[name='select-type']:checked").val(), $("#search").val());
        }, 1000 ); 
    });

    $("input[name='select-type']").on('change', function() {
        socket.emit("search", $("input[name='select-type']:checked").val(), $("#search").val());
    });

    socket.on('date logs', function(data) {
        $("#logs").html('');
        var i = 0, fragment = document.createDocumentFragment();
        while(i < data.length) {
            fragment.appendChild(makeLogLine(data[i]));
            i++;
        }
        $("#logs").append(fragment);
        scrollToTop();
    });

    socket.on('search', function(data) {
        $("#logs").html('');
        var i = 0, fragment = document.createDocumentFragment();
        while(i < data.length) {
            fragment.appendChild(makeLogSearchLine(data[i]));
        }
        $("#logs").append(fragment);
        scrollToBottom();
    });

    socket.on('logs', function(data) {
        $("#datepicker").datepicker('setDate', new Date(data[0].date));
        $("#logs").html('');
        var i = data.length-1, fragment = document.createDocumentFragment();
        while(i >= 0) {
            fragment.appendChild(makeLogLine(data[i]));
            i--;
        }
        $("#logs").append(fragment);
        scrollToBottom();
    });

    socket.on('new logs', function(data) {
        var shouldScrollToBottom = isScrolledToBottom();
        var i = 0, fragment = document.createDocumentFragment();
        while(i < data.length) {
            fragment.appendChild(makeLogLine(data[i]));
            i++;
        }
        $("#logs").append(fragment);
        if(shouldScrollToBottom) {
            scrollToBottom();
        } else {
            showNewLogsMessage(data.length);
        }
    });

    socket.on('chatty', function(data) {
        var numberOfUsers = data.length >= 10 ? 10 : data.length;
        $("#chatty-users").html(numberOfUsers);
        $("#chatty").html('');
        var i = 0, fragment = document.createDocumentFragment();
        while(i < numberOfUsers) {
            fragment.appendChild(makeChattyLine(data[i]));
            i++;
        }
        $("#chatty").append(fragment);
    });

    socket.on('no logs', function() {
        $("#logs").html('');
    });
});
