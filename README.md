# 🐉 D&D 5e Bestiary, Encounter Builder & Battle Simulator

Una suite web moderna, rápida y completa para Dungeon Masters de **Dungeons & Dragons 5e**, diseñada para consultar más de 10,000 criaturas, calcular la dificultad de encuentros con las matemáticas de **Kobold+ Fight Club (KFC)** y simular combates asalto a asalto con el motor markoviano de **BattleSim (Trekiros)**.

![D&D 5e Bestiary](https://img.shields.io/badge/D%26D-5e%20%7C%202024%20Revised-red)
![Creatures](https://img.shields.io/badge/Creatures-10%2C496-blue)
![React](https://img.shields.io/badge/React-19-cyan)
![Vite](https://img.shields.io/badge/Vite-8.3-purple)

---

## ⚡ Características Principales

### 📖 1. Bestiario Completo (10,496 Criaturas)
* **Fuentes Oficiales y Third-Party:** Incluye suplementos oficiales de Wizards of the Coast (WotC), grandes editoriales de terceros (Kobold Press, MCDM, etc.) y crossovers.
* **Ficha de Estadísticas (Statblock) Completa:** Atributos, CA, HP, salvaciones, habilidades, sentidos, rasgos especiales, acciones, reacciones y acciones legendarias.
* **Agrupación Inteligente de Versiones:** Agrupa más de 2,400 reimpresiones y variantes bajo 9,206 criaturas únicas. Cada tarjeta cuenta con selector interactivo de versiones (`✨ 2024`, `📜 2014`, `3PP`, `Crossovers`).
* **Comparador Visual de Diferencias (Smart Diff):** Muestra de forma inmediata en la ficha modal qué cambió entre la versión 2014 clásica y la versión 2024 revisada (deltas de HP, CA, atributos, acciones y rasgos).


### 🔍 2. Filtros Avanzados (Estilo 5e.tools)
* **Desafío (CR):** Selector de rango exacto desde CR 0, 1/8, 1/4, 1/2 hasta CR 30.
* **Tamaño:** Diminuto (Tiny), Pequeño (Small), Mediano (Medium), Grande (Large), Enorme (Huge) y Gargantuesco (Gargantuan).
* **Salvaciones Exigidas (Forced Saves):** Filtra criaturas que obligan a los jugadores a realizar tiradas de salvación específicas (Fuerza, Destreza, Constitución, Inteligencia, Sabiduría, Carisma).
* **Hábitats y Ecosistemas:** Jungla, Ártico, Costa, Desierto, Bosque, Pradera, Colina, Montaña, Pantano, Inframundo (Underdark), Urbano y Planos Exteriores.
* **Velocidades:** Vuelo, Nado, Trepar, Cavar y Levitar.
* **Sentidos:** Visión en la oscuridad, A ciegas, Sentido sísmico y Visión verdadera.
* **Defensas:** Vulnerabilidades, Resistencias e Inmunidades al daño y a condiciones.
* **Buscador Inteligente:** Búsqueda rápida por nombre y palabras clave en tiempo real.

### ⚔️ 3. Constructor de Encuentros (Kobold+ Fight Club)
* **Presupuesto de XP:** Cálculo del umbral de experiencia del grupo (Fácil, Medio, Difícil, Mortal).
* **Multiplicadores Dinámicos:** Ajuste según la cantidad de monstruos y el tamaño del grupo.
* **Soporte Dual de Reglas:**
  * **2014 DMG:** Sistema tradicional con multiplicadores de dificultad.
  * **2024 Revised Rules:** Nuevo sistema de presupuesto de XP por criatura de la guía del DM 2024.

### 🎲 4. Simulador de Combate (BattleSim / Modelo de Trekiros)
* **Simulación Analítica de Markov:** Resolución matemática asalto por asalto con foco táctico en objetivos de baja vida.
* **Pestaña "Mis Jugadores":** Configura fichas reales de tu mesa con nombre, clase, nivel, HP máximo, CA, bono para impactar (`+ATK`) y daño promedio por ronda (`DPR`).
* **Plantillas Automáticas de Clase:** Autocalculado de estadísticas promedio para las 13 clases de 5e (Bárbaro, Bardo, Clérigo, Druida, Guerrero, Monje, Paladín, Explorador, Pícaro, Hechicero, Brujo, Mago, Artífice).
* **Modo "Grupo Rápido":** Para balanceos rápidos basados en cantidad y nivel promedio.
* **Factor Suerte (Slider):** Ajuste de variabilidad probabilística (desde rachas pésimas hasta críticos épicos).
* **Reporte de Combate:** Porcentaje estimado de victoria, probabilidad de TPK, duración estimada en rondas y barras de vida finales para cada héroe.

---

## 🛠️ Tecnologías

* **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Iconografía:** [Lucide React](https://lucide.dev/)
* **Estilos:** Vanilla CSS con sistema de diseño oscuro de alto contraste (WCAG AAA) y estética D&D.
* **Persistencia:** Almacenamiento local automático (`localStorage`) para tu grupo personalizado de jugadores.

---

## 🚀 Instalación y Uso Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/GianCV-code/dnd-bestiary.git
   cd dnd-bestiary
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia MIT. El contenido de las criaturas y referencias del System Reference Document (SRD) de Dungeons & Dragons pertenecen a Wizards of the Coast bajo la Open Gaming License (OGL) y Creative Commons (CC-BY-4.0).
