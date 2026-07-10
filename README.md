# **Proyecto: Enjambre de Aves Autónomas con Three.js**
## **ENTREGA FINAL DEL PROYECTO**

---

## **Desarrolladores:**
Este proyecto fue desarrollado en equipo por:
* **Jose Abraham Marin Sanchez**
* **Luis Antonio Salinas Mata**

---

## **Descripción General**
Este proyecto representa la consolidación final de todo el trabajo realizado en la materia de computación gráfica. Lo que comenzó como una escena tridimensional básica se transformó en un ecosistema dinámico y fluido que simula el comportamiento emergente de una parvada masiva de 200 aves autónomas volando sobre un entorno forestal denso. 

El principal logro técnico de esta aplicación es su alto rendimiento, manteniendo una tasa constante de 30 FPS fijos en el navegador. Esto se consiguió delegando las tareas más pesadas de animación a la tarjeta gráfica (GPU) mediante shaders personalizados y optimizando la búsqueda de proximidad física en la CPU.

---

## **Estructura del Proyecto**
El repositorio está organizado de manera limpia para separar el código fuente de los recursos gráficos externos:

```text
proyecto-enjambre/
├── index.html       # Contenedor de la página, lienzos de WebGL, estilos de la interfaz y mapa de importaciones.
├── main.js          # Código principal con la simulación de Boids, optimización espacial y lógica de shaders.
└── assets/          # Carpeta de recursos multimedia del sistema.
    ├── fly.fbx      # Modelo tridimensional articulado del ave exportado desde Maya.
    └── alas.png     # Textura personalizada para vestir la superficie de los agentes.



## **Características Integradas y Decisiones Técnicas**

### **1. Entorno de Alta Densidad Visual**
* **Bosque de Instancias**: Para dar contexto a la escena, sustituimos el plano básico por un terreno de colinas suaves generado proceduralmente. Sobre este relieve distribuimos un bosque denso de 2,500 pinos.
* **Optimización de Renderizado**: Cargar miles de modelos independientes colapsaría el navegador. Para solucionarlo, agrupamos toda la vegetación en mallas instanciadas individuales, permitiendo que la tarjeta gráfica dibuje todo el bosque en tan solo dos llamadas de renderizado, protegiendo el rendimiento general.
* **Efectos de Atmósfera**: La escena incorpora iluminación ambiental combinada con una luz solar direccional para proyectar sombras claras sobre el relieve. Adicionalmente, se configuró un efecto de niebla para otorgar una sensación natural de profundidad y horizonte infinito.

### **2. Integración de Modelos Externos**
* **Fusión de Mallas**: Cargamos de forma asíncrona el archivo en formato FBX. Como el diseño original exportado desde Maya incluía las alas y el torso separados en tres piezas diferentes, desarrollamos un algoritmo que purifica los atributos geométricos y unifica las tres piezas en una sola estructura sólida antes de procesarla.
* **Alineación de Vuelo**: Añadimos una corrección de rotación de 180 grados a la geometría final. Esto soluciona los problemas de orientación nativos del archivo, garantizando que el frente del ave apunte siempre hacia adelante en la misma dirección de su vector de velocidad.

### **3. Optimización Espacial de la Física**
* **Reglas de Flocking**: El movimiento colectivo se rige bajo los principios tradicionales de Craig Reynolds: Separación para evitar colisiones internas, Alineación para seguir el rumbo del grupo y Cohesión para mantenerse unidos como parvada.
* **División por Celdas**: Calcular la distancia de cada ave contra todas las demás de la escena generaría un costo insostenible para el procesador. Para resolverlo, implementamos una estructura de celdas uniformes tridimensionales. Cada agente se registra únicamente en el cubo virtual que le corresponde por su posición y, al buscar compañeros, solo evalúa su celda actual y las 26 de su entorno inmediato, eliminando por completo el rezago por procesamiento.

### **4. Animación Avanzada en GPU**
* **Aleteo por Shader**: El movimiento de las alas se calcula en tiempo real dentro de un shader de vértices personalizado ejecutado directamente en el hardware gráfico.
* **Desincronización Orgánica**: Con el fin de evitar que todas las aves se muevan exactamente al mismo tiempo como robots, inyectamos un valor de desfase aleatorio para cada una. Utilizando funciones de ondas senoidales combinadas con la distancia de los puntos respecto al torso, logramos que las alas se flexionen de manera independiente mientras el cuerpo se mantiene firme.

### **5. Físicas de Contención y Control de FPS**
* **Muro Anticolisión del Suelo**: Para evitar que la fuerza de cohesión empuje al grupo por debajo del escenario, implementamos un detector que evalúa la altura del relieve debajo de cada ave. Si un agente intenta descender más allá de la copa de los árboles, el sistema bloquea su avance y aplica un impulso vertical obligatorio que lo regresa al aire seguro.
* **Rendimiento Sincronizado**: El bucle principal está restringido de forma estricta mediante un temporizador delta a un límite de 30 FPS estables. La interfaz muestra un medidor en tiempo real que valida la optimización ante cualquier evaluación.


## **Demostración en Vivo**
La aplicación se encuentra totalmente desplegado y listo para ejecutarse en GitHub Pages de forma nativa en cualquier navegador, sin necesidad de configuraciones locales:

**Enlace al Proyecto:** https://marinox.github.io/ProyectoGraficas/