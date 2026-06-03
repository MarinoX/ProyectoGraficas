# **Proyecto: Enjambre de Aves Autónomas en Three.js**

## **Descripción General**
Este proyecto representa la primera versión funcional que unifica los requerimientos de las fases previas de desarrollo utilizando la biblioteca Three.js. El objetivo principal es desplegar un mundo 3D de cielo abierto habitado por múltiples instancias de un agente articulado (aves) que se desplazan de forma autónoma por la escena.

---

## **Estructura del Proyecto**
La organización de los archivos está diseñada para mantener el código limpio y separar los recursos externos de la lógica del programa:

```text
proyecto-enjambre/
├── index.html       # Estructura principal, estilos y configuración de importaciones (Import Maps).
├── main.js          # Lógica principal de Three.js, clase del agente, iluminación y bucle de animación.
└── assets/
    └── plumas.jpg   # Textura seamless utilizada para cubrir la geometría de los agentes.
```

Características Integradas y Requisitos Cumplidos
Entorno y Escena Base (T1):
Implementación de una cámara perspectiva, fondo sólido, niebla atmosférica (Fog) para dar sensación de profundidad, y un sistema de iluminación compuesto por luz ambiental y luz direccional con proyección de sombras.

Manejo de Assets Externos (T2):
Carga asíncrona de archivos mediante TextureLoader. La textura se aplica exitosamente al material de los agentes, reemplazando el color sólido básico.

Geometría Articulada (T3):
El agente está programado como una clase independiente que construye una jerarquía de nodos (Cuerpo central -> Ala izquierda / Ala derecha). Las extremidades se animan cíclicamente utilizando la función Math.sin() con variables de tiempo, logrando un aleteo orgánico y asíncrono entre las distintas aves.

Instanciación Múltiple:
Generación de 10 instancias de la clase base. Cada ave recibe una posición tridimensional, una rotación inicial y una velocidad de vuelo completamente aleatorias al momento de su creación.

Movimiento Autónomo y Límites:
Cada agente calcula su avance sobre su propio eje local Z. Se implementó una lógica de límites de contención (Bounding Box): cuando un agente cruza el límite de la escena, sus coordenadas se reinvierten para que reaparezca en el extremo opuesto de forma continua.

Demostración en Vivo
El proyecto se encuentra desplegado en GitHub Pages y no requiere configuración local para su visualización. Se puede ver la simulación en ejecución directamente desde  el siguiente enlace:

Enlace: https://marinox.github.io/ProyectoGraficas/