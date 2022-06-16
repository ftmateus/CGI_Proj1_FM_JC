
attribute vec2 startPos;
attribute vec2 speed;
attribute vec2 exploSpeed;
attribute vec2 explo2Speed;
attribute float time;
attribute float firstExploTime;
attribute vec4 vColor_particle;
uniform float global_time;
varying vec4 fColor;


void moveRocketParticle(float timeTemp)
{
    gl_Position.x = startPos.x + speed.x * timeTemp;
    gl_Position.y = startPos.y + speed.y * timeTemp - 0.5 * 10.0 * timeTemp * timeTemp;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
}

void moveExplosionParticle(float timeTemp)
{
    float timeTemp2 = timeTemp - firstExploTime;

    gl_PointSize = 4.0;

    gl_Position.x = (startPos.x + speed.x * firstExploTime) + exploSpeed.x * timeTemp2;
    gl_Position.y = (startPos.y + speed.y * firstExploTime - 0.5 * 10.0 * firstExploTime * firstExploTime) + exploSpeed.y * timeTemp2 - 0.5 * 5.0 * timeTemp2 * timeTemp2;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
    //opacity -= 0.1;
}

void moveExplosion2Particle(float timeTemp)
{
    float timeTemp2 = timeTemp - firstExploTime;
    float timeTemp3 = timeTemp2 - 0.3;

    gl_PointSize = 2.0;

    gl_Position.x = ((startPos.x + speed.x * firstExploTime) + 
                    (exploSpeed.x * timeTemp2)) + 
                    explo2Speed.x * timeTemp3;
    gl_Position.y = ((startPos.y + speed.y * firstExploTime - 0.5 * 10.0 * firstExploTime * firstExploTime) +
                    exploSpeed.y * timeTemp2 - 0.5 * 5.0 * timeTemp2 * timeTemp2) + 
                    explo2Speed.y * timeTemp3 - 0.5 * 5.0 * timeTemp3 * timeTemp3;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
}


void main(){
    float timeTemp = global_time - time;
    gl_PointSize = 5.0;
    
    fColor = vColor_particle;

    if( timeTemp >= firstExploTime + 0.3)
        moveExplosion2Particle(timeTemp);
    else    
        if( timeTemp >= firstExploTime)
            moveExplosionParticle(timeTemp);
    else    
        moveRocketParticle(timeTemp);    

}