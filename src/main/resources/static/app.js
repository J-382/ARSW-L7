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
        console.log(point);
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

    _drawPoint = function(eventbody){
        let data;
        data = JSON.parse(eventbody.body);
        try {
            data.forEach(element => {
                addPointToCanvas(element);
            });
        } catch (err){
            addPointToCanvas(data);
        }
    }

    _drawPolygon = function(eventbody){
        let data;
        data = JSON.parse(eventbody.body);
        let ctx = canvas.getContext("2d");
        ctx.beginPath();
        for(let i=0; i<data.length; i++){
            ctx.lineTo(data[i].x, data[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.translate(0,0);
    }


    let connectAndSubscribe = function (drawNumber) {
        _clearCanvas();
        _currentDraw = drawNumber;
        console.info('Connecting to WS...');
        let socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/newpoint when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe("/app/newpoint."+_currentDraw, _drawPoint);
            stompClient.subscribe("/app/newpolygon."+_currentDraw, _drawPolygon);
        });
    };
    
    let _publishMousePoint = function(event){
        let point = getMousePosition(event);
        console.info("publishing point at "+point);
        stompClient.send("/app/newpoint."+_currentDraw, {}, JSON.stringify(point));
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