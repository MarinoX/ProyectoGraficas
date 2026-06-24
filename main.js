import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// Configuracion de canvas y renderizador
const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Entorno y escena principal
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87CEEB');
scene.fog = new THREE.Fog('#87CEEB', 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 15, 40);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xffffff, 1.5);
luzSol.position.set(20, 50, 20);
luzSol.castShadow = true;
luzSol.shadow.camera.left = -40;
luzSol.shadow.camera.right = 40;
luzSol.shadow.camera.top = 40;
luzSol.shadow.camera.bottom = -40;
scene.add(luzSol);

// Suelo plano
const sueloGeo = new THREE.PlaneGeometry(200, 200);
const sueloMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

//  textura externa
const textureLoader = new THREE.TextureLoader();
const texturaAve = textureLoader.load('assets/plumas.jpg'); 
texturaAve.colorSpace = THREE.SRGBColorSpace;

//100 agentes renderizados
const cantidadAgentes = 100;
const limiteMundo = 30;

// Construccion del Modelo

// 1. Torso en forma de gota (Cilindro afilado al frente)
// Radio superior de 0.02 (Pico), Radio inferior de 0.2 (Cola)
const cuerpoGeo = new THREE.CylinderGeometry(0.02, 0.2, 1.8, 12);
cuerpoGeo.rotateX(-Math.PI / 2); // Acostar con la punta hacia el frente (-Z)
cuerpoGeo.scale(1.3, 0.8, 1.0); // Aplastar ligeramente para hacerlo aerodinamico

// 2. Ala Izquierda (Plano subdividido y deformado hacia atras)
const alaIzqGeo = new THREE.PlaneGeometry(1.6, 1.0, 6, 6);
alaIzqGeo.rotateX(-Math.PI / 2); // Acostar el plano

const posIzq = alaIzqGeo.attributes.position;
for (let i = 0; i < posIzq.count; i++) {
    let x = posIzq.getX(i);
    let z = posIzq.getZ(i);
    // Deformar los vertices para crear la silueta de flecha barrida hacia atras
    posIzq.setZ(i, z + Math.pow(Math.abs(x), 1.2) * 0.6); 
}
alaIzqGeo.computeVertexNormals(); 
alaIzqGeo.translate(-0.8, 0, 0); // Unir al torso izquierdo

// 3. Ala Derecha
const alaDerGeo = new THREE.PlaneGeometry(1.6, 1.0, 6, 6);
alaDerGeo.rotateX(-Math.PI / 2);

const posDer = alaDerGeo.attributes.position;
for (let i = 0; i < posDer.count; i++) {
    let x = posDer.getX(i);
    let z = posDer.getZ(i);
    posDer.setZ(i, z + Math.pow(Math.abs(x), 1.2) * 0.6); 
}
alaDerGeo.computeVertexNormals();
alaDerGeo.translate(0.8, 0, 0); // Unir al torso derecho

// Fusionar las 3 partes 
const geometriaAve = BufferGeometryUtils.mergeGeometries([cuerpoGeo, alaIzqGeo, alaDerGeo]);

// Inyectar atributo de desfase para la GPU
const offsetsAleteo = new Float32Array(cantidadAgentes);
for (let i = 0; i < cantidadAgentes; i++) {
    offsetsAleteo[i] = Math.random() * 100.0;
}
geometriaAve.setAttribute('a_wobbleOffset', new THREE.InstancedBufferAttribute(offsetsAleteo, 1));

// Shader Propio Avanzado Vertex Wobble
const materialInstanciado = new THREE.ShaderMaterial({
    uniforms: {
        u_texture: { value: texturaAve },
        u_time: { value: 0.0 },
        u_lightPos: { value: luzSol.position },
        u_diffuseColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
        uniform float u_time;
        attribute float a_wobbleOffset;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vUv = uv;
            
            vec3 transformed = position;
            
            // Efecto Vertex Wobble de aleteo asincrono
            float frecuencia = 15.0;
            float amplitud = 0.5;
            
            // Aplicar la onda matematica solo a los vertices que forman las alas
            if (abs(position.x) > 0.2) {
                float wave = sin((u_time + a_wobbleOffset) * frecuencia - abs(position.x) * 2.0) * amplitud;
                transformed.y += wave * (abs(position.x) - 0.2);
            }

            vNormal = normalMatrix * normal;
            vec4 worldPosition = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D u_texture;
        uniform vec3 u_lightPos;
        uniform vec3 u_diffuseColor;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec4 texColor = texture2D(u_texture, vUv);
            vec3 baseColor = texColor.rgb * u_diffuseColor;

            // Iluminacion Phong
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(u_lightPos - vWorldPosition);
            float diffuse = max(dot(normal, lightDir), 0.0);

            vec3 ambient = baseColor * 0.4;
            vec3 finalColor = ambient + (baseColor * diffuse);

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    side: THREE.DoubleSide
});

const enjambre = new THREE.InstancedMesh(geometriaAve, materialInstanciado, cantidadAgentes);
scene.add(enjambre);

// Logica de Posiciones y Velocidades (CPU)
const datosAgentes = [];
const dummy = new THREE.Object3D();

for (let i = 0; i < cantidadAgentes; i++) {
    const x = Math.random() * limiteMundo * 2 - limiteMundo;
    const y = Math.random() * 15 + 10;
    const z = Math.random() * limiteMundo * 2 - limiteMundo;
    
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.updateMatrix();
    enjambre.setMatrixAt(i, dummy.matrix);

    datosAgentes.push({
        posX: x,
        posY: y,
        posZ: z,
        rotY: dummy.rotation.y,
        velocidad: Math.random() * 4 + 4,
        desfaseVertical: Math.random() * 50
    });
}
enjambre.instanceMatrix.needsUpdate = true;

// Ajuste de pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Control de Rendimiento (30 FPS)
const fpsElement = document.getElementById('fps-counter');
let cuentaFrames = 0;
let tiempoAnteriorContador = performance.now();

const limiteFPS = 30;
const intervaloRender = 1000 / limiteFPS;
let tiempoAnteriorFrame = performance.now();

const reloj = new THREE.Clock();

//Bucle de renderizado principal
const animar = () => {
    requestAnimationFrame(animar);
    
    const tiempoActual = performance.now();
    const tiempoTranscurrido = tiempoActual - tiempoAnteriorFrame;

    if (tiempoTranscurrido < intervaloRender) return;

    tiempoAnteriorFrame = tiempoActual - (tiempoTranscurrido % intervaloRender);

    const delta = reloj.getDelta();
    const tiempoGlobal = reloj.getElapsedTime();

    materialInstanciado.uniforms.u_time.value = tiempoGlobal;

    // Actualizacion del enjambre
    for (let i = 0; i < cantidadAgentes; i++) {
        const agente = datosAgentes[i];

        agente.posX += Math.sin(agente.rotY) * agente.velocidad * delta;
        agente.posZ += Math.cos(agente.rotY) * agente.velocidad * delta;
        
        const vaiven = Math.sin(tiempoGlobal * 2.5 + agente.desfaseVertical) * 0.04;
        agente.posY += vaiven;

        if (agente.posX > limiteMundo) agente.posX = -limiteMundo;
        if (agente.posX < -limiteMundo) agente.posX = limiteMundo;
        if (agente.posZ > limiteMundo) agente.posZ = -limiteMundo;
        if (agente.posZ < -limiteMundo) agente.posZ = limiteMundo;

        dummy.position.set(agente.posX, agente.posY, agente.posZ);
        dummy.rotation.y = agente.rotY + Math.PI; 
        dummy.rotation.z = vaiven * 1.5;

        dummy.updateMatrix();
        enjambre.setMatrixAt(i, dummy.matrix);
    }
    
    enjambre.instanceMatrix.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);

    // Calculo y presentacion de FPS
    cuentaFrames++;
    if (tiempoActual >= tiempoAnteriorContador + 1000) {
        const fps = Math.round((cuentaFrames * 1000) / (tiempoActual - tiempoAnteriorContador));
        fpsElement.innerText = `FPS: ${fps} | Agentes: ${cantidadAgentes}`;
        cuentaFrames = 0;
        tiempoAnteriorContador = tiempoActual;
    }
};

animar();