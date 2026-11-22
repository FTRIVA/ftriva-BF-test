import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const TOKEN_SHA256 = "4bc9cb1b8ed73b04b790353230cfe23cf80ced437f6ee80046e6a7d7a95d1897";
const PACKAGES = new Set(["START","PROGRESS","PERFORMANCE","DIGITAL"]);
const ASSESSMENT_PACKAGES = new Set(["START","PROGRESS","PERFORMANCE"]);
const TIERS = new Set(["ESSENTIAL","PLUS","ELITE"]);
const STATUSES = new Set(["pending","active","past_due","cancelled","expired","paused"]);
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function safeString(v,max=180){return typeof v==="string"?v.trim().slice(0,max):"";}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function validDate(v){if(typeof v!=="string"||!v)return undefined;const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toISOString():undefined;}
async function sha256Hex(v){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function upsert(table,conflict,row){
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)throw new Error("App database credentials unavailable");
 const r=await fetch(url+"/rest/v1/"+table+"?on_conflict="+encodeURIComponent(conflict),{method:"POST",headers:{apikey:key,authorization:"Bearer "+key,"content-type":"application/json",prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(row)});
 if(!r.ok)throw new Error("Database write failed ("+r.status+"): "+(await r.text()).slice(0,400));
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const supplied=req.headers.get("x-ftriva-sync-token")||"";
 if(!supplied||!equal(await sha256Hex(supplied),TOKEN_SHA256))return json({error:"Unauthorized"},401);
 let body;try{body=await req.json();}catch{return json({error:"Invalid JSON"},400);}
 try{
  const kind=safeString(body.kind,30),email=safeString(body.email,254).toLowerCase();
  if(!validEmail(email))return json({error:"Valid customer email required"},400);
  if(kind==="purchase"){
   const reference=safeString(body.reference,160),packageCode=safeString(body.packageCode,30).toUpperCase(),amountMinor=Number(body.amountMinor),currency=safeString(body.currency,8).toUpperCase();
   if(!reference||!PACKAGES.has(packageCode)||!Number.isSafeInteger(amountMinor)||amountMinor<1||currency!=="ZAR")return json({error:"Invalid verified purchase"},400);
   const paidAt=validDate(body.paidAt)||new Date().toISOString();
   await upsert("purchases","provider_reference",{provider:"paystack",provider_reference:reference,customer_email:email,package_code:packageCode,amount_minor:amountMinor,currency,status:"verified",verified_at:paidAt,provider_payload:{channel:safeString(body.channel,40),package_code:packageCode,amount_minor:amountMinor,currency,paid_at:paidAt,source:"verified_website_webhook"}});
   return json({synced:true,kind,reference});
  }
  if(kind==="membership"){
   const subscriptionReference=safeString(body.subscriptionReference,160),tier=safeString(body.tier,30).toUpperCase(),status=safeString(body.status,30).toLowerCase();
   if(!subscriptionReference||!TIERS.has(tier)||!STATUSES.has(status))return json({error:"Invalid membership"},400);
   const row={provider:"paystack",provider_subscription_reference:subscriptionReference,customer_email:email,tier,status,cancel_at_period_end:body.cancelAtPeriodEnd===true};
   const start=validDate(body.currentPeriodStart),end=validDate(body.currentPeriodEnd);
   if(start)row.current_period_start=start;if(end)row.current_period_end=end;
   await upsert("memberships","provider_subscription_reference",row);
   return json({synced:true,kind,subscriptionReference,status});
  }

  if(kind==="assessment"){
   const paymentReference=safeString(body.paymentReference,160),packageCode=safeString(body.packageCode,30).toUpperCase();
   const assessment=body.assessment;
   if(!paymentReference||!ASSESSMENT_PACKAGES.has(packageCode)||!assessment||typeof assessment!=="object"||Array.isArray(assessment)||JSON.stringify(assessment).length>50000)return json({error:"Invalid assessment submission"},400);
   const submittedAt=validDate(body.submittedAt)||new Date().toISOString();
   const status=body.requiresManualReview===true?"under_review":"submitted";
   await upsert("client_assessments","payment_reference",{payment_reference:paymentReference,customer_email:email,package_code:packageCode,assessment_data:assessment,status,submitted_at:submittedAt,updated_at:new Date().toISOString()});
   return json({synced:true,kind,paymentReference,status});
  }
  return json({error:"Unsupported event"},400);
 }catch(e){console.error("FTRIVA member sync failed",e);return json({error:"Verified event could not be saved"},500);}
});