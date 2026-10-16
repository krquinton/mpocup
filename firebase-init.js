// Shared Firebase setup + default event details (editable later from admin.html)
const firebaseConfig = {
  apiKey: "AIzaSyC50jOGl_ZlM-pi0S0UPn3r9U-b0L_M5dk",
  authDomain: "mindoropickleballorg.firebaseapp.com",
  projectId: "mindoropickleballorg",
  storageBucket: "mindoropickleballorg.firebasestorage.app",
  messagingSenderId: "1076342597225",
  appId: "1:1076342597225:web:3d730a65186a41296b64f8"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const REG = "mpo-cup2026";                 // registrations collection
const SET = db.collection("mpo-cup2026-settings").doc("event"); // editable event details
const CATEGORIES = ["Low Intermediate Men's Doubles","Low Intermediate Women's Doubles","High Intermediate Men's Doubles","High Intermediate Women's Doubles","Advanced Open (All-Gender Doubles)"];
const STATUSES = ["Submitted","Confirmed-Unpaid","Confirmed-Paid","Rejected"];
const DEFAULTS = {
  date:"[Event date — to be announced]", venue:"[Venue — to be announced]", deadline:"[Registration deadline]",
  fee:"₱[0,000] per team", prize:"₱[000,000] total prize pool", contact:"[Contact person]", phone:"[09XX XXX XXXX]",
  email:"[email@example.com]", facebook:"", slots:16, open:true
};
async function getSettings(){ try{ const s=await SET.get(); return {...DEFAULTS, ...(s.exists?s.data():{})}; }catch(e){ return {...DEFAULTS}; } }
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
