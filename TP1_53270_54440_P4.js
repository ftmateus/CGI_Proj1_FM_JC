var gl;
var canvas;
var program_line, program_particles;
var bufferlineId, bufferParticlesId;
var startPos;
var endPos;
var isDrawing = false;
var startPosAttrib, timeAttrib, exploSpeedAttrib, explo2SpeedAttrib, speedAttrib, firstExplosionAttrib;
var vPositionAttrib;
var global_timeLoc;
var global_time = 0;
var numParticles = 0;
var automaticLaunchSet = false;
var colors = [
    vec4( 1.0, 0.0, 0.0, 0.5),  // red
    vec4( 1.0, 1.0, 0.0, 0.5),  // yellow
    vec4( 0.0, 1.0, 0.0, 0.5),  // green
    vec4( 0.0, 0.0, 1.0, 0.5),  // blue
    vec4( 1.0, 0.0, 1.0, 0.5),  // magenta
    vec4( 0.0, 1.0, 1.0, 0.5)   // cyan
];
var currentColor;
var vColor_line;
var vColor_particle;
var time_increase = 0.005;
var isPaused = false;

const NUM_PARTICLES = 65000;
const COLOR_SIZE = 16;
const FLOAT_SIZE = 4;
const STARTPOS_SIZE = 2*FLOAT_SIZE,
SPEED_SIZE = 2*FLOAT_SIZE,
EXPLOSPEED_SIZE = 2*FLOAT_SIZE;
const TIME_SIZE = FLOAT_SIZE,
FIRSTEXPLOTIME_SIZE = FLOAT_SIZE;
const PARTICLE_STRIDE = 
STARTPOS_SIZE + SPEED_SIZE + EXPLOSPEED_SIZE + EXPLOSPEED_SIZE + TIME_SIZE + FIRSTEXPLOTIME_SIZE + COLOR_SIZE;



window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.DST_ALPHA, gl.ONE, gl.ONE);

    gl.enable(gl.BLEND);
        
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    initLineProgram();
    initParticlesProgram();

    canvas.addEventListener("mousedown",mouseDown);
    canvas.addEventListener("mouseup",mouseUp);
    canvas.addEventListener("mousemove",mouseMove);
    addEventListener("keypress", keyPress);
    document.getElementById("slowMotion").onclick = function() {slowMotion()};
    document.getElementById("pause").onclick = function() {pause()};

    render();
}

function slowMotion()
{
    time_increase = time_increase == 0.005 ? 0.0005 : 0.005;
    document.getElementsByClassName("slowMotionStyle")[0].style.backgroundColor = time_increase == 0.0005 ? "red" : "white";

}

function pause()
{
    isPaused = isPaused ? false : true;
    document.getElementsByClassName("pauseStyle")[0].style.backgroundColor = isPaused ? "red" : "white";

}

function keyPress(ev)
{
    if (ev.key == ' ' || ev.key == 'Spacebar')
        automaticLaunchSet = automaticLaunchSet ? false : true;
}

function initLineProgram()
{
    program_line = initShaders(gl, "vertex-shader-line", "fragment-shader");
    bufferlineId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferData(gl.ARRAY_BUFFER, 4*4 + 4*4 + 4*4, gl.STATIC_DRAW);
    vPositionAttrib = gl.getAttribLocation(program_line, "vPosition");
    vColor_line = gl.getAttribLocation(program_line, "vColor");
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
    explo2SpeedAttrib = gl.getAttribLocation(program_particles, "explo2Speed");
    timeAttrib = gl.getAttribLocation(program_particles, "time");    
    firstExplosionAttrib = gl.getAttribLocation(program_particles, "firstExploTime");
    vColor_particle = gl.getAttribLocation(program_particles, "vColor_particle");
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
    randomColor();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos, endPos]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16, flatten([currentColor, currentColor]));
}

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferlineId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));   
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);

    createMortarParticle(startPos, endPos);
}

function createMortarParticle(startPos_i, endPos_i)
{
    //considerando que o intervalo de tempo e 1 nas 2 componentes
    var speedX = 5 *(endPos_i[0] - startPos_i[0]);
    var speedY = 7 *(endPos_i[1] - startPos_i[1]);
    var explosion_time = speedY/10.0;    
    if (explosion_time < 0)
        explosion_time = 0;
    var i = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferParticlesId);
    var num_explosion_particles = Math.ceil(Math.random() * (250 /*max*/ - 10 /*min*/) + 10 /*min*/);
    var thetaoffset = (2*Math.PI)/num_explosion_particles;

    for (var theta = 0 ; theta <= 2*Math.PI; theta += thetaoffset)
    {
        var exploSpeedX, exploSpeedY, explo2SpeedX, explo2SpeedY;
        if(i == 0){
            // coordenadas polares
            exploSpeedX = 0.5 * Math.random() * Math.cos(theta);
            exploSpeedY = 0.5 * Math.random() * Math.sin(theta);
        }    
        if(i == 2){
            explo2SpeedX = 0.5 * exploSpeedX;
            explo2SpeedY = 0.5 * exploSpeedY;
            i = 0;
        }
        else{
            explo2SpeedX = 0.5 * Math.random() * Math.cos(theta);
            explo2SpeedY = 0.5 * Math.random() * Math.sin(theta);
            i++;
        }

        var particle_data = new Float32Array([startPos_i[0], startPos_i[1], speedX, speedY, exploSpeedX, exploSpeedY,
             explo2SpeedX, explo2SpeedY, global_time, explosion_time, currentColor[0], currentColor[1], currentColor[2], currentColor[3] ]);
        
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
    gl.vertexAttribPointer(vColor_line, 4, gl.FLOAT, false, 0, 16);
    gl.enableVertexAttribArray(vColor_line);
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

    gl.vertexAttribPointer(explo2SpeedAttrib, 2, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE + SPEED_SIZE);
    gl.enableVertexAttribArray(explo2SpeedAttrib);

    gl.vertexAttribPointer(timeAttrib, 1, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE + SPEED_SIZE + SPEED_SIZE);
    gl.enableVertexAttribArray(timeAttrib);

    gl.vertexAttribPointer(firstExplosionAttrib, 1, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE + SPEED_SIZE + SPEED_SIZE + TIME_SIZE);
    gl.enableVertexAttribArray(firstExplosionAttrib);

    gl.vertexAttribPointer(vColor_particle, 4, gl.FLOAT, false, PARTICLE_STRIDE, STARTPOS_SIZE + SPEED_SIZE + SPEED_SIZE + SPEED_SIZE + TIME_SIZE + TIME_SIZE);   
    gl.enableVertexAttribArray(vColor_particle);

    if (!isPaused)
        global_time += time_increase; 
    gl.uniform1f(global_timeLoc, global_time);
    gl.drawArrays(gl.POINTS, 0, NUM_PARTICLES);
}

function randomColor()
{
    currentColor = vec4(colors[Math.floor(Math.random()*(colors.length))]);
}

function automaticLaunch()
{
    var posX = Math.random() * (1 /*max*/  + 1 /*min*/) - 1 /*min*/;
    randomColor();
    createMortarParticle([posX, -1], [posX, -0.3]);
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);
    if(isDrawing)
        drawLine();
    moveParticles();
    if(automaticLaunchSet && global_time%1 <= time_increase*10)
        automaticLaunch();
    
    document.getElementById('numParticles').innerHTML=numParticles;
    
    requestAnimFrame(render);
}