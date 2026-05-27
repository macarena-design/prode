/* =========================================================
   PRODE DT — Configuración de Firebase

   INSTRUCCIONES:
   1. Ir a https://console.firebase.google.com/
   2. Crear un proyecto (ej: "prode-dt-2026")
   3. Habilitar Authentication > Sign-in method > Google
   4. Crear Firestore Database (modo producción)
   5. Ir a Project Settings > Your apps > Add Web App
   6. Copiar los valores de firebaseConfig aquí abajo
   7. En Firestore, aplicar las reglas del archivo
      firestore.rules

   ADMIN EMAILS: los usuarios con estos emails tendrán
   acceso al panel de administración para cargar resultados.
   ========================================================= */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC8-2XyksGfaX-KRFZl-MGji9wL65SKzhc",
  authDomain:        "prode-dt-2026.firebaseapp.com",
  projectId:         "prode-dt-2026",
  storageBucket:     "prode-dt-2026.firebasestorage.app",
  messagingSenderId: "501257557039",
  appId:             "1:501257557039:web:d5ab5cd0ba7af927f7e2da"
};

/* Emails con acceso admin (cargar resultados, gestionar etapas) */
const ADMIN_EMAILS = [
  "macarena@dtcomunicacion.com",
  "emilianobenavente@dtcomunicacion.com",        // reemplazar con el email correcto de Emi
];

/* Emails permitidos para jugar (dejar vacío [] para permitir cualquier Google account) */
const ALLOWED_EMAILS = [
  /* Si querés restringir solo al equipo DT, completar con los emails.
     Si se deja vacío, cualquiera con Google puede entrar (compartir el link es suficiente). */
];

/* ---- Inicialización de Firebase ---- */
firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db   = firebase.firestore();
