var gl;
var canvas;
var bufferId;
var vPosition;
var move = false;
var startPos;
var endPos;
var isDrawing = false;
var velocityX;
var velocityY;
var velocity = vec2(0,0);
//var currentPosX;
//var currentPosY;
var currentPos = vec2(0,0);
var time = 0;
var particles;


window.onload = function init() {
    
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);
    
    //Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown",mouseDown);
    canvas.addEventListener("mouseup",mouseUp);
    canvas.addEventListener("mousemove",mouseMove);

    particles = [];
    render();
}

function getMousePos(canvas, ev) {
    var x = -1 + 2 * ev.offsetX/canvas.width; 
    var y = -1 + 2 * (canvas.height-ev.offsetY)/canvas.height;
    return vec2(x,y);    
}

function mouseDown(ev) {
    isDrawing = true;
    startPos = getMousePos(canvas, ev);
    endPos = startPos;
    move = false;
    time = 0;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(startPos));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);
    velocityX = 0.5*(endPos[0] - startPos[0]);
    velocityY = 10*(endPos[1] - startPos[1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));
    
    var particle = startPos;
    currentPos[0] = startPos[0];
    move = true;
}

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));   
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
   
    if(isDrawing) {
        
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 2);    
        
    }

    if (move)
        moveParticle();
    
    
    requestAnimFrame(render);
}

function moveParticle()
{
        currentPos[0] += 0.1 * velocityX;
        currentPos[1] = startPos[1] + velocityY*time + -1/2 * 10 * Math.pow(time, 2);
        time += 0.005;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(currentPos));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, 2);
            
}