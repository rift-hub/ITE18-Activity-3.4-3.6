import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
// Draco loader (needed only for the Draco compressed models, the decoder is loaded only when needed)
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/') // Folder copied from three/examples/jsm/libs/draco into /static/draco/

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// The mixer is declared outside of the load callback so that the tick function can use it
let mixer = null

// Fox with animation (final step of the activity)
gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {
        // Scale the loaded scene (not just the Object3D) and add it to our scene
        gltf.scene.scale.set(0.03, 0.03, 0.03)
        scene.add(gltf.scene)

        // Animation
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[0]) // 0: Survey, 1: Walk, 2: Run
        action.play()
    }
)

/**
 * Earlier steps of the activity (uncomment ONE of them and comment the Fox above to try it)
 */
// Load with the success, progress and error callbacks
// gltfLoader.load(
//     '/models/Duck/glTF/Duck.gltf',
//     (gltf) =>
//     {
//         console.log('success')
//         console.log(gltf)
//     },
//     (progress) =>
//     {
//         console.log('progress')
//         console.log(progress)
//     },
//     (error) =>
//     {
//         console.log('error')
//         console.log(error)
//     }
// )

// Duck: add the Object3D (first child) and ignore the unused PerspectiveCamera
// gltfLoader.load(
//     '/models/Duck/glTF/Duck.gltf',                // Default glTF
//     // '/models/Duck/glTF-Binary/Duck.glb',       // glTF-Binary
//     // '/models/Duck/glTF-Embedded/Duck.gltf',    // glTF-Embedded
//     (gltf) =>
//     {
//         scene.add(gltf.scene.children[0])
//     }
// )

// FlightHelmet: it has several children, so adding only children[0] gives a few parts only
// gltfLoader.load(
//     '/models/FlightHelmet/glTF/FlightHelmet.gltf',
//     (gltf) =>
//     {
//         // Solution 1: take the first child until there is none left
//         while(gltf.scene.children.length)
//         {
//             scene.add(gltf.scene.children[0])
//         }
//
//         // Solution 2: duplicate the children array first (spread operator)
//         // const children = [...gltf.scene.children]
//         // for(const child of children)
//         // {
//         //     scene.add(child)
//         // }
//
//         // Solution 3: add the whole scene (the simplest one)
//         // scene.add(gltf.scene)
//     }
// )

// Duck with Draco compression (needs the dracoLoader above)
// gltfLoader.load(
//     '/models/Duck/glTF-Draco/Duck.gltf',
//     (gltf) =>
//     {
//         scene.add(gltf.scene)
//     }
// )

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update mixer
    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()