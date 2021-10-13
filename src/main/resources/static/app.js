var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return new Point(
            Math.round(evt.clientX - rect.left), 
            Math.round(evt.clientY - rect.top)
        );
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/newpoint when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                var point = JSON.parse(eventbody.body);
                addPointToCanvas(point);
            });
        });
    };
    
    _publishMousePoint = function(event){
        let point = getMousePosition(event);
        console.info("publishing point at "+point);
        stompClient.send("/topic/newpoint", {}, JSON.stringify(point));
    }
    

    return {

        init: function () {
            let can = document.getElementById("canvas");
            if(window.PointerEvent) can.addEventListener("pointerdown", _publishMousePoint);
            else canvas.addEventListener("mousedown", () => _publishMousePoint);
            //websocket connection
            connectAndSubscribe(); 
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();