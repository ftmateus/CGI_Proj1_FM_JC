var gl;
var canvas;
var bufferId;
var vPosition;

var startPos;
var endPos;
var isDrawing;


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
    
    isDrawing = false;
    render();
}

function getMousePos(canvas, ev) {
    var x = -1 + 2 * ev.offsetX/canvas.width; 
    var y = -1 + 2 * (canvas.height-ev.offsetY)/canvas.height;
    return vec2(x,y);    
}

function mouseDown(ev) {
    isDrawing = true;
    startPos = endPos = getMousePos(canvas, ev);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(startPos));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);
    var pos = [endPos, startPos];
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubDataData(gl.ARRAY_BUFFER, 8, flatten(endPos));    
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
    
    requestAnimFrame(render);
}
