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
