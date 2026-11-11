import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'example-component',
  add: (world, cursor) => {
    console.log('Component attached.')

    const object = world.three.entityToObject.get(cursor.eid) as any
    const material = object?.material

    if (!material || Array.isArray(material)) {
      console.warn('Chroma key: no se encontró el material del plano')
      return
    }

    material.transparent = true
    material.blending = (window as any).THREE.NormalBlending
    material.depthWrite = false
    material.onBeforeCompile = (shader: any) => {
      shader.uniforms.keyColor = {value: new (window as any).THREE.Color(0x00ff00)}
      shader.uniforms.similarity = {value: 0.36}
      shader.uniforms.smoothness = {value: 0.12}

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
          #include <common>
          uniform vec3 keyColor;
          uniform float similarity;
          uniform float smoothness;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          #include <map_fragment>
          float chromaDistance = distance(sampledDiffuseColor.rgb, keyColor);
          float chromaAlpha = smoothstep(similarity, similarity + smoothness, chromaDistance);
          diffuseColor.a *= chromaAlpha;
        `
      )
    }
    material.customProgramCacheKey = () => 'chroma-key'
    material.needsUpdate = true
  },
})