let app = (function () {

    let _currentDraw = "";

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    let stompClient = null;

    let addPointToCanvas = function (point) {        
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    let getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        let rect = canvas.getBoundingClientRect();
        return new Point(
            Math.round(evt.clientX - rect.left), 
            Math.round(evt.clientY - rect.top)
        );
    };


    let connectAndSubscribe = function (drawNumber) {
        _clearCanvas();
        _currentDraw = '/topic/newpoint.'+drawNumber;
        console.info('Connecting to WS...');
        let socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/newpoint when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe(_currentDraw, function (eventbody) {
                let point = JSON.parse(eventbody.body);
                addPointToCanvas(point);
            });
        });
    };
    
    let _publishMousePoint = function(event){
        let point = getMousePosition(event);
        console.info("publishing point at "+point);
        stompClient.send(_currentDraw, {}, JSON.stringify(point));
    }
    
    let _clearCanvas = function(){
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    return {

        init: function () {
            let can = document.getElementById("canvas");
            let btn = document.getElementById("load");
            if(window.PointerEvent) can.addEventListener("pointerdown", _publishMousePoint);
            else canvas.addEventListener("mousedown", () => _publishMousePoint);
            btn.addEventListener("click", () => {
                connectAndSubscribe($("#drawNumber").val()); 
            });
            //websocket connection
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