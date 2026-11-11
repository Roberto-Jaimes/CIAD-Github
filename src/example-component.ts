import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'example-component',
  add: (world, cursor) => {
    console.log('Component attached.')

    const applyChromaKey = () => {
      const object = world.three.entityToObject.get(cursor.eid) as any
      const material = object?.material

      if (!material || Array.isArray(material) || material.userData?.chromaKeyApplied) {
        return Boolean(material?.userData?.chromaKeyApplied)
      }

      const three = (window as any).THREE
      if (!three) return false

      material.userData = material.userData || {}
      material.userData.chromaKeyApplied = true
      material.transparent = true
      material.alphaTest = 0.01
      material.blending = three.NormalBlending
      material.depthWrite = false
      material.onBeforeCompile = (shader: any) => {
        shader.uniforms.keyColor = {value: new three.Color(0x00ff00)}
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
        ).replace(
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
      return true
    }

    if (!applyChromaKey()) {
      const retry = window.setInterval(() => {
        if (applyChromaKey()) window.clearInterval(retry)
      }, 100)
      window.setTimeout(() => window.clearInterval(retry), 10000)
    }
  },
})