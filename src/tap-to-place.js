import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
    name: 'tap-to-place',
    schema: {
        target: ecs.eid,
    },
    stateMachine: ({ world, eid, schemaAttribute }) => {
        ecs.defineState('default')
            .initial()
            .listen(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (event) => {
                const { target } = schemaAttribute.get(eid)
                if (!target) return

                const screenX = event.data.position.x
                const screenY = event.data.position.y

                const ndcX = screenX * 2 - 1
                const ndcY = -(screenY * 2 - 1)

                // Buscar la c�mara real de three.js recorriendo la escena
                const obj = world.three.entityToObject.get(eid)
                if (!obj) return

                // Subir hasta la escena ra�z
                let scene = obj
                while (scene.parent) {
                    scene = scene.parent
                }

                // Buscar el objeto THREE.Camera en la escena
                let threeCamera = null
                scene.traverse((child) => {
                    if (child.isCamera && !threeCamera) {
                        threeCamera = child
                    }
                })

                if (!threeCamera) {
                    console.warn('tap-to-place: no se encontr� THREE.Camera en la escena')
                    return
                }

                const THREE = window.THREE
                const raycaster = new THREE.Raycaster()
                const coords = new THREE.Vector2(ndcX, ndcY)
                raycaster.setFromCamera(coords, threeCamera)

                // Intersectar con plano del suelo (y = 0)
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
                const hitPoint = new THREE.Vector3()
                const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint)

                if (hit) {
                    ecs.Position.set(world, target, {
                        x: hitPoint.x,
                        y: hitPoint.y,
                        z: hitPoint.z,
                    })
                    console.log('Cubo movido a:', hitPoint.x, hitPoint.y, hitPoint.z)
                } else {
                    console.log('No se intersect� con el suelo')
                }
            })
    },
})