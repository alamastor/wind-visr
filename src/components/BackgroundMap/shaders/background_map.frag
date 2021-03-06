#version 300 es
precision highp float;

uniform sampler2D tex;

in vec2 texCoord;

out vec4 outColor;

void main() {
    outColor = texture(tex, texCoord);
}
