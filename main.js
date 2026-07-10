import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// **Configuración de Entorno y Escena**
const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#4ea8de'); 
scene.fog = new THREE.Fog('#4ea8de', 60, 250);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 50, 120);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05; 

// **Iluminación Avanzada**
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(luzAmbiente);

const luzSol = new THREE.DirectionalLight(0xffffff, 1.5);
luzSol.position.set(50, 100, 40);
scene.add(luzSol);

// **Contexto Visual: Colinas y Bosque**
function obtenerAlturaColina(x, z) {
    return Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 + Math.sin(x * 0.05) * 2 - 10;
}

const segmentosSuelo = 80; 
const sueloGeo = new THREE.PlaneGeometry(350, 350, segmentosSuelo, segmentosSuelo);
const posSuelo = sueloGeo.attributes.position;

for (let i = 0; i < posSuelo.count; i++) {
    let x = posSuelo.getX(i);
    let y = posSuelo.getY(i); 
    let altura = obtenerAlturaColina(x, -y);
    posSuelo.setZ(i, altura);
}
sueloGeo.computeVertexNormals();

const sueloMat = new THREE.MeshStandardMaterial({ 
    color: 0x2b5329, 
    roughness: 1.0,
    flatShading: true 
});
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
scene.add(suelo);

const numPinos = 2500;
const troncoGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 5);
troncoGeo.translate(0, 2, 0); 
const troncoMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, flatShading: true });
const instTroncos = new THREE.InstancedMesh(troncoGeo, troncoMat, numPinos);

const copaGeo = new THREE.ConeGeometry(2.5, 8, 5);
copaGeo.translate(0, 7, 0);
const copaMat = new THREE.MeshStandardMaterial({ color: 0x1e4620, flatShading: true });
const instCopas = new THREE.InstancedMesh(copaGeo, copaMat, numPinos);

const matrizArbol = new THREE.Object3D();
for(let i = 0; i < numPinos; i++) {
    let tx = (Math.random() - 0.5) * 280;
    let tz = (Math.random() - 0.5) * 280;
    let ty = obtenerAlturaColina(tx, tz);
    
    matrizArbol.position.set(tx, ty, tz);
    let escala = 0.6 + Math.random() * 0.6; 
    matrizArbol.scale.set(escala, escala, escala);
    matrizArbol.rotation.y = Math.random() * Math.PI;
    matrizArbol.updateMatrix();
    
    instTroncos.setMatrixAt(i, matrizArbol.matrix);
    instCopas.setMatrixAt(i, matrizArbol.matrix);
}
scene.add(instTroncos);
scene.add(instCopas);

const nubes = new THREE.Group();
const nubeGeo = new THREE.SphereGeometry(4, 6, 6);
const nubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true });
for (let i = 0; i < 25; i++) {
    const cluster = new THREE.Group();
    const partes = Math.floor(Math.random() * 3) + 3;
    for (let j = 0; j < partes; j++) {
        const parte = new THREE.Mesh(nubeGeo, nubeMat);
        parte.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 10);
        const escala = Math.random() * 1.5 + 0.5;
        parte.scale.set(escala, escala * 0.5, escala);
        cluster.add(parte);
    }
    cluster.position.set((Math.random() - 0.5) * 250, Math.random() * 20 + 70, (Math.random() - 0.5) * 250);
    nubes.add(cluster);
}
scene.add(nubes);

// **Parámetros de Interfaz**
const params = { w_sep: 1.8, w_ali: 1.0, w_coh: 1.0, perceptionRadius: 7.0, maxSpeed: 14.0, maxForce: 0.35 };
const gui = new GUI({ title: 'Control Enjambre' });
gui.add(params, 'w_sep', 0.0, 5.0).name('Separación');
gui.add(params, 'w_ali', 0.0, 5.0).name('Alineación');
gui.add(params, 'w_coh', 0.0, 5.0).name('Cohesión');
gui.add(params, 'perceptionRadius', 2.0, 15.0).name('Radio Percepción');
gui.add(params, 'maxSpeed', 5.0, 20.0).name('Velocidad Max');

// **Sistema de Optimización O(n)**
class SpatialHash {
    constructor(cellSize) { this.cellSize = cellSize; this.cells = new Map(); }
    clear() { this.cells.clear(); }
    getKey(p) { return `${Math.floor(p.x/this.cellSize)},${Math.floor(p.y/this.cellSize)},${Math.floor(p.z/this.cellSize)}`; }
    insert(boid) {
        const key = this.getKey(boid.position);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(boid);
    }
    query(p) {
        const result = [];
        const cx = Math.floor(p.x / this.cellSize), cy = Math.floor(p.y / this.cellSize), cz = Math.floor(p.z / this.cellSize);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
            const key = `${cx + i},${cy + j},${cz + k}`;
            if (this.cells.has(key)) result.push(...this.cells.get(key));
        }
        return result;
    }
}

// **Lógica Boids Fundamental**
class Boid {
    constructor(id) {
        this.id = id;
        this.position = new THREE.Vector3((Math.random() - 0.5) * 100, 30 + Math.random() * 20, (Math.random() - 0.5) * 100);
        this.velocity = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(10);
        this.acceleration = new THREE.Vector3();
    }
    separate(vecinos) {
        let steer = new THREE.Vector3(), count = 0;
        for (let v of vecinos) {
            if (v.id === this.id) continue;
            let d = this.position.distanceTo(v.position);
            if (d > 0 && d < params.perceptionRadius * 0.5) {
                steer.add(new THREE.Vector3().subVectors(this.position, v.position).normalize().divideScalar(d));
                count++;
            }
        }
        if (count > 0) steer.divideScalar(count).normalize().multiplyScalar(params.maxSpeed).sub(this.velocity).clampLength(0, params.maxForce);
        return steer;
    }
    align(vecinos) {
        let sum = new THREE.Vector3(), count = 0;
        for (let v of vecinos) {
            if (v.id === this.id) continue;
            if (this.position.distanceTo(v.position) < params.perceptionRadius) { sum.add(v.velocity); count++; }
        }
        if (count > 0) return sum.divideScalar(count).normalize().multiplyScalar(params.maxSpeed).sub(this.velocity).clampLength(0, params.maxForce);
        return new THREE.Vector3();
    }
    cohere(vecinos) {
        let sum = new THREE.Vector3(), count = 0;
        for (let v of vecinos) {
            if (v.id === this.id) continue;
            if (this.position.distanceTo(v.position) < params.perceptionRadius) { sum.add(v.position); count++; }
        }
        if (count > 0) {
            let desired = sum.divideScalar(count).sub(this.position).normalize().multiplyScalar(params.maxSpeed);
            return desired.sub(this.velocity).clampLength(0, params.maxForce);
        }
        return new THREE.Vector3();
    }
    flock(vecinos) {
        this.acceleration.add(this.separate(vecinos).multiplyScalar(params.w_sep));
        this.acceleration.add(this.align(vecinos).multiplyScalar(params.w_ali));
        this.acceleration.add(this.cohere(vecinos).multiplyScalar(params.w_coh));
    }
    update(delta) {
        this.velocity.add(this.acceleration).clampLength(4.0, params.maxSpeed);
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        this.acceleration.set(0, 0, 0);
        
        if (this.position.y < 12) {
            this.position.y = 12;
            this.velocity.y += 1.0; 
        }

        const d = 130; 
        if (this.position.x > d) this.position.x = -d;
        if (this.position.x < -d) this.position.x = d;
        if (this.position.z > d) this.position.z = -d;
        if (this.position.z < -d) this.position.z = d;
        if (this.position.y > 60) this.position.y = 60; 
    }
}

// **Carga Segura de Textura Personalizada**
const textureLoader = new THREE.TextureLoader();
// Cambiado a alas.png forzando su uso
const texturaAve = textureLoader.load('assets/plumas.jpg');
texturaAve.colorSpace = THREE.SRGBColorSpace;
texturaAve.wrapS = THREE.RepeatWrapping;
texturaAve.wrapT = THREE.RepeatWrapping;

// **Carga Asíncrona, Limpieza y Auto-Escalado del Modelo FBX**
const fbxLoader = new FBXLoader();
fbxLoader.load('assets/fly.fbx', (objeto) => {
    const geometrias = [];

    objeto.updateMatrixWorld(true);

    objeto.traverse((hijo) => {
        if (hijo.isMesh) {
            let geo = hijo.geometry.clone();
            geo.applyMatrix4(hijo.matrixWorld);

            const atributosPermitidos = ['position', 'normal', 'uv'];
            for (const nombreAtributo in geo.attributes) {
                if (!atributosPermitidos.includes(nombreAtributo)) {
                    geo.deleteAttribute(nombreAtributo);
                }
            }

            if (!geo.attributes.uv) {
                const uvArray = new Float32Array(geo.attributes.position.count * 2);
                geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
            }
            if (!geo.attributes.normal) {
                geo.computeVertexNormals();
            }

            geometrias.push(geo);
            // Ya no buscamos texturas dentro del FBX para forzar el uso de alas.png
        }
    });

    if (geometrias.length === 0) {
        console.error("Fallo critico: No se encontró geometría tipo Mesh en el archivo FBX.");
        return;
    }

    const geometriaFbx = BufferGeometryUtils.mergeGeometries(geometrias, false);

    geometriaFbx.center();
    geometriaFbx.computeBoundingBox();
    const tamano = geometriaFbx.boundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(tamano.x, tamano.y, tamano.z);
    
    const factorEscala = 2.5 / maxDimension;
    geometriaFbx.scale(factorEscala, factorEscala, factorEscala);
    
    // Girar para alinear con el vector velocidad
    geometriaFbx.rotateY(Math.PI);

    // Se inicializa utilizando directamente la textura forzada cargada al principio
    iniciarSimulacion(geometriaFbx, texturaAve);
}, undefined, (error) => {
    console.error("Error al cargar el archivo fly.fbx.", error);
});

// **Despliegue del Sistema y Shader Tras Completar Carga**
function iniciarSimulacion(geometryAve, texturaModelo) {
    const cantidadAgentes = 200;
    const offsetsAleteo = new Float32Array(cantidadAgentes);
    for (let i = 0; i < cantidadAgentes; i++) offsetsAleteo[i] = Math.random() * 100.0; 
    
    geometryAve.setAttribute('a_wobbleOffset', new THREE.InstancedBufferAttribute(offsetsAleteo, 1));

    const materialInstanciado = new THREE.ShaderMaterial({
        uniforms: { 
            u_texture: { value: texturaModelo }, 
            u_time: { value: 0.0 }, 
            u_lightPos: { value: luzSol.position } 
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
                
                if (abs(position.x) > 0.15) {
                    float wave = sin((u_time + a_wobbleOffset) * 20.0) * 0.4;
                    transformed.y += wave * (abs(position.x) - 0.15);
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
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            void main() {
                vec4 texColor = texture2D(u_texture, vUv);
                
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(u_lightPos - vWorldPosition);
                float diffuse = max(dot(normal, lightDir), 0.0);
                
                // Aplicación pura de la textura sin condiciones que la sobrescriban
                vec3 finalColor = (texColor.rgb * 0.5) + (texColor.rgb * diffuse);
                
                float fogFactor = smoothstep(60.0, 250.0, length(cameraPosition - vWorldPosition));
                gl_FragColor = vec4(mix(finalColor, vec3(0.30, 0.66, 0.87), fogFactor), 1.0);
            }
        `,
        side: THREE.DoubleSide
    });

    const enjambre = new THREE.InstancedMesh(geometryAve, materialInstanciado, cantidadAgentes);
    scene.add(enjambre);

    const boids = [];
    for (let i = 0; i < cantidadAgentes; i++) boids.push(new Boid(i));
    
    enjambre.setColorAt(0, new THREE.Color(0xffffff)); 
    enjambre.instanceColor = null; 

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const fpsElement = document.getElementById('fps-counter');
    let cuentaFrames = 0, tiempoAnteriorContador = performance.now();
    const reloj = new THREE.Clock();
    const dummy = new THREE.Object3D();
    const spatialHash = new SpatialHash(params.perceptionRadius);
    const limiteFPS = 30;
    const intervaloRender = 1000 / limiteFPS;
    let tiempoAnteriorFrame = performance.now();

    const animar = () => {
        requestAnimationFrame(animar);
        const tiempoActual = performance.now();
        const tiempoTranscurrido = tiempoActual - tiempoAnteriorFrame;

        if (tiempoTranscurrido < intervaloRender) return;
        tiempoAnteriorFrame = tiempoActual - (tiempoTranscurrido % intervaloRender);

        const delta = Math.min(reloj.getDelta(), 0.1); 
        materialInstanciado.uniforms.u_time.value = reloj.getElapsedTime();
        
        spatialHash.clear();
        spatialHash.cellSize = params.perceptionRadius; 
        for (let boid of boids) spatialHash.insert(boid);

        for (let i = 0; i < cantidadAgentes; i++) {
            let boid = boids[i];
            boid.flock(spatialHash.query(boid.position));
            boid.update(delta);
            dummy.position.copy(boid.position);
            
            if (boid.velocity.lengthSq() > 0.001) {
                dummy.lookAt(dummy.position.clone().add(boid.velocity));
            }
            dummy.updateMatrix();
            enjambre.setMatrixAt(i, dummy.matrix);
        }
        enjambre.instanceMatrix.needsUpdate = true;
        controls.update();
        renderer.render(scene, camera);

        cuentaFrames++;
        if (tiempoActual >= tiempoAnteriorContador + 1000) {
            fpsElement.innerText = `FPS: ${Math.round((cuentaFrames * 1000) / (tiempoActual - tiempoAnteriorContador))} | Agentes: ${cantidadAgentes}`;
            cuentaFrames = 0;
            tiempoAnteriorContador = tiempoActual;
        }
    };

    animar();
}