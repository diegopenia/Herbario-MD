# Herbario MD

**Ruta Segura Bogotá · Zona 0: Minuto de Dios.** Un juego web en 3D del Taller de Videojuegos: recorres el barrio Minuto de Dios (Engativá, Bogotá), registras muestras de árboles nativos reales y te reportas en el punto de encuentro de la plaza, como preparación para un simulacro de evacuación por sismo.

**Jugar:** https://diegopenia.github.io/Herbario-MD/ (computador y celular)

## Qué tiene

- **Mapa real** de unos 370 × 380 m entre la iglesia, el Museo de Arte Contemporáneo, la plaza y el campus de Uniminuto: calles de OpenStreetMap y 745 edificios del Catastro de Bogotá con su número de pisos.
- **380 árboles reales** del censo del arbolado urbano, con especie y altura. El jugador registra muestras de especies nativas (roble andino, nogal, palma de cera, chicalá, cajeto…) y conoce por qué los árboles altos introducidos son un riesgo en un sismo.
- **Editor de personaje** por piezas: cuerpo, silla de ruedas, cara, 15 peinados, ropa (uniforme escolar, ruana…), accesorios (sombrero vueltiao, casco de brigada, mochila de emergencia) y rol del simulacro (brigadista, líder de fila, apoyo a compañeros).
- Mapa como **archivo de datos** (`data/zona-minuto.json`): cada equipo del taller puede crear nuevas zonas sin programar.

## Controles

| Computador | Celular |
| --- | --- |
| W A S D para moverse, Shift para correr | Joystick a la izquierda |
| Arrastrar para girar la cámara, rueda para acercar | Arrastrar a la derecha para mirar |
| Mantener E para registrar una muestra; E para hablar | Botón Registrar (mantener) |
| Espacio para saltar · H para el herbario | Botón Saltar |

## Estructura

```
index.html              Juego listo para jugar (un solo archivo, lo publica GitHub Pages)
src/main.js             Motor del juego (Three.js): mundo, jugador, colisiones, muestras, HUD
src/avatar.js           Sistema de avatar por piezas y animaciones
src/editor.js           Editor de personaje
src/index.html          Plantilla de la interfaz
data/minuto.json        Calles y áreas (OpenStreetMap) y árboles (censo) en metros
data/catastro.txt       Construcciones del catastro (pisos + huella, coordenadas en metros)
data/zona-minuto.json   Archivo de zona que lee el juego
scripts/build-zone.mjs  Convierte los datos abiertos en el archivo de zona
scripts/build.mjs       Empaqueta todo en index.html
scripts/test.py         Prueba automática con Playwright
```

## Cómo reconstruirlo

```bash
npm install three esbuild
node scripts/build-zone.mjs     # genera data/zona-minuto.json
node scripts/build.mjs          # genera dist/index.html (cópialo a la raíz como index.html)
```

## Créditos y licencias de los datos

- Calles, áreas y lugares: © colaboradores de OpenStreetMap, disponibles bajo la [Open Database License (ODbL)](https://www.openstreetmap.org/copyright). Los archivos de `data/` derivados de OpenStreetMap se comparten bajo la misma licencia ODbL.
- Arbolado: [Censo del Arbolado Urbano](https://datosabiertos.bogota.gov.co/dataset/censo-arbolado-urbano), Jardín Botánico de Bogotá José Celestino Mutis, CC BY 4.0 (consultado el 20 de noviembre de 2026).
- Construcciones y número de pisos: [Catastro de Bogotá](https://datosabiertos.bogota.gov.co/dataset/construccion), UAECD, CC BY 4.0.
- Motor 3D: [Three.js](https://threejs.org) (MIT).
- Edificios emblemáticos (Uniminuto, Museo de Arte Contemporáneo, iglesia) modelados con fotos del equipo como referencia; las formas curvas y algunas alturas son aproximadas.
- Las fichas de las especies son un borrador para validar con el Jardín Botánico de Bogotá.

Proyecto del Taller de Videojuegos: service blueprint colaborativo para un simulacro de evacuación por sismo.
