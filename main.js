import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Clase del agente integrada
class Ave {
    constructor(escena, textura) {
        this.mesh = new THREE.Group();

        // Material con textura externa
        const material = new THREE.MeshStandardMaterial({ 
            map: textura, 
            roughness: 0.8,
            color: 0xcccccc 
        });

        // Nodo del cuerpo
        this.cuerpoNodo = new THREE.Group();
        this.mesh.add(this.cuerpoNodo);

        const cuerpoGeo = new THREE.ConeGeometry(0.4, 2, 8);
        cuerpoGeo.rotateX(Math.PI / 2);
        const cuerpoMesh = new THREE.Mesh(cuerpoGeo, material);
        cuerpoMesh.castShadow = true;
        this.cuerpoNodo.add(cuerpoMesh);

        // Nodo Ala Izquierda articulada
        this.alaIzqNodo = new THREE.Group();
        this.alaIzqNodo.position.set(-0.3, 0, 0); 
        this.cuerpoNodo.add(this.alaIzqNodo);

        const alaGeo = new THREE.BoxGeometry(2.5, 0.05, 1);
        const alaIzqMesh = new THREE.Mesh(alaGeo, material);
        alaIzqMesh.position.x = -1.25; 
        alaIzqMesh.castShadow = true;
        this.alaIzqNodo.add(alaIzqMesh);

        // Nodo Ala Derecha articulada
        this.alaDerNodo = new THREE.Group();
        this.alaDerNodo.position.set(0.3, 0, 0); 
        this.cuerpoNodo.add(this.alaDerNodo);

        const alaDerMesh = new THREE.Mesh(alaGeo, material);
        alaDerMesh.position.x = 1.25;
        alaDerMesh.castShadow = true;
        this.alaDerNodo.add(alaDerMesh);

        // Posicion y orientacion inicial aleatoria
        this.mesh.position.set(
            Math.random() * 40 - 20,
            Math.random() * 20 + 10,
            Math.random() * 40 - 20
        );

        this.mesh.rotation.y = Math.random() * Math.PI * 2;
        this.velocidad = Math.random() * 5 + 5;
        
        // Tiempo interno desfasado para que no aleteen igual
        this.tiempo = Math.random() * 100;

        escena.add(this.mesh);
    }

    actualizar(delta, limite) {
        this.tiempo += delta;

        // Aleteo 
        const velocidadAleteo = 15;
        const amplitudAleteo = 0.8;
        const aleteo = Math.sin(this.tiempo * velocidadAleteo) * amplitudAleteo;
        
        this.alaIzqNodo.rotation.z = aleteo;
        this.alaDerNodo.rotation.z = -aleteo; 

        // Balanceo del cuerpo
        this.mesh.rotation.z = Math.sin(this.tiempo * 2) * 0.1;

        // Movimiento autonomo 
        this.mesh.translateZ(this.velocidad * delta);

        // Reaparicion en los limites
        if (this.mesh.position.x > limite) this.mesh.position.x = -limite;
        if (this.mesh.position.x < -limite) this.mesh.position.x = limite;
        if (this.mesh.position.z > limite) this.mesh.position.z = -limite;
        if (this.mesh.position.z < -limite) this.mesh.position.z = limite;
        if (this.mesh.position.y > limite + 20) this.mesh.position.y = 10;
        if (this.mesh.position.y < 10) this.mesh.position.y = limite + 20;
    }
}

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

// textura externa
const textureLoader = new THREE.TextureLoader();
const texturaAve = textureLoader.load('assets/plumas.jpg'); 
texturaAve.colorSpace = THREE.SRGBColorSpace;

// Instanciar las aves
const limiteMundo = 30;
const multitudAves = [];
const numeroAves = 10;

for (let i = 0; i < numeroAves; i++) {
    multitudAves.push(new Ave(scene, texturaAve));
}

// Ajuste de pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const reloj = new THREE.Clock();

// Bucle de renderizado
const animar = () => {
    requestAnimationFrame(animar);
    
    const delta = reloj.getDelta();

    // Actualizar cada ave en la escena
    for (let ave of multitudAves) {
        ave.actualizar(delta, limiteMundo);
    }

    controls.update();
    renderer.render(scene, camera);
};

animar();