/* =====================================================================
   Mindoro Pickleball Org Cup 2026 - settings
   Edit this file only. index.html reads everything from here.
   ===================================================================== */
window.MPO_CONFIG = {

  /* Firebase project used by this tool (queue, courts, matches, logs, sessions). */
  firebase: {
    apiKey: "AIzaSyC50jOGl_ZlM-pi0S0UPn3r9U-b0L_M5dk",
    authDomain: "mindoropickleballorg.firebaseapp.com",
    projectId: "mindoropickleballorg",
    storageBucket: "mindoropickleballorg.firebasestorage.app",
    messagingSenderId: "1076342597225",
    appId: "1:1076342597225:web:3d730a65186a41296b64f8"
  },

  /* Firestore collection that holds the team registrations (one doc per team). */
  registrationCollection: "mpo-cup2026",

  /* Optional: read registrations from a DIFFERENT Firebase project.
     Leave as null to use the project above. */
  registrationFirebase: null,

  /* Only registrations whose status starts with this text can be added
     (case-insensitive). "Confirmed-Paid" counts, "Confirmation-Sent" does not. */
  confirmedStatusPrefix: "Confirmed-",

  /* Used as the PDF title when the session has no event name. */
  eventName: "Mindoro Pickleball Org Cup 2026"
};
