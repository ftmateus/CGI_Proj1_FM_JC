var gl;
var canvas;
var bufferlineId;
var bufferParticlesId;
var vPosition;
var startPos;
var endPos;
var isDrawing = false;
var currentPos = vec2(0,0);
var particlesInMov = [];
var speedLoc;
var startPosLoc;
var numParticles = 0;
var timeLoc;
var program_line;
var program_particles;
var global_time = 0;
var global_timeLoc;
var data;



window.onload = function init() {


    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    program_line = initShaders(gl, "vertex-shader-line", "fragment-shader");
    bufferlineId = gl.createBuffer();
    program_particles = initShaders(gl, "vertex-shader-particles", "fragment-shader");
    bufferParticlesId = gl.createBuffer();
    
    
    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);
    //Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program_line, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticlesId);
    var size = 65000*(2*4 + 2*4 + 4*2);
    gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);

    startPosLoc = gl.getAttribLocation(program_particles, "startPos");
    gl.vertexAttribPointer(startPosLoc, 2, gl.FLOAT, false,  (2*4 + 2*4 + 4), 0);
    gl.enableVertexAttribArray(startPosLoc);

    speedLoc = gl.getAttribLocation(this.program_particles, "speed");
    gl.vertexAttribPointer(this.speedLoc, 2, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4);
    gl.enableVertexAttribArray(speedLoc);

    timeLoc = gl.getAttribLocation(this.program_particles, "time");
    gl.vertexAttribPointer(this.timeLoc, 1, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4 +2*4);
    gl.enableVertexAttribArray(this.timeLoc);
    
    this.global_timeLoc = gl.getUniformLocation(this.program_particles, "global_time");

    canvas.addEventListener("mousedown",mouseDown);
    canvas.addEventListener("mouseup",mouseUp);
    canvas.addEventListener("mousemove",mouseMove);

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
    
    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(startPos));
    //gl.drawArrays(gl.POINTS, 0, 1);
}

function mouseUp(ev) {
    isDrawing = false;
    numParticles++;
    endPos = getMousePos(canvas,ev);

    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));
    //considerando que o intervalo de tempo e 1 nas 2 componentes
    speedX = 0.5*(endPos[0] - startPos[0]);
    speedY = 10*(endPos[1] - startPos[1]);

    currentPos[0] = startPos[0];

    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    data = flatten([startPos, vec2(speedX, speedY)]);
    //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos[0], startPos[1], speedX, speedY, global_time]));
}

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    
    //gl.useProgram(program_line);
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));   
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if(isDrawing)
        drawLine();

    if (numParticles > 0)
        moveParticles();
    
    requestAnimFrame(render);
}

function drawLine()
{
    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));  
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2); 
}

function moveParticles()
{
    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

    startPosLoc = gl.getAttribLocation(program_particles, "startPos");
    gl.vertexAttribPointer(startPosLoc, 2, gl.FLOAT, false,  (2*4 + 2*4 + 4), 0);
    gl.enableVertexAttribArray(startPosLoc);

    speedLoc = gl.getAttribLocation(this.program_particles, "speed");
    gl.vertexAttribPointer(this.speedLoc, 2, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4);
    gl.enableVertexAttribArray(speedLoc);

    timeLoc = gl.getAttribLocation(this.program_particles, "time");
    gl.vertexAttribPointer  (this.timeLoc, 1, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4 +2*4);
    gl.enableVertexAttribArray(this.timeLoc);
    global_time += 0.001; 
    gl.uniform1f(global_timeLoc, global_time);
    gl.drawArrays(gl.POINTS, 0, numParticles);
    
}