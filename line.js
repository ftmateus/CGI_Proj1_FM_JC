var gl;
var canvas;
var bufferId;
var vPosition;
var startPos;
var endPos;
var isDrawing = false;
var currentPos = vec2(0,0);
var particlesInMov = [];
var speed;
var startPosLoc;
var isParticle;
var time;



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

    speed = gl.getUniformLocation(program, "speed");
    startPosLoc = gl.getUniformLocation(program, "startPos");
    isParticle = gl.getUniformLocation(program, "isParticle");
    time = gl.getUniformLocation(program, "time");


    
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
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(startPos));
    gl.drawArrays(gl.POINTS, 0, 1);
    //gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));
}

function mouseUp(ev) {
    isDrawing = false;
    endPos = getMousePos(canvas,ev);

    //considerando que o intervalo de tempo e 1 nas 2 componentes
    speedX = 0.5*(endPos[0] - startPos[0]);
    speedY = 10*(endPos[1] - startPos[1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(endPos));

    currentPos[0] = startPos[0];

    particlesInMov.push(
        {
            currentPos: vec2(currentPos[0], currentPos[1]),
            speed: vec2(speedX, speedY), 
            startPos: startPos,
            time: 0,
            speedBefore: 0,
            exploded: false
        });
}

function mouseMove(ev) {
    endPos = getMousePos(canvas, ev);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));   
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if(isDrawing)
        drawLine();

    if (particlesInMov.length != 0)
        moveParticles();
    
    requestAnimFrame(render);
}

function drawLine()
{
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten([startPos,endPos]));  
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2); 

    lineDrawn = true;
}

function moveParticles()
{
    
    for (var i = 0; i < particlesInMov.length; i++)
    {
/*
        var p = particlesInMov[i];
        p.currentPos[0] += 0.1 * p.speed[0];
        p.currentPos[1] = 
                            p.startPos[1] + p.speed[1]*p.time
                            + -1/2 * 10 * Math.pow(p.time, 2);
                            */
                           
        gl.uniform2fv(speed, p.speed);
        gl.uniform1f(isParticle, true);
        gl.uniform2fv(startPosLoc, p.startPos);
        gl.uniform1f(time, p.time);

        
        
        if(p.speedBefore == 0)
            p.speedBefore = -1 + 2 * (canvas.height-p.currentPos[1])/canvas.height;

        if(-1 + 2 * (canvas.height-p.currentPos[1])/canvas.height > p.speedBefore && p.exploded == false){
            p.exploded = true;
            explosion(p);
        }

        p.speedBefore = -1 + 2 * (canvas.height-p.currentPos[1])/canvas.height;
                            
        p.time += 0.005;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(p.currentPos));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, 2);

        if(particleOutOfRange(p))
        {
            particlesInMov.splice(i,1);
            //console.log(particlesInMov.length)
        }         
    }
}

function explosion(p){
    var idx = particlesInMov.indexOf(p)
    particlesInMov.splice(idx, 1);

    var explosionParticles = [];
    var count = Math.ceil(Math.random() * (250 /*max*/ - 10 /*min*/) + 10 /*min*/);
    var partPos = vec2(p.currentPos[0], p.currentPos[1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    console.log(count)
    while(count --){
        
        speedX = Math.random()*.1;
        if(Math.random()> .5)
            speedX = -speedX;
        speedY = Math.random()*3;
        if(Math.random()> .5)
            speedY = -speedY;
        
        gl.bufferSubData(gl.ARRAY_BUFFER, 8, flatten(partPos));

        particlesInMov.push(
            {
                currentPos: vec2(p.currentPos[0], p.currentPos[1]),
                speed: vec2(speedX, speedY), 
                startPos: partPos,
                time: 0,
                exploPart : true
            });

    }
    //moveParticles(explosionParticles);
}

function particleOutOfRange(p)
{
    return p.currentPos[0] < -1 || p.currentPos[1] < -1 || p.currentPos[0] > 1;
}