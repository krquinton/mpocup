/* Shared config for MPO Cup 2026. Needs firebase-init.js loaded first (provides db, REG, SET). */
const MPO_CATS=["Low Intermediate Men's Doubles","Low Intermediate Women's Doubles","High Intermediate Men's Doubles","High Intermediate Women's Doubles","Advanced Open (All-Gender Doubles)"];
const MPO_STATUSES=["Submitted","Confirmation-Sent","Confirmed-Unpaid","Confirmed-Partial","Confirmed-Paid","Rejected"];
/* Paste the Google Apps Script web app URL (or any webhook) here. Empty = test mode (no email sent). */
const MPO_WEBHOOK="https://script.google.com/macros/s/AKfycbxYx3jB10cX1SRFUqr_tMbA299AGGf7ZDNG3No-GF0z4UL_VyOynRFEBVMSibr7Hkgw/exec";
const MPO_WEBHOOK_SECRET='somethinghaschangedwithinmesomethingisnotthesame';
const MPO_PAY_MODES=["Cash","Bank transfer","GCash"];
const MPO_SIZES=["XS","S","M","L","XL","2XL","Others"];
const MPO_SHIRT_TYPES=["Tournament Shirt","Organizer Shirt","Merch"];
const MPO_CLASSES=["Organizer","Player","Sponsor"];
const MPO_FIN_CATS=["Venue","Courts & Equipment","Balls","Prizes & Trophies","Shirts & Merch","Referees & Staff","Food & Drinks","Marketing & Printing","Medical & Safety","Admin & Misc"];
const MPO_PLEDGE_STATUS=["Pledged","Received"];
const MPO_SHIRT_PAY=["Paid","Unpaid","Waived"];
/* 6-char unique code (A-Z, 0-9; skips look-alikes 0/O/1/I). Pass the registrations collection ref to guarantee uniqueness. */
async function mpoGenCode(col){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
 for(let t=0;t<20;t++){let c="";const r=crypto.getRandomValues(new Uint32Array(6));for(const n of r)c+=A[n%A.length];
  if(!(await col.where("code","==",c).limit(1).get()).size)return c;}
 throw new Error("Could not generate a unique code");}
/* Registration opens at this time (PH, UTC+8) on the "opens" date. */
const MPO_OPEN_TIME="12:00:00";
const MPO_DEF={date:"November 28–29, 2026",venue:"Balai Mindoro",fee:"₱1,500 per player",feeNum:"1500",slots:"24",open:"2026-10-17",close:"2026-11-17",mode:"auto",contact:"",phone:"",email:""};
const mpoEsc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function mpoSettings(){const d=(await SET.get()).data()||{},o={};for(const k in MPO_DEF)o[k]=d["x_"+k]??MPO_DEF[k];return o;}
async function mpoSave(o){const d={};for(const k in o)d["x_"+k]=o[k];await SET.set(d,{merge:true});}
const mpoFmt=(iso,o)=>new Date(iso+"T12:00:00+08:00").toLocaleDateString("en-PH",{timeZone:"Asia/Manila",...o});
function mpoState(s){if(s.mode==="open")return"open";if(s.mode==="closed")return"closed";
 const n=Date.now(),a=Date.parse(s.open+"T"+MPO_OPEN_TIME+"+08:00"),b=Date.parse(s.close+"T23:59:59+08:00");return n<a?"soon":n>b?"closed":"open";}
function mpoStatusText(s,st){return st==="open"?"Registration is open until "+mpoFmt(s.close,{month:"long",day:"numeric",year:"numeric"})+".":st==="soon"?"Registration opens "+mpoFmt(s.open,{weekday:"long",month:"long",day:"numeric",year:"numeric"})+" at 12:00 PM (PH time).":"Registration is closed.";}
