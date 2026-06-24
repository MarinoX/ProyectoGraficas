# **Proyecto: Enjambre de Aves Autónomas en Three.js**
## **SEGUNDO AVANCE**

## **Descripción General**
Este proyecto representa la segunda versión funcional que integra técnicas avanzadas de optimización y shaders personalizados utilizando la biblioteca Three.js. El objetivo principal es desplegar un mundo 3D de cielo abierto habitado por un enjambre masivo de agentes autónomos con un rendimiento óptimo y animaciones independientes procesadas directamente en la GPU.

---

## **Estructura del Proyecto**
La organización de los archivos está diseñada para mantener el código limpio y separar los recursos externos de la lógica del programa:

    proyecto-enjambre/
    ├── index.html       # Estructura principal, estilos, contador de FPS e Import Maps.
    ├── main.js          # Lógica principal, simulación en CPU, InstancedMesh y ShaderMaterial.
    └── assets/
        └── plumas.jpg   # Textura seamless utilizada para cubrir la geometría de los agentes.

---

## **Características Integradas y Requisitos Cumplidos**

* **Entorno y Escena Base (T1):**
  Implementación de una cámara perspectiva, fondo sólido, niebla atmosférica (Fog) para dar sensación de profundidad, y un sistema de iluminación compuesto por luz ambiental y luz direccional con proyección de sombras.
* **Manejo de Assets Externos (T2):**
  Carga asíncrona de archivos mediante TextureLoader. La textura se aplica exitosamente al material de los agentes mediante mapeo UV dentro del shader personalizado.
* **Geometría Aerodinámica y Orgánica:**
  Evolución del modelo del agente a una estructura más realista basada en un torso en forma de gota utilizando una cápsula modificada, un pico afilado orientado al frente y alas triangulares con un barrido aerodinámico hacia atrás fusionadas mediante BufferGeometryUtils.
* **Rendimiento Masivo vía InstancedMesh (T5):**
  Renderizado eficiente de 100 agentes concurrentes utilizando una única llamada de dibujo (InstancedMesh). Las posiciones, orientaciones y el balanceo físico de cada ave se gestionan en la CPU mediante transformaciones de matrices independientes enviadas en cada frame.
* **Shader Avanzado de Deformación de Vértices (T4 - Vertex Wobble):**
  Implementación de un ShaderMaterial personalizado que calcula un aleteo ondulatorio asíncrono directamente en la GPU. Se utiliza un atributo único por instancia (a_wobbleOffset) para desincronizar los ciclos de animación entre las aves sin impacto en el procesador.
* **Movimiento Autónomo, Límites y Control de Rendimiento:**
  Cada agente vuela de forma autónoma con velocidades aleatorias dentro de un espacio de contención (Bounding Box). El bucle de animación está estrictamente limitado a un rendimiento objetivo de 30 FPS estables, con un medidor de fotogramas visible en la interfaz en tiempo real.

---

## **Demostración en Vivo**
El proyecto se encuentra desplegado en GitHub Pages y no requiere configuración local para su visualización. Se puede ver la simulación en ejecución directamente desde el siguiente enlace:

**Enlace:** https://marinox.github.io/ProyectoGraficas/