const firebaseConfig = {
  apiKey: "AIzaSyC50jOGl_ZlM-pi0S0UPn3r9U-b0L_M5dk",
  authDomain: "mindoropickleballorg.firebaseapp.com",
  databaseURL: "https://mindoropickleballorg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mindoropickleballorg",
  storageBucket: "mindoropickleballorg.firebasestorage.app",
  messagingSenderId: "1076342597225",
  appId: "1:1076342597225:web:3d730a65186a41296b64f8"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// Data: mpo/teams = [names]  mpo/config = {title,pools,effect,speed,sound}  mpo/draw = {at,effect,pools:{A:[names]}}
