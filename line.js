var gl;
var canvas;
var program_line, program_particles;
var bufferlineId, bufferParticlesId;
var startPos;
var endPos;
var isDrawing = false;
var startPosAttrib, timeAttrib, exploSpeedAttrib, speedAttrib, firstExplosionAttrib;
var vPositionAttrib;
var global_timeLoc;
var global_time = 0;
var numParticles = 0;
var automaticLaunchSet = false;

const NUM_PARTICLES = 65000;
const FLOAT_SIZE = 4;
const STARTPOS_SIZE = 2*FLOAT_SIZE,
SPEED_SIZE = 2*FLOAT_SIZE,
EXPLOSPEED_SIZE = 2*FLOAT_SIZE;
const TIME_SIZE = FLOAT_SIZE,
FIRSTEXPLOTIME_SIZE = FLOAT_SIZE;
const PARTICLE_STRIDE = 
STARTPOS_SIZE + SPEED_SIZE + EXPLOSPEED_SIZE+ TIME_SIZE + FIRSTEXPLOTIME_SIZE;



window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
        
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    initLineProgram();
    initParticlesProgram();

    canvas.addEventListener("mousedown",mouseDown);
    canvas.addEventListener("mouseup",mouseUp);
    canvas.addEventListener("mousemove",mouseMove);
    addEventListener("keypress", keyPress);

    render();
}

function keyPress(ev)
{
    if (ev.key == ' ' || ev.key == 'Spacebar')
    {
        if (automaticLaunchSet)
            automaticLaunchSet = false;
        else
            automaticLaunchSet = true;
    }
    console.log(automaticLaunchSet);
}

function automaticLaunch()
{
    var posX = Math.random() * (1 /*max*/  + 1 /*min*/) - 1 /*min*/;
    createParticle([posX, -1], [posX, -0.3]);
}

function initLineProgram()
{
    program_line = initShaders(gl, "vertex-shader-line", "fragment-shader");
    bufferlineId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);
    vPositionAttrib = gl.getAttribLocation(program_line, "vPosition");
}

function initParticlesProgram()
{
    program_particles = initShaders(gl, "vertex-shader-particles", "fragment-shader");

    bufferParticlesId = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferParticlesId);
    var buffer_size = NUM_PARTICLES*PARTICLE_STRIDE;
    gl.bufferData(gl.ARRAY_BUFFER, buffer_size, gl.STATIC_DRAW);

    startPosAttrib = gl.getAttribLocation(program_particles, "startPos");
    speedAttrib = gl.getAttribLocation(program_particles, "speed");
    exploSpeedAttrib = gl.getAttribLocation(program_particles, "exploSpeed");
    timeAttrib = gl.getAttribLocation(program_particles, "time");    
    firstExplosionAttrib = gl.getAttribLocation(program_particles, "firstExploTime");
    global_timeLoc = gl.getUniformLocation(program_particles, "global_time");
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

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));   
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);

    createParticle(startPos, endPos);
}

function createParticle(startPos_i, endPos_i)
{
    //considerando que o intervalo de tempo e 1 nas 2 componentes
    var speedX = 5 *(endPos_i[0] - startPos_i[0]);
    var speedY = 7 *(endPos_i[1] - startPos_i[1]);

    var explosion_time =  speedY/10.0;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);
    var num_explosion_particles = Math.ceil(Math.random() * (250 /*max*/ - 10 /*min*/) + 10 /*min*/);
    var thetaoffset = (2*Math.PI)/num_explosion_particles;

    for (var theta = 0 ; theta <= 2*Math.PI; theta += thetaoffset)
    {
        // coordenadas polares
        var exploSpeedX = Math.random() * Math.cos(theta);
        var exploSpeedY = Math.random()* Math.sin(theta);

        var particle_data = new Float32Array([startPos_i[0], startPos_i[1], speedX, speedY, exploSpeedX, exploSpeedY, global_time, explosion_time]);
        gl.bufferSubData(gl.ARRAY_BUFFER, (numParticles)*PARTICLE_STRIDE, particle_data);

        if (++numParticles >= NUM_PARTICLES)
            numParticles = 0; //vai para o inicio do buffer, eliminando os antigos
    }
}

function drawLine()
{
    gl.useProgram(program_line);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);  
    gl.vertexAttribPointer(vPositionAttrib, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionAttrib);
    gl.drawArrays(gl.POINTS, 0, 1); 
    gl.drawArrays(gl.LINES, 0, 2); 
}

function moveParticles()
{
    gl.useProgram(program_particles);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);

    gl.vertexAttribPointer(startPosAttrib, 2, gl.FLOAT, false, PARTICLE_STRIDE, 0);
    gl.enableVertexAttribArray(startPosAttrib);

    gl.vertexAttribPointer(speedAttrib, 2, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE);
    gl.enableVertexAttribArray(speedAttrib);

    gl.vertexAttribPointer(exploSpeedAttrib, 2, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE);
    gl.enableVertexAttribArray(exploSpeedAttrib);

    gl.vertexAttribPointer(timeAttrib, 1, gl.FLOAT, false, PARTICLE_STRIDE,
         STARTPOS_SIZE + SPEED_SIZE +EXPLOSPEED_SIZE);
    gl.enableVertexAttribArray(timeAttrib);

    gl.vertexAttribPointer(firstExplosionAttrib, 1, gl.FLOAT, false, PARTICLE_STRIDE, 
         STARTPOS_SIZE + SPEED_SIZE +EXPLOSPEED_SIZE + TIME_SIZE);   
    gl.enableVertexAttribArray(firstExplosionAttrib);

    global_time += 0.005; 
    gl.uniform1f(global_timeLoc, global_time);
    gl.drawArrays(gl.POINTS, 0, numParticles);
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);
    if(isDrawing)
        drawLine();
    moveParticles();
    if(automaticLaunchSet)
        automaticLaunch();
    
    requestAnimFrame(render);
}