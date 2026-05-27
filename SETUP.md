# Prode DT — Copa Mundial 2026: Guía de instalación

## Qué es

App web para que el equipo de DT Comunicación pronostique los partidos del Mundial 2026. Incluye:
- Login con Google
- Carga de pronósticos por fecha/etapa
- Sistema de puntos idéntico al de La Unión (12/5/2 pts + penales)
- Tabla de posiciones en tiempo real
- Panel de admin para cargar resultados

---

## Paso a paso

### 1. Crear proyecto en Firebase

1. Ir a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click en **"Crear un proyecto"**
3. Nombre sugerido: `prode-dt-2026`
4. (Opcional) Deshabilitar Google Analytics

### 2. Configurar Authentication

1. En el menú lateral: **Authentication → Método de acceso**
2. Habilitar **Google**
3. Ingresar el email de soporte (ej: hola@dtcomunicacion.com)
4. Guardar

### 3. Crear base de datos Firestore

1. En el menú lateral: **Firestore Database → Crear base de datos**
2. Elegir **"Comenzar en modo producción"**
3. Seleccionar región (recomendado: `southamerica-east1` para menor latencia)

### 4. Aplicar reglas de seguridad Firestore

1. Ir a **Firestore → Reglas**
2. Reemplazar todo el contenido con el del archivo `firestore.rules`
3. **Importante:** actualizar los emails de admin en las reglas con los correctos
4. Click en **Publicar**

### 5. Obtener credenciales de la app web

1. Ir a **Project Settings** (ícono de engranaje)
2. Bajar hasta **"Tus apps"** → Click en **"</>  Web"**
3. Registrar app con nombre `Prode DT`
4. Copiar el objeto `firebaseConfig` que aparece

### 6. Configurar `firebase-config.js`

Abrir el archivo `prode/firebase-config.js` y reemplazar los valores:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",    // ← Tu valor real
  authDomain:        "prode-dt-2026.firebaseapp.com",
  projectId:         "prode-dt-2026",
  storageBucket:     "prode-dt-2026.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

También actualizar los emails de admin si es necesario:
```javascript
const ADMIN_EMAILS = [
  "macarena@dtcomunicacion.com",
  "emi@dtcomunicacion.com",   // ← email real de Emi
];
```

### 7. Desplegar la app

**Opción A — Firebase Hosting (recomendado):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # apuntar al directorio prode/
firebase deploy
```

**Opción B — Netlify / Vercel (más fácil):**
1. Subir la carpeta `prode/` a GitHub
2. Conectar con Netlify/Vercel
3. Deploy automático

**Opción C — Servir localmente para pruebas:**
```bash
cd prode/
npx serve .
# o simplemente abrir index.html con un servidor local
```

> ⚠️ **No abrir index.html directamente** (`file://`). Firebase Auth requiere un servidor HTTP.

### 8. Inicializar los partidos en la base de datos

1. Ingresar a la app con un email admin
2. Click en **ADMIN** → **"Cargar partidos en base de datos"**
3. Esto crea los 104 partidos en Firestore (ejecutar una sola vez)

---

## Gestión del torneo

### Cargar resultados

1. Ingresar como admin (Maca o Emi)
2. Click en **ADMIN**
3. Seleccionar la etapa en el dropdown
4. Ingresar los scores de cada partido
5. Para partidos con penales, elegir el ganador en el selector
6. Click en **Guardar** partido por partido

Los puntos se calculan automáticamente y la tabla se actualiza en tiempo real.

### Actualizar equipos de Fase Final

Cuando se definan los equipos que avanzan a la Fase Final:
1. Ir a **ADMIN** → cambiar la etapa a "Ronda de 32"
2. Por ahora los equipos TBD se pueden actualizar directamente en Firestore:
   - Abrir Firestore → colección `matches` → buscar el partido (ej: `k-r32-1`)
   - Actualizar los campos `home` y `away` con los códigos de equipo (ej: `ARG`, `FRA`)
   - O actualizar `homeLabel` / `awayLabel` con texto libre

---

## Equipo DT

| Jugador | Google con el que ingresar |
|---------|---------------------------|
| Maca    | macarena@dtcomunicacion.com |
| Emi     | (email de Emi)             |
| Tania   | (email de Tania)           |
| Fede    | (email de Fede)            |
| Rocio   | (email de Rocio)           |
| Tomi    | (email de Tomi)            |
| Didi    | (email de Didi)            |
| Andy    | (email de Andy)            |
| Manu    | (email de Manu)            |

Si querés restringir el acceso solo al equipo, completar `ALLOWED_EMAILS` en `firebase-config.js`.

---

## Sistema de puntos

| Situación | Puntos |
|-----------|--------|
| Marcador exacto (ej: 3-1 y acertás 3-1) | **12 pts** |
| Resultado correcto, no exacto (ganador/empate) | **5 pts** |
| Goles de un equipo acertados | **2 pts** |
| Marcador exacto + penales correctos | **17 pts** |
| Resultado no exacto + penales correctos | **+5 pts** al puntaje base |

Las reglas de resultado y goles son **acumulativas**. Ejemplo:  
Resultado real: 3-1 · Tu pronóstico: 3-0 → ganador (5) + goles equipo local (2) = **7 pts**

---

## Archivos del proyecto

```
prode/
├── index.html          ← App completa (SPA)
├── styles.css          ← Estilos con identidad DT
├── matches.js          ← Fixture completo: 72 partidos de grupos + 32 de fase final
├── firebase-config.js  ← Configuración Firebase (⚠️ completar antes de usar)
├── app.js              ← Lógica: auth, pronósticos, puntaje, posiciones, admin
├── firestore.rules     ← Reglas de seguridad para Firestore
└── SETUP.md            ← Esta guía
```
