//iChannel0:texture:https://www.shadertoy.com/media/a/ad56fba948dfba9ae698198c109e71f118a54d209c0ea50d77ea546abad89c57.png
//iChannel1:texture:https://www.shadertoy.com/media/a/8de3a3924cb95bd0e95a443fff0326c869f9d4979cd1d5b6e94e2a01f5be53e9.jpg
//iChannel2:music:https://www.shadertoy.com/media/a/3c33c415862bb7964d256f4749408247da6596f2167dca2c86cc38f83c244aa6.mp3

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / iResolution.xy;

  vec4 a = texture(iChannel0, uv);
  vec4 b = texture(iChannel1, uv);

  float sin01 = sin(iTime) * 0.5 + 0.5;
  float p01 = step(sin01, uv.x);
  vec4 col = mix(a, b, p01);

  fragColor = vec4(col.rgb, 1.0);
}
