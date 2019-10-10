var gl;
var canvas;
var bufferlineId;
var bufferParticlesId;
var vPosition;
var startPos;
var endPos;
var isDrawing = false;
var speedLoc;
var exploSpeed;
var startPosLoc;
var numParticles = 0;
var timeLoc;
var program_line;
var program_particles;
var global_time = 0;
var global_timeLoc;
var firstExplosion;
const FLOAT_SIZE = 4;
const STARTPOS_SIZE = 2*FLOAT_SIZE,
SPEED_SIZE = 2*FLOAT_SIZE,
EXPLOSPEED_SIZE = 2*FLOAT_SIZE;
const TIME_SIZE = FLOAT_SIZE,
FIRSTEXPLOTIME_SIZE = FLOAT_SIZE;
const PARTICLE_STRIDE = 
STARTPOS_SIZE + SPEED_SIZE + EXPLOSPEED_SIZE+ TIME_SIZE + FIRSTEXPLOTIME_SIZE;

const NUM_PARTICLES = 65000;


window.onload = function init() {


    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
        
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program_line = initShaders(gl, "vertex-shader-line", "fragment-shader");
    program_particles = initShaders(gl, "vertex-shader-particles", "fragment-shader");
    
    loadLineProgram();
    loadParticlesProgram();

    canvas.addEventListener("mousedown",mouseDown);
    canvas.addEventListener("mouseup",mouseUp);
    canvas.addEventListener("mousemove",mouseMove);

    render();
}

function loadLineProgram()
{
    bufferlineId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program_line, "vPosition");
}

function loadParticlesProgram()
{
    bufferParticlesId = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticlesId);
    var buffer_size = NUM_PARTICLES*PARTICLE_STRIDE;
    gl.bufferData(gl.ARRAY_BUFFER, buffer_size, gl.STATIC_DRAW);

    startPosLoc = gl.getAttribLocation(program_particles, "startPos");
    speedLoc = gl.getAttribLocation(program_particles, "speed");
    exploSpeed = gl.getAttribLocation(program_particles, "exploSpeed");
    timeLoc = gl.getAttribLocation(program_particles, "time");    
    global_timeLoc = gl.getUniformLocation(program_particles, "global_time");
    firstExplosion = gl.getAttribLocation(program_particles, "firstExploTime");

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
    var count = Math.ceil(Math.random() * (250 /*max*/ - 10 /*min*/) + 10 /*min*/);

    //considerando que o intervalo de tempo e 1 nas 2 componentes
    var speedX = 5 *(endPos[0] - startPos[0]);
    var speedY = 8 *(endPos[1] - startPos[1]);

    //currentPos[0] = startPos[0];

    var t =  speedY/10.0;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);
    var thetaoffset = (2*Math.PI)/count;
    var theta = 0;

    while(theta <= 2*Math.PI)
    {
        // coordenadas polares
        var exploSpeedX = Math.random() * Math.cos(theta);
        var exploSpeedY = Math.random()* Math.sin(theta);
        theta += thetaoffset;

        var particle_data = new Float32Array([startPos[0], startPos[1], speedX, speedY, exploSpeedX, exploSpeedY, global_time, t]);
        gl.bufferSubData(gl.ARRAY_BUFFER, (numParticles)*PARTICLE_STRIDE, particle_data);

        if (++numParticles >= NUM_PARTICLES)
            numParticles = 0; //vai para o inicio do buffer, eliminando os antigos
    }
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

    moveParticles();
    
    requestAnimFrame(render);
}

function drawLine()
{
    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);  
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.POINTS, 0, 1); 
    gl.drawArrays(gl.LINES, 0, 2); 
}

function moveParticles()
{
    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    gl.vertexAttribPointer(startPosLoc, 2, gl.FLOAT, false, PARTICLE_STRIDE, 0);
    gl.enableVertexAttribArray(startPosLoc);

    gl.vertexAttribPointer(speedLoc, 2, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE);
    gl.enableVertexAttribArray(speedLoc);

    gl.vertexAttribPointer(exploSpeed, 2, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE);
    gl.enableVertexAttribArray(exploSpeed);

    gl.vertexAttribPointer(timeLoc, 1, gl.FLOAT, false, PARTICLE_STRIDE,
         STARTPOS_SIZE + SPEED_SIZE +EXPLOSPEED_SIZE);
    gl.enableVertexAttribArray(timeLoc);

    gl.vertexAttribPointer(firstExplosion, 1, gl.FLOAT, false, PARTICLE_STRIDE, 
         STARTPOS_SIZE + SPEED_SIZE +EXPLOSPEED_SIZE + TIME_SIZE);   
    gl.enableVertexAttribArray(firstExplosion);

    global_time += 0.005; 
    gl.uniform1f(global_timeLoc, global_time);
    gl.drawArrays(gl.POINTS, 0, numParticles);
}