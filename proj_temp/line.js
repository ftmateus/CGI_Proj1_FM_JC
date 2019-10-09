var gl;
var canvas;
var bufferlineId;
var bufferParticlesId;
var vPosition;
var startPos;
var endPos;
var isDrawing = false;
var currentPos = vec2(0,0);
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
    program_particles = initShaders(gl, "vertex-shader-particles", "fragment-shader");
    
    
    bufferlineId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);

    //Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program_line, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    loadParticlesProgram();

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
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos, endPos]));
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);
    


    //considerando que o intervalo de tempo e 1 nas 2 componentes
    speedX = 0.5*(endPos[0] - startPos[0]);
    speedY = 10*(endPos[1] - startPos[1]);

    currentPos[0] = startPos[0];


    data = new Float32Array([startPos[0], startPos[1], speedX, speedY, global_time]);
    console.log(data);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    gl.bufferSubData(gl.ARRAY_BUFFER, (numParticles)*(2*4 + 2*4 + 4), data);
    numParticles++;
    //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos[0], startPos[1], speedX, speedY, global_time]));
}

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));   
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
    //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));  
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.POINTS, 0, 1); 
    gl.drawArrays(gl.LINES, 0, 2); 
}

function loadParticlesProgram()
{
    bufferParticlesId = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticlesId);
    var size = 65000*(2*4 + 2*4 + 4*2);
    gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);

    startPosLoc = gl.getAttribLocation(program_particles, "startPos");
    speedLoc = gl.getAttribLocation(this.program_particles, "speed");
    timeLoc = gl.getAttribLocation(this.program_particles, "time");    
    global_timeLoc = gl.getUniformLocation(this.program_particles, "global_time");
}

function moveParticles()
{
    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    gl.vertexAttribPointer(startPosLoc, 2, gl.FLOAT, false,  (2*4 + 2*4 + 4), 0);
    gl.enableVertexAttribArray(startPosLoc);

    gl.vertexAttribPointer(speedLoc, 2, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4);
    gl.enableVertexAttribArray(speedLoc);

    gl.vertexAttribPointer(timeLoc, 1, gl.FLOAT, false, (2*4 + 2*4 + 4), 2*4 +2*4);
    gl.enableVertexAttribArray(this.timeLoc);


    global_time += 0.005; 
    gl.uniform1f(global_timeLoc, global_time);
    gl.drawArrays(gl.POINTS, 0, numParticles);
    //console.log(numParticles);
    
}