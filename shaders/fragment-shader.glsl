precision mediump float;
varying vec4 fColor;
void main() {
    vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
    if (dot(circCoord, circCoord) > 1.0)
    {
        discard; //manda o pixel para fora
    }
    gl_FragColor = fColor;
}