import * as ecs from '@8thwall/ecs'

let visible = true

ecs.registerComponent({
  name: 'example-component',

  add: () => {
    console.log('Componente cargado')

    window.addEventListener('click', () => {
      const plano = document.querySelector('[name="Plano"]')

      if (!plano) return

      visible = !visible

      ;(plano as any).object3D.visible = visible
    })
  },
})