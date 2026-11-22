var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var FTRIVA_APP_JS = "const $ = (s, root=document) => root.querySelector(s);\nconst $ = (s, root=document) => [...root.querySelectorAll(s)];\nconst menu = $('.menu-toggle');\nif (menu) menu.addEventListener('click', () => $('.nav-links')?.classList.toggle('open'));\nconst current = location.pathname.split('/').pop() || 'index.html';\n$('.nav-links a').forEach(a => { if (a.getAttribute('href') === current) a.classList.add('active'); });\nconst PACKAGE_INFO = {\n START:{name:'START',price:'R199',regular:'R299',type:'once_off'},\n PROGRESS:{name:'PROGRESS',price:'R399',regular:'R549',type:'once_off'},\n PERFORMANCE:{name:'PERFORMANCE',price:'R299',regular:'R399',type:'once_off'},\n DIGITAL:{name:'DIGITAL',price:'R49',regular:'R149',type:'once_off'},\n ESSENTIAL:{name:'ESSENTIAL',price:'R249 / month',type:'monthly'},\n PLUS:{name:'PLUS',price:'R399 / month',type:'monthly'},\n ELITE:{name:'ELITE',price:'R599 / month',type:'monthly'}\n};\nfunction escapeHtml(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));}\n\nconst quizForm = $('#recommendation-form');\nif (quizForm) quizForm.addEventListener('submit', e => {\n e.preventDefault(); const data=new FormData(quizForm); const goal=data.get('goal'); const experience=String(data.get('experience')||'').trim().toLowerCase(); const ongoing=data.get('coaching')==='ongoing';\n let id=ongoing?'PLUS':goal==='performance'?'PERFORMANCE':experience==='beginner'||experience.includes('returning')?'START':'PROGRESS';\n const p=PACKAGE_INFO[id], result=$('#recommendation-result'); result.classList.remove('hidden');\n result.innerHTML=`<span class=\"recommend-label\">Suggested for you</span><h3>${p.name} — ${p.price}</h3><p>Based on your answers, ${p.name} may be a useful starting point. This is a recommendation, not a restriction — you can choose any package.</p><a class=\"btn btn-bronze\" href=\"start-assessment.html?package=${id}\">Choose ${id}</a><div class=\"recommendation-package-list\"><a href=\"#packages\">Compare all seven packages</a></div>`;\n result.scrollIntoView({behavior:'smooth',block:'center'});\n});\n\nconst checkoutForm=$('#checkout-form');\nif(checkoutForm){\n const id=new URLSearchParams(location.search).get('package')?.toUpperCase(); const p=PACKAGE_INFO[id]; const field=$('#package');\n if(!p){$('#selected-package-name').textContent='No package selected';$('#selected-package-price').textContent='Please return to the packages page and choose one.';checkoutForm.classList.add('hidden');}\n else {field.value=id;$('#selected-package-name').textContent=p.name;$('#selected-package-price').textContent=p.price+(p.regular?` · Black Friday (regular price R${p.regular.replace('R','')})`:'');}\n checkoutForm.addEventListener('submit',async e=>{e.preventDefault();const button=$('button[type=\"submit\"]',checkoutForm),message=$('#checkout-message');message.className='';message.textContent='';button.disabled=true;button.textContent='Connecting to secure checkout…';\n try{const payload=Object.fromEntries(new FormData(checkoutForm).entries());const response=await fetch('/api/payment/initialize',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to start checkout.');location.href=result.authorizationUrl;}\n catch(err){message.className='error';message.textContent=err.message;button.disabled=false;button.textContent='Continue to secure Paystack checkout';}\n });\n}\n\nconst foundingForm=$('#founding10-form');\nif(foundingForm) foundingForm.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type=\"submit\"]',foundingForm),msg=$('#founding10-message');msg.className='';msg.textContent='';btn.disabled=true;btn.textContent='Checking availability…';\n try{const payload=Object.fromEntries(new FormData(foundingForm).entries());const response=await fetch('/api/founding10/claim',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok||!result.claimed)throw new Error(result.error||'A Founding 10 place could not be confirmed.');if(payload.package==='DIGITAL'){foundingForm.reset();msg.className='success';msg.textContent='Your Founding 10 DIGITAL claim is confirmed. No payment or fitness assessment is required. FTRIVA will contact you at the email address provided to arrange delivery.';btn.textContent='Claim confirmed';return;}sessionStorage.setItem('ftriva_founding10_claim',result.claimToken);location.href=`assessment.html?founding10=1&package=${encodeURIComponent(payload.package)}`;}\n catch(err){msg.className='error';msg.textContent=err.message;btn.disabled=false;btn.textContent='Claim my free programme';}\n});\n\nconst callbackMessage=$('#callback-message');\nif(callbackMessage){const params=new URLSearchParams(location.search),reference=params.get('reference')||params.get('trxref');if(!reference)callbackMessage.innerHTML='<div class=\"error\">No payment reference was found. Please contact FTRIVA before trying again.</div>';else{(async()=>{callbackMessage.innerHTML='<p>Verifying your payment securely…</p>';try{const response=await fetch('/api/payment/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference})});const result=await response.json();if(result.verified&&!result.recorded){callbackMessage.innerHTML=`<div class=\"error\"><strong>Your payment is verified, but the purchase record needs attention.</strong><p>${escapeHtml(result.error||'Do not pay again. Please contact FTRIVA so the verified payment can be reconciled.')}</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;return;}if(!response.ok||!result.verified)throw new Error(result.error||'Payment could not be verified.');sessionStorage.setItem('ftriva_verified_reference',result.reference);sessionStorage.setItem('ftriva_verified_package',result.package);if(result.package==='DIGITAL'){if(!result.digitalDeliveryReady||!result.digitalDownloads){callbackMessage.innerHTML='<div class=\"success\"><strong>Payment verified.</strong><p>Your DIGITAL purchase is recorded, but the download links are still being prepared. Do not pay again. Contact FTRIVA if they do not arrive.</p><a class=\"btn btn-dark\" href=\"https://app-test.ftriva.com\">Open FTRIVA app</a></div>';}else{const d=result.digitalDownloads;const links=(d.toolkit?'<a class=\"btn btn-dark\" href=\"'+escapeHtml(d.toolkit)+'\">Download Training Toolkit</a>':'')+(d.tracker?'<a class=\"btn btn-bronze\" href=\"'+escapeHtml(d.tracker)+'\">Download Workout Tracker</a>':'');callbackMessage.innerHTML='<div class=\"success\"><strong>Payment verified.</strong><p>Your DIGITAL purchase is confirmed. You can download your files now or access them later in the FTRIVA app using the same email address used at checkout.</p><div class=\"contact-row\">'+links+'</div><p><a class=\"btn btn-dark\" href=\"https://app-test.ftriva.com\">Open FTRIVA app</a></p><p>To install: on iPhone/iPad, open the app in Safari, tap Share, then Add to Home Screen. On Android, use Chrome’s menu and choose Install app or Add to Home screen.</p></div>';}}else if(['ESSENTIAL','PLUS','ELITE'].includes(result.package)){if(result.membershipRecorded){callbackMessage.innerHTML=`<div class=\"success\"><strong>Your membership is active.</strong><p>Your ${escapeHtml(result.package)} membership payment is verified and your app access has been synchronised. Sign in with the same email address used at checkout.</p><a class=\"btn btn-dark\" href=\"https://app-test.ftriva.com\">Open FTRIVA app</a></div>`;}else{callbackMessage.innerHTML=`<div class=\"error\"><strong>Your payment is verified.</strong><p>Your ${escapeHtml(result.package)} membership is still being activated. Do not pay again. Please contact FTRIVA if you do not receive confirmation.</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;}}else{callbackMessage.innerHTML=`<div class=\"success\"><strong>Payment verified.</strong><p>Your ${escapeHtml(result.package)} purchase has been recorded. You can now complete your detailed fitness assessment.</p><a class=\"btn btn-dark\" href=\"assessment.html?reference=${encodeURIComponent(result.reference)}&package=${encodeURIComponent(result.package)}\">Continue to fitness assessment</a></div>`;}}\n catch(err){callbackMessage.innerHTML=`<div class=\"error\"><strong>Payment not verified.</strong><p>${escapeHtml(err.message)}</p><p>If money was deducted, do not pay again until the transaction has been checked.</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;}})();}}\n\nconst assessmentForm=$('#assessment-form');\nif(assessmentForm){\n const params=new URLSearchParams(location.search),claimToken=params.get('claim')||sessionStorage.getItem('ftriva_founding10_claim')||'';\n let reference=params.get('reference')||params.get('trxref')||sessionStorage.getItem('ftriva_verified_reference')||'';\n let verifiedPackage=params.get('package')||sessionStorage.getItem('ftriva_verified_package')||'Selected FTRIVA package';\n const claimField=$('#founding-claim-token'),locked=$('#assessment-locked'),paymentField=$('#payment-reference'),packageLabel=$('#assessment-package');\n const showAssessment=()=>{locked?.classList.add('hidden');assessmentForm.classList.remove('hidden');};\n const lockAssessment=message=>{assessmentForm.classList.add('hidden');locked?.classList.remove('hidden');const status=$('#assessment-message');if(message&&status){status.className='';status.textContent=message;}};\n if(claimToken){if(claimField)claimField.value=claimToken;showAssessment();if(packageLabel)packageLabel.textContent='FOUNDING 10 — '+(params.get('package')||'Free personalised programme');}\n else if(reference){\n  lockAssessment('Verifying your existing payment securely with Paystack…');\n  (async()=>{try{const response=await fetch('/api/payment/recover',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference})});const result=await response.json();if(!response.ok||!result.verified)throw new Error(result.error||'Payment could not be verified.');reference=result.reference;verifiedPackage=result.package;if(paymentField)paymentField.value=reference;if(packageLabel)packageLabel.textContent=verifiedPackage;sessionStorage.setItem('ftriva_verified_reference',reference);sessionStorage.setItem('ftriva_verified_package',verifiedPackage);showAssessment();}catch(err){lockAssessment('We could not restore access to this assessment. If you have already paid, do not pay again. Contact FTRIVA with your Paystack transaction reference. '+err.message);}})();\n }else{lockAssessment();}\n $('[data-conditional]').forEach(el=>{const source=el.dataset.conditional;const update=()=>{const target=document.getElementById(el.dataset.target);if(target)target.classList.toggle('hidden',!el.checked);};$(`[name=\"${source}\"]`).forEach(input=>input.addEventListener('change',update));update();});\n assessmentForm.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type=\"submit\"]',assessmentForm),msg=$('#assessment-message');const under18=$('[name=\"under18\"]',assessmentForm)?.value==='yes';if(under18){const guardianName=$('[name=\"guardianName\"]',assessmentForm)?.value.trim();const guardianEmail=$('[name=\"guardianEmail\"]',assessmentForm)?.value.trim();const guardianConsent=$('[name=\"guardianConsent\"]',assessmentForm)?.checked;if(!guardianName||!guardianEmail||!guardianConsent){msg.className='error';msg.textContent='Because the client is under 18, please provide the parent/guardian name and email address and confirm that parent/guardian consent has been obtained.';return;}}btn.disabled=true;btn.textContent='Submitting securely…';msg.className='';msg.textContent='';const fd=new FormData(assessmentForm),data={};for(const [key,value] of fd.entries()){if(['paymentReference','foundingClaimToken'].includes(key))continue;if(key.endsWith('[]')){const k=key.slice(0,-2);(data[k]||=[]).push(value);}else if(data[key]!==undefined)data[key]=Array.isArray(data[key])?[...data[key],value]:[data[key],value];else data[key]=value;}\n const assessment={personal:{fullName:data.fullName,email:data.email,phone:data.phone,dateOfBirth:data.dateOfBirth,under18:data.under18,country:data.country,communication:data.communication,guardianName:data.guardianName,guardianEmail:data.guardianEmail,guardianConsent:data.guardianConsent==='yes'},goals:{primary:data.primaryGoal,secondary:data.secondaryGoal,target:data.target,motivation:data.motivation},trainingHistory:{structured:data.structuredTraining,experience:data.experience,trainingTypes:data.trainingTypes,lastConsistent:data.lastConsistent},currentActivity:{activityLevel:data.activityLevel,daysPerWeek:data.daysPerWeek,activities:data.activities,fitnessLevel:data.fitnessLevel,height:data.height,weight:data.weight},health:{injuryOrPain:data.injuryOrPain,injuryDetails:data.injuryDetails,conditions:data.conditions,medication:data.medication,restrictions:data.restrictions,warningSymptoms:data.warningSymptoms,avoidMovements:data.avoidMovements},equipment:{environment:data.environment,equipment:data.equipment,access:data.access,limitations:data.limitations},schedule:{sessions:data.sessions,duration:data.duration,days:data.days,sport:data.sport,restPreference:data.restPreference},preferences:{styles:data.styles,favouriteExercises:data.favouriteExercises,dislikedExercises:data.dislikedExercises,sessionStyle:data.sessionStyle},startDate:data.startDate==='specific_date'?data.desiredStartDate:data.startDate,startDatePreference:data.startDate,additionalComments:data.additionalComments,consents:{accurate:data.consentAccurate,privacy:data.consentPrivacy,onlineScope:data.consentScope,guardian:data.guardianConsent}};\n try{const payload=claimToken?{claimToken,assessment}:{paymentReference:reference,assessment};const response=await fetch('/api/assessment/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error+(result.detail?` ${result.detail}`:''));msg.className='success';msg.textContent='Thank you. Your assessment has been submitted successfully. FTRIVA will review your information and prepare your programme.';assessmentForm.reset();sessionStorage.removeItem('ftriva_verified_reference');sessionStorage.removeItem('ftriva_verified_package');sessionStorage.removeItem('ftriva_founding10_claim');}\n catch(err){msg.className='error';msg.textContent=err.message;}btn.disabled=false;btn.textContent='Submit my assessment';});\n}\n";
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
var CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-paystack-signature"
};
var PACKAGES = {
  START: { name: "START", amount: 19900, type: "once_off", assessmentRequired: true },
  PROGRESS: { name: "PROGRESS", amount: 39900, type: "once_off", assessmentRequired: true },
  PERFORMANCE: { name: "PERFORMANCE", amount: 29900, type: "once_off", assessmentRequired: true },
  DIGITAL: { name: "DIGITAL", amount: 4900, type: "digital", assessmentRequired: false },
  ESSENTIAL: { name: "ESSENTIAL", amount: 24900, type: "monthly", planEnv: "PAYSTACK_PLAN_ESSENTIAL" },
  PLUS: { name: "PLUS", amount: 39900, type: "monthly", planEnv: "PAYSTACK_PLAN_PLUS" },
  ELITE: { name: "ELITE", amount: 59900, type: "monthly", planEnv: "PAYSTACK_PLAN_ELITE" }
};
var FOUNDING10_PACKAGES = /* @__PURE__ */ new Set(["START", "PROGRESS", "PERFORMANCE", "DIGITAL"]);
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
__name(json, "json");
function safeText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
__name(safeText, "safeText");
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}
__name(validEmail, "validEmail");
function validateAssessmentPayload(assessment) {
  const personal = assessment?.personal || {};
  const goals = assessment?.goals || {};
  const training = assessment?.trainingHistory || {};
  const activity = assessment?.currentActivity || {};
  const health = assessment?.health || {};
  const equipment = assessment?.equipment || {};
  const schedule = assessment?.schedule || {};
  const consents = assessment?.consents || {};
  const required = [
    personal.fullName,
    personal.dateOfBirth,
    personal.email,
    personal.phone,
    personal.country,
    personal.communication,
    personal.under18,
    goals.primary,
    training.structured,
    training.experience,
    activity.activityLevel,
    health.injuryOrPain,
    health.warningSymptoms,
    equipment.environment,
    schedule.sessions,
    schedule.duration,
    assessment.startDatePreference,
    assessment.startDate
  ];
  if (required.some((value) => !safeText(String(value ?? ""), 500))) {
    throw new Error("Please complete all required assessment fields.");
  }
  if (!validEmail(safeText(personal.email, 254))) {
    throw new Error("Please provide a valid assessment email address.");
  }
  if (!safeText(personal.fullName, 120) || safeText(personal.phone, 40).length < 7) {
    throw new Error("Please provide your full name and a valid phone number.");
  }
  const dob = safeText(personal.dateOfBirth, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new Error("Please provide a valid date of birth.");
  }
  const dobDate = /* @__PURE__ */ new Date(dob + "T00:00:00.000Z");
  if (Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob) {
    throw new Error("Please provide a valid date of birth.");
  }
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(/* @__PURE__ */ new Date());
  const part = /* @__PURE__ */ __name((type) => todayParts.find((item) => item.type === type)?.value || "", "part");
  const today = part("year") + "-" + part("month") + "-" + part("day");
  if (dob > today) throw new Error("Date of birth cannot be in the future.");
  let age = Number(part("year")) - Number(dob.slice(0, 4));
  const birthMonth = Number(dob.slice(5, 7));
  const birthDay = Number(dob.slice(8, 10));
  if (Number(part("month")) < birthMonth || Number(part("month")) === birthMonth && Number(part("day")) < birthDay) age--;
  const isMinor = age < 18;
  if (!["yes", "no"].includes(personal.under18) || personal.under18 === "yes" !== isMinor) {
    throw new Error("The under-18 answer must match the date of birth provided.");
  }
  const consentGiven = /* @__PURE__ */ __name((value) => value === "yes" || value === true, "consentGiven");
  if (!consentGiven(consents.accurate) || !consentGiven(consents.privacy) || !consentGiven(consents.onlineScope)) {
    throw new Error("Please confirm the accuracy, privacy and online-service consent statements before submitting.");
  }
  if (isMinor) {
    if (!safeText(personal.guardianName, 120) || !validEmail(safeText(personal.guardianEmail, 254)) || personal.guardianConsent !== true || !consentGiven(consents.guardian)) {
      throw new Error("For a client under 18, parent/guardian details and consent are required.");
    }
  }
  const startPreference = safeText(assessment.startDatePreference, 40);
  if (startPreference === "specific_date") {
    const requestedDate = safeText(assessment.startDate, 10);
    const requestedDateValue = /* @__PURE__ */ new Date(requestedDate + "T00:00:00.000Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || Number.isNaN(requestedDateValue.getTime()) || requestedDateValue.toISOString().slice(0, 10) !== requestedDate || requestedDate < today) {
      throw new Error("Please choose a valid programme start date that is today or later.");
    }
  } else if (!["as_soon_as_available", "within_7_days", "within_14_days", "within_30_days"].includes(startPreference)) {
    throw new Error("Please choose a valid programme start preference.");
  }
  const requiresManualReview = String(health.warningSymptoms).toLowerCase() !== "no" || String(health.injuryOrPain).toLowerCase() === "yes" || Boolean(safeText(health.restrictions, 1200));
  return { isMinor, requiresManualReview };
}
__name(validateAssessmentPayload, "validateAssessmentPayload");
function getSupabaseConfig(env) {
  const url = safeText(env.SUPABASE_URL, 300).replace(/\/+$/, "");
  const key = safeText(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY, 1e3);
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and the Supabase secret key as SUPABASE_SECRET_KEY in Cloudflare Worker Secrets.");
  }
  return { url, key };
}
__name(getSupabaseConfig, "getSupabaseConfig");
async function supabaseRequest(path, env, options = {}) {
  const { url, key } = getSupabaseConfig(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  if (!key.startsWith("sb_secret_") && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${key}`);
  }
  if (!headers.has("content-type") && options.body !== void 0) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Supabase request failed (${response.status}): ${(detail || "Unknown error").slice(0, 500)}`);
  }
  return data;
}
__name(supabaseRequest, "supabaseRequest");
async function sendSignupNotification(env, signupType, idempotencyKey) {
  const key = safeText(idempotencyKey, 180);
  if (!key) return;
  const textBody = "A new FTRIVA " + safeText(signupType, 100) + " has been recorded. Sign in to the FTRIVA website admin to review it. No customer personal or assessment information is included in this email.";
  const htmlBody = "<div style='font-family:Arial,sans-serif;color:#101D2B'><h2>New FTRIVA sign-up</h2><p>A new FTRIVA " + emailEscape(signupType) + " has been recorded.</p><p>Sign in to the FTRIVA website admin to review it.</p><p>No customer personal or assessment information is included in this email.</p></div>";
  await sendFtrivaEmailOnce(env, "ftriva:signup:" + key, "signup_internal", "ftrivafitness@gmail.com", "New FTRIVA sign-up", textBody, htmlBody, { signup_type: safeText(signupType, 100) });
}


function emailEscape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function sendFtrivaEmailOnce(env,key,template,recipient,subject,textBody,htmlBody,payload){
 try{
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?on_conflict=idempotency_key",env,{method:"POST",headers:{prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({customer_email:recipient,template_key:template,idempotency_key:key,payload,delivery_status:"pending"})});
  const rows=await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?idempotency_key=eq."+encodeURIComponent(key)+"&select=id,delivery_status,attempts&limit=1",env);
  const row=Array.isArray(rows)?rows[0]:null;if(!row||row.delivery_status==="sent"||row.delivery_status==="cancelled")return;
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(row.id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({attempts:Number(row.attempts||0)+1,delivery_status:"pending",last_error:null,updated_at:new Date().toISOString()})});
  if(!env.RESEND_API_KEY)throw new Error("RESEND_API_KEY is not configured on the TEST Worker.");
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:"Bearer "+env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":key},body:JSON.stringify({from:"FTRIVA <notifications@notify.ftriva.com>",to:[recipient],subject,text:textBody,html:htmlBody})});
  const body=await response.text();if(!response.ok)throw new Error("Resend rejected email ("+response.status+"): "+body.slice(0,400));
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(row.id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({delivery_status:"sent",sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()})});
 }catch(error){
  console.error("FTRIVA transactional email failed:",template,error?.message||"Unknown email error");
  try{const rows=await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?idempotency_key=eq."+encodeURIComponent(key)+"&select=id&limit=1",env);if(Array.isArray(rows)&&rows[0])await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(rows[0].id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({delivery_status:"failed",last_error:String(error?.message||"Email delivery failed").slice(0,500),updated_at:new Date().toISOString()})})}catch(e){console.error("FTRIVA outbox update failed:",e?.message||"Unknown error")}
 }
}
async function sendFtrivaPurchaseEmails(env,payment,packageId,packageInfo,subscriptionCode=null){
 const email=safeText(payment.customer?.email,254).toLowerCase();if(!validEmail(email))return;
 const membership=packageInfo.type==="monthly";const needsAssessment=!membership&&packageInfo.assessmentRequired===true;const isDigital=packageId==="DIGITAL";
 const ref=safeText(membership?(subscriptionCode||payment.subscription_code||payment.subscription?.subscription_code||payment.reference):payment.reference,160);const key=ref||await sha256(email+":"+packageId);
 const name=safeText(payment.metadata?.customer_name||payment.metadata?.full_name,120)||"there";const amount=(Number(payment.amount||packageInfo.amount)/100).toFixed(2);const appUrl="https://app-test.ftriva.com";
 const subject=membership?"Your FTRIVA membership is active":needsAssessment?"Your FTRIVA purchase is confirmed":"Your FTRIVA DIGITAL resources are ready";
 const intro=membership?"Your FTRIVA "+packageId+" membership is active.":needsAssessment?"Your FTRIVA "+packageId+" purchase is confirmed.":"Your FTRIVA DIGITAL resources are ready.";
 const nextStep=needsAssessment?"Your personalised programme will appear in the app after you complete your assessment and FTRIVA has reviewed and prepared your plan. If you have not submitted your assessment yet, return to the FTRIVA website and complete it.":isDigital?"Your DIGITAL Training Toolkit and Workout Tracker are available in the Downloads section after you sign in.":"Your membership access is active in the app.";
 const textBody=["Hi "+name+",","",intro,"Amount: R"+amount,"",nextStep,"","Log in at "+appUrl+" using the same email address used at checkout. If you are new, create an account and confirm your email first.","","Add to Home Screen:","iPhone/iPad: Open this link in Safari, tap Share, then Add to Home Screen.","Android: Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.","","Need help? WhatsApp FTRIVA: +27 74 616 0421","","FIT. TRAIN. THRIVE.","FTRIVA"].join(String.fromCharCode(10));
 const heading=membership?"Your membership is active":needsAssessment?"Your purchase is confirmed":"Your DIGITAL resources are ready";
 const htmlBody="<div style='background:#F5F1E8;padding:28px;font-family:Arial,sans-serif;color:#101D2B'><div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px'><div style='font-weight:900;letter-spacing:4px;font-size:22px'>FTRIVA</div><div style='color:#A8B8A0;font-size:11px;letter-spacing:2px;margin-top:4px'>FIT. TRAIN. THRIVE.</div><h1 style='font-size:25px;margin-top:28px'>"+heading+"</h1><p>Hi "+emailEscape(name)+",</p><p>"+emailEscape(intro)+"</p><p style='background:#F5F1E8;padding:14px;border-radius:8px'>Amount: <b>R"+amount+"</b></p><p>"+emailEscape(nextStep)+"</p><p><a href='"+appUrl+"' style='display:inline-block;background:#101D2B;color:white;padding:13px 18px;border-radius:8px;text-decoration:none;font-weight:bold'>Open your FTRIVA app</a></p><h3>Sign in</h3><p>Use the same email address used at checkout. If you are new, create an account and confirm your email first.</p><h3>Add to your Home Screen</h3><p><b>iPhone/iPad:</b> Open in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.</p><p>Need help? WhatsApp <b>+27 74 616 0421</b>.</p><p style='color:#A8B8A0;font-weight:bold'>FIT. TRAIN. THRIVE.</p></div></div>";
 const payload={package:packageId,amount:Number(payment.amount||packageInfo.amount),currency:payment.currency||"ZAR",reference:ref,environment:"test"};
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":customer",membership?"membership_activation_customer":"programme_purchase_customer",email,subject,textBody,htmlBody,payload);
 const internalSubject="FTRIVA "+(membership?"membership activated":"programme purchase confirmed")+" — "+packageId;
 const internalText=["A verified FTRIVA "+(membership?"membership activation":"programme purchase")+" has completed.","Package: "+packageId,"Amount: R"+amount,"Reference: "+ref,"Environment: TEST","The app entitlement sync completed before this notification was queued."].join(String.fromCharCode(10));
 const internalHtml="<div style='font-family:Arial,sans-serif;color:#101D2B'><h2>FTRIVA "+(membership?"membership activated":"purchase confirmed")+"</h2><p>Package: <b>"+emailEscape(packageId)+"</b></p><p>Amount: <b>R"+amount+"</b></p><p>Reference: "+emailEscape(ref)+"</p><p>Environment: TEST</p></div>";
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":internal",membership?"membership_activation_internal":"programme_purchase_internal","ftrivafitness@gmail.com",internalSubject,internalText,internalHtml,payload);
}async function sendFtrivaMembershipEmails(env,email,packageId,subscriptionCode,data){const amount=Number(data.amount||data.plan?.amount||PACKAGES[packageId].amount);const payment={reference:subscriptionCode,subscription_code:subscriptionCode,amount,currency:"ZAR",customer:{email},metadata:{}};await sendFtrivaPurchaseEmails(env,payment,packageId,PACKAGES[packageId],subscriptionCode)}

async function paystackRequest(path, secret, body) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.status) {
    throw new Error(result.message || `Paystack request failed (${response.status}).`);
  }
  return result.data;
}
__name(paystackRequest, "paystackRequest");
async function verifyPaystack(reference, env) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured in this Worker.");
  }
  const payment = await paystackRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    env.PAYSTACK_SECRET_KEY
  );
  if (payment.status !== "success") {
    throw new Error("Paystack has not verified this transaction as successful.");
  }
  return payment;
}
__name(verifyPaystack, "verifyPaystack");
async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function getPackageFromPayment(payment) {
  const packageId = safeText(payment?.metadata?.ftriva_package, 30).toUpperCase();
  return { packageId, packageInfo: PACKAGES[packageId] || null };
}
__name(getPackageFromPayment, "getPackageFromPayment");
function verifyAmountAndCurrency(payment, packageId, packageInfo) {
  if (!packageInfo) throw new Error("This transaction is not associated with a recognised FTRIVA package.");
  if (payment.currency !== "ZAR") throw new Error("The verified transaction currency does not match ZAR.");
  const actualAmount = Number(payment.amount);
  if (!Number.isFinite(actualAmount) || actualAmount !== packageInfo.amount) {
    throw new Error("The verified transaction amount does not match the current price for this FTRIVA package.");
  }
}
__name(verifyAmountAndCurrency, "verifyAmountAndCurrency");
async function syncMembershipFromVerifiedPayment(payment, packageId, env) {
  const packageInfo = PACKAGES[packageId];
  if (!packageInfo || packageInfo.type !== "monthly") return null;
  const customerId = safeText(String(payment.customer?.id || ""), 40);
  const customerEmail = safeText(payment.customer?.email, 254).toLowerCase();
  const planCode = safeText(
    payment.plan_object?.plan_code || payment.plan?.plan_code || (typeof payment.plan === "string" ? payment.plan : "") || env[packageInfo.planEnv],
    160
  );
  if (!customerId || !validEmail(customerEmail) || !planCode) {
    throw new Error("The verified monthly payment does not contain enough Paystack customer and plan details to reconcile its subscription.");
  }
  if (planCode !== safeText(env[packageInfo.planEnv], 160)) {
    throw new Error("The verified monthly payment plan does not match the configured FTRIVA membership plan.");
  }
  const expectedDomain = (env.ENVIRONMENT || "test").toLowerCase() === "production" ? "live" : "test";
  const paymentTime = Date.parse(payment.paid_at || payment.paidAt || payment.created_at || payment.createdAt || "");
  const eventSubscriptionCode = safeText(payment.subscription_code || payment.subscription?.subscription_code, 160);
  let subscription = null;
  let subscriptionLookupError = null;
  try {
    const query = new URLSearchParams({ customer: customerId, perPage: "100", page: "1" });
    const subscriptions = await paystackRequest(`/subscription?${query.toString()}`, env.PAYSTACK_SECRET_KEY);
    const matches = (Array.isArray(subscriptions) ? subscriptions : []).filter((candidate) => {
      const email = safeText(candidate.customer?.email, 254).toLowerCase();
      const candidatePlan = safeText(candidate.plan?.plan_code, 160);
      const domain = safeText(candidate.domain, 20).toLowerCase();
      const createdAt = Date.parse(candidate.createdAt || "");
      return email === customerEmail && candidatePlan === planCode && domain === expectedDomain && safeText(candidate.status, 40).toLowerCase() === "active" && Number.isFinite(paymentTime) && Number.isFinite(createdAt) && Math.abs(createdAt - paymentTime) <= 36 * 60 * 60 * 1e3;
    }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    subscription = matches[0] || null;
  } catch (error) {
    subscriptionLookupError = error;
  }
  if (!subscription) {
    const existingRows = await supabaseRequest(
      `/rest/v1/ftriva_memberships?customer_email=eq.${encodeURIComponent(customerEmail)}&package_id=eq.${encodeURIComponent(packageId)}&status=in.(active,non_renewing,attention,past_due)&select=paystack_subscription_code,status&order=created_at.desc&limit=10`,
      env
    );
    const usableRows = Array.isArray(existingRows) ? existingRows.filter((row) => safeText(row.paystack_subscription_code, 160)) : [];
    let existing = null;
    if (eventSubscriptionCode) {
      existing = usableRows.find((row) => row.paystack_subscription_code === eventSubscriptionCode) || null;
    }
    if (!existing && usableRows.length === 1) existing = usableRows[0];
    if (!existing && usableRows.length > 1) {
      throw new Error("More than one active FTRIVA membership matches this customer and plan. The payment was recorded, but subscription reconciliation needs manual review.");
    }
    if (!existing) {
      if (subscriptionLookupError) throw subscriptionLookupError;
      throw new Error("Paystack has verified the membership payment, but its matching active subscription is not available yet. The webhook can retry safely; do not pay again.");
    }
    await supabaseRequest(
      `/rest/v1/ftriva_purchases?payment_reference=eq.${encodeURIComponent(payment.reference)}`,
      env,
      {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ paystack_subscription_code: existing.paystack_subscription_code })
      }
    );
    await syncMemberAppMembership(env, existing.paystack_subscription_code);
    return existing.paystack_subscription_code;
  }
  const subscriptionCode = safeText(subscription.subscription_code, 160);
  if (!subscriptionCode) {
    throw new Error("Paystack returned a matching subscription without a subscription code.");
  }
  await supabaseRequest("/rest/v1/ftriva_memberships?on_conflict=paystack_subscription_code", env, {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      customer_email: customerEmail,
      package_id: packageId,
      paystack_customer_code: safeText(subscription.customer?.customer_code, 160) || safeText(payment.customer?.customer_code, 160) || null,
      paystack_subscription_code: subscriptionCode,
      paystack_email_token: safeText(subscription.email_token, 300) || null,
      paystack_plan_code: planCode,
      amount: Number(subscription.amount || subscription.plan?.amount || packageInfo.amount),
      currency: safeText(subscription.plan?.currency, 8) || "ZAR",
      status: safeText(subscription.status, 40).toLowerCase(),
      start_date: subscription.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      next_payment_date: subscription.next_payment_date || null,
      raw_paystack_data: subscription
    })
  });
  await supabaseRequest(
    `/rest/v1/ftriva_purchases?payment_reference=eq.${encodeURIComponent(payment.reference)}`,
    env,
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ paystack_subscription_code: subscriptionCode })
    }
  );
  await syncMemberAppMembership(env, subscriptionCode);
  return subscriptionCode;
}
__name(syncMembershipFromVerifiedPayment, "syncMembershipFromVerifiedPayment");
async function syncMemberApp(env, payload) {
  if (!env.FTRIVA_APP_SYNC_TOKEN) return { skipped: true };
  const response = await fetch("https://pudyyizfklajwhvsnduz.supabase.co/functions/v1/ftriva-purchase-sync", {
    method: "POST",
    headers: { "content-type": "application/json", "x-ftriva-sync-token": env.FTRIVA_APP_SYNC_TOKEN },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("FTRIVA member app sync failed (" + response.status + "): " + (await response.text()).slice(0, 300));
  return response.json();
}
async function syncMemberAppMembership(env, subscriptionCode) {
  if (!subscriptionCode || !env.FTRIVA_APP_SYNC_TOKEN) return null;
  const path = "/rest/v1/ftriva_memberships?paystack_subscription_code=eq." + encodeURIComponent(subscriptionCode) + "&select=customer_email,package_id,paystack_subscription_code,status,start_date,next_payment_date&limit=1";
  const rows = await supabaseRequest(path, env);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  const rawStatus = safeText(row.status, 40).toLowerCase();
  const status = rawStatus === "cancelled" ? "cancelled" : rawStatus === "attention" || rawStatus === "past_due" ? "past_due" : rawStatus === "pending" ? "pending" : rawStatus === "completed" ? "expired" : "active";
  return syncMemberApp(env, { kind: "membership", email: safeText(row.customer_email, 254).toLowerCase(), subscriptionReference: safeText(row.paystack_subscription_code, 160), tier: safeText(row.package_id, 30).toUpperCase(), status, currentPeriodStart: row.start_date, currentPeriodEnd: row.next_payment_date, cancelAtPeriodEnd: rawStatus === "non_renewing" });
}
async function savePurchase(payment, packageId, env) {
  const packageInfo = PACKAGES[packageId];
  const customerEmail = safeText(payment.customer?.email, 254).toLowerCase();
  const record = {
    payment_reference: payment.reference,
    customer_email: customerEmail,
    customer_name: safeText(payment.metadata?.customer_name, 120),
    phone: safeText(payment.metadata?.phone, 40),
    package_id: packageId,
    package_name: packageInfo.name,
    amount: Number(payment.amount),
    currency: payment.currency || "ZAR",
    payment_status: "success",
    paystack_customer_code: safeText(payment.customer?.customer_code, 120) || null,
    paystack_authorization_code: safeText(payment.authorization?.authorization_code, 160) || null,
    channel: safeText(payment.channel, 60) || null,
    paid_at: payment.paid_at || payment.paidAt || (/* @__PURE__ */ new Date()).toISOString(),
    raw_paystack_data: payment
  };
  await supabaseRequest(
    `/rest/v1/ftriva_purchases?on_conflict=payment_reference`,
    env,
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(record)
    }
  );
  await syncMemberApp(env, { kind: "purchase", reference: safeText(payment.reference, 160), email: customerEmail, packageCode: packageId, amountMinor: Number(payment.amount), currency: payment.currency || "ZAR", paidAt: payment.paid_at || payment.paidAt || null, channel: safeText(payment.channel, 40) });
}
__name(savePurchase, "savePurchase");
async function savePaidAssessment(payment, packageId, assessment, env, assessmentValidation) {
  const assessmentEmail = safeText(assessment?.personal?.email, 254).toLowerCase();
  const paymentEmail = safeText(payment.customer?.email, 254).toLowerCase();
  if (!validEmail(assessmentEmail)) {
    throw new Error("A valid email address is required in the assessment.");
  }
  if (paymentEmail && assessmentEmail !== paymentEmail) {
    throw new Error("The assessment email must match the email address used for the verified Paystack payment.");
  }
  const customerEmail = paymentEmail || assessmentEmail;
  const record = {
    payment_reference: payment.reference,
    package_type: packageId,
    customer_email: customerEmail,
    assessment_data: assessment,
    requested_start_date: safeText(assessment.startDate, 40) || null,
    status: assessmentValidation?.requiresManualReview ? "under_review" : "assessment_submitted",
    submitted_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  await supabaseRequest(
    `/rest/v1/ftriva_assessments?on_conflict=payment_reference`,
    env,
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(record)
    }
  );
}
__name(savePaidAssessment, "savePaidAssessment");
async function submitFounding10Assessment(claimToken, assessment, env) {
  const token = safeText(claimToken, 200);
  if (!token) throw new Error("Your Founding 10 claim token is missing.");
  const tokenHash = await sha256(token);
  const result = await supabaseRequest("/rest/v1/rpc/submit_ftriva_founding10_assessment", env, {
    method: "POST",
    body: JSON.stringify({
      p_claim_token_hash: tokenHash,
      p_assessment: assessment
    })
  });
  if (!result?.submitted) {
    const error = new Error("This Founding 10 claim is invalid, expired or has already been submitted.");
    error.status = 409;
    throw error;
  }
}
__name(submitFounding10Assessment, "submitFounding10Assessment");
async function handlePaymentInitialize(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Please submit valid checkout details." }, 400);
  }
  const packageId = safeText(body.package, 30).toUpperCase();
  const packageInfo = PACKAGES[packageId];
  const email = safeText(body.email, 254).toLowerCase();
  const fullName = safeText(body.fullName, 120);
  const phone = safeText(body.phone, 40);
  if (!packageInfo || !validEmail(email) || !fullName || !phone) {
    return json({ error: "Please provide your name, valid email, phone number and a FTRIVA package." }, 400);
  }
  if (!env.PAYSTACK_SECRET_KEY) {
    return json({ error: "Payment setup is incomplete. PAYSTACK_SECRET_KEY is missing from Worker Secrets." }, 503);
  }
  const callbackUrl = `${new URL(request.url).origin}/payment-callback.html`;
  const payload = {
    email,
    currency: "ZAR",
    callback_url: callbackUrl,
    metadata: {
      custom_fields: [
        { display_name: "Customer name", variable_name: "customer_name", value: fullName },
        { display_name: "Phone", variable_name: "phone", value: phone },
        { display_name:"FTRIVA package", variable_name: "ftriva_package", value: packageId }
      ],
      ftriva_package: packageId,
      customer_name: fullName,
      phone,
      environment: env.ENVIRONMENT || "test"
    }
  };
  if (packageInfo.type === "monthly") {
    const planCode = safeText(env[packageInfo.planEnv], 160);
    if (!planCode) {
      return json({
        error: `${packageInfo.name} membership checkout is not configured. Add its Paystack plan code as ${packageInfo.planEnv}. No payment has been taken.`
      }, 503);
    }
    payload.plan = planCode;
  } else {
    payload.amount = packageInfo.amount;
  }
  try {
    const result = await paystackRequest("/transaction/initialize", env.PAYSTACK_SECRET_KEY, payload);
    return json({ authorizationUrl: result.authorization_url, reference: result.reference, package: packageId });
  } catch (error) {
    return json({ error: error.message || "Unable to start Paystack checkout." }, 502);
  }
}
__name(handlePaymentInitialize, "handlePaymentInitialize");
function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\\+/g, "-").replace(/\\/ / g, "_");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
__name(base64UrlDecode, "base64UrlDecode");
async function digitalTokenKey(env) {
  const { key } = getSupabaseConfig(env);
  const material = new TextEncoder().encode(`FTRIVA:DIGITAL:DOWNLOAD:v1:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
__name(digitalTokenKey, "digitalTokenKey");
async function createDigitalDownloadLinks(reference, requestUrl, env) {
  const payload = {
    r: safeText(reference, 120),
    exp: Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60,
    v: 1
  };
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await digitalTokenKey(env), new TextEncoder().encode(encodedPayload));
  const token = `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
  const origin = new URL(requestUrl).origin;
  const makeUrl = /* @__PURE__ */ __name((file) => {
    const url = new URL("/api/digital/download", origin);
    url.searchParams.set("file", file);
    url.searchParams.set("token", token);
    return url.toString();
  }, "makeUrl");
  return {
    toolkit: makeUrl("toolkit"),
    tracker: makeUrl("tracker"),
    expiresAt: new Date(payload.exp * 1e3).toISOString()
  };
}
__name(createDigitalDownloadLinks, "createDigitalDownloadLinks");
async function verifyDigitalDownloadToken(token, env) {
  if (!token || token.length > 4e3) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payloadBytes = base64UrlDecode(parts[0]);
    const signature = base64UrlDecode(parts[1]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      await digitalTokenKey(env),
      signature,
      new TextEncoder().encode(parts[0])
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (payload?.v !== 1 || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1e3)) return null;
    if (!safeText(payload.r, 120)) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyDigitalDownloadToken, "verifyDigitalDownloadToken");
async function handleDigitalDownload(request, env) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file");
  const token = safeText(url.searchParams.get("token"), 4e3);
  const files = {
    toolkit: {
      name: "FTRIVA_DIGITAL_Training_Toolkit.pdf",
      type: "application/pdf"
    },
    tracker: {
      name: "FTRIVA_DIGITAL_Workout_Tracker.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  };
  if (!files[file]) return json({ error: "This digital download is not available." }, 404);
  const claims = await verifyDigitalDownloadToken(token, env);
  if (!claims) return json({ error: "This download link is invalid or has expired. Return to your payment confirmation or contact FTRIVA." }, 401);
  try {
    const reference = encodeURIComponent(claims.r);
    const purchases = await supabaseRequest(
      `/rest/v1/ftriva_purchases?select=payment_reference&payment_reference=eq.${reference}&package_id=eq.DIGITAL&payment_status=eq.success&amount=eq.4900&currency=eq.ZAR&limit=1`,
      env
    );
    if (!Array.isArray(purchases) || purchases.length !== 1) {
      return json({ error: "We could not confirm an active DIGITAL purchase for this link. PPlease contact FTRIVA." }, 403);
    }
    const { url: supabaseUrl, key } = getSupabaseConfig(env);
    const headers = new Headers({ apikey: key });
    if (!key.startsWith("sb_secret_")) headers.set("authorization", `Bearer ${key}`);
    const objectUrl = `${supabaseUrl}/storage/v1/object/authenticated/ftriva-digital-test/${encodeURIComponent(files[file].name)}`;
    const storedFile = await fetch(objectUrl, { headers });
    if (!storedFile.ok) {
      console.error("FTRIVA digital asset unavailable:", storedFile.status);
      return json({ error: "Your payment is verified, but this file is temporarily unavailable. Please contact FTRIVA; do not pay again." }, 503);
    }
    return new Response(storedFile.body, {
      status: 200,
      headers: {
        "content-type": files[file].type,
        "content-disposition": `attachment; filename="${files[file].name}"`,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox"
      }
    });
  } catch (error) {
    console.error("FTRIVA digital download failed:", error?.message || "Unknown error");
    return json({ error: "Your download could not be prepared. Please contact FTRIVA; do not pay again." }, 503);
  }
}
__name(handleDigitalDownload, "handleDigitalDownload");
async function handlePaymentVerify(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid payment verification request." }, 400);
  }
  const reference = safeText(body.reference, 120);
  if (!reference) return json({ error: "The Paystack transaction reference is required." }, 400);
  try {
    const payment = await verifyPaystack(reference, env);
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    verifyAmountAndCurrency(payment, packageId, packageInfo);
    try {
      await savePurchase(payment, packageId, env);
    } catch (error) {
      return json({
        verified: true,
        recorded: false,
        reference: payment.reference,
        package: packageId,
        error: `Your payment is verified, but the purchase record could not be saved. Do not pay again. Contact FTRIVA. ${error.message}`
      }, 503);
    }
    let verifiedMembershipCode = null;
    if (packageInfo.type === "monthly") {
      try {
        verifiedMembershipCode = await syncMembershipFromVerifiedPayment(payment, packageId, env);
      } catch (error) {
        return json({
          verified: true,
          recorded: true,
          membershipRecorded: false,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          package: packageId,
          error: "Your payment and purchase are recorded, but membership activation is still being reconciled. Do not pay again. FTRIVA will contact you if anything further is needed."
        }, 202);
      }
    }
    let digitalDownloads;
    if (packageId === "DIGITAL") {
      try {
        digitalDownloads = await createDigitalDownloadLinks(payment.reference, request.url, env);
      } catch (error) {
        console.error("FTRIVA digital link creation failed:", error?.message || "Unknown error");
        return json({
          verified: true,
          recorded: true,
          digitalDeliveryReady: false,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          package: packageId,
          error: "Your payment is verified and recorded, but download links could not be prepared. Do not pay again; contact FTRIVA."
        }, 202);
      }
    }
    await sendFtrivaPurchaseEmails(env, payment, packageId, packageInfo, verifiedMembershipCode);
    return json({
      verified: true,
      recorded: true,
      ...packageInfo.type === "monthly" ? { membershipRecorded: true } : {},
      ...packageId === "DIGITAL" ? { digitalDeliveryReady: true, digitalDownloads } : {},
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      package: packageId
    });
  } catch (error) {
    return json({ verified: false, error: error.message || "Payment verification failed." }, error.status || 400);
  }
}
__name(handlePaymentVerify, "handlePaymentVerify");
async function handlePaymentRecover(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ verified: false, error: "Invalid payment recovery request." }, 400);
  }
  const reference = safeText(body.reference, 120);
  if (!reference) return json({ verified: false, error: "The original Paystack transaction reference is required." }, 400);
  try {
    const payment = await verifyPaystack(reference, env);
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    verifyAmountAndCurrency(payment, packageId, packageInfo);
    return json({ verified: true, reference: payment.reference, package: packageId, amount: payment.amount, currency: payment.currency });
  } catch (error) {
    return json({ verified: false, error: error.message || "Payment recovery failed." }, error.status || 400);
  }
}
__name(handlePaymentRecover, "handlePaymentRecover");
async function handleFounding10Claim(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid Founding 10 claim details." }, 400);
  }
  const packageId = safeText(body.package, 30).toUpperCase();
  const fullName = safeText(body.fullName, 120);
  const email = safeText(body.email, 254).toLowerCase();
  const phone = safeText(body.phone, 40);
  if (!FOUNDING10_PACKAGES.has(packageId) || !fullName || !validEmail(email) || !phone) {
    return json({ error: "Choose START, PROGRESS, PERFORMANCE or DIGITAL and provide valid contact details." }, 400);
  }
  try {
    const claimToken = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const tokenHash = await sha256(claimToken);
    const result = await supabaseRequest("/rest/v1/rpc/claim_ftriva_founding10", env, {
      method: "POST",
      body: JSON.stringify({
        p_full_name: fullName,
        p_email: email,
        p_phone: phone,
        p_package_id: packageId,
        p_claim_token_hash: tokenHash
      })
    });
    if (!result?.claimed) {
      if (result?.reason === "duplicate") {
        return json({ claimed: false, error: "This email address has already used a Founding 10 claim." }, 409);
      }
      if (result?.reason === "invalid_package") {
        return json({ claimed: false, error: "This package is not eligible for the Founding 10." }, 400);
      }
      if (result?.reason === "full") {
        return json({ claimed: false, error: "All 10 Founding 10 places have been claimed." }, 409);
      }
      return json({ claimed: false, error: "The Founding 10 claim details could not be accepted." }, 400);
    }
    await sendSignupNotification(env, "Founding 10 free-programme claim", await sha256(email + ":" + packageId));
    return json({
      claimed: true,
      claimToken,
      remaining: Math.max(0, 10 - Number(result.claimed_count || 0))
    });
  } catch (error) {
    return json({ error: `The Founding 10 claim system is not ready. ${error.message}` }, 503);
  }
}
__name(handleFounding10Claim, "handleFounding10Claim");
async function handleAssessmentSubmit(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid assessment submission." }, 400);
  }
  const assessment = body.assessment;
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) {
    return json({ error: "Assessment data is missing." }, 400);
  }
  let assessmentValidation;
  try {
    assessmentValidation = validateAssessmentPayload(assessment);
  } catch (error) {
    return json({ error: error.message || "The assessment is incomplete." }, 400);
  }
  if (body.claimToken) {
    try {
      await submitFounding10Assessment(body.claimToken, assessment, env);
      return json({ submitted: true, founding10: true, message: "Your Founding 10 assessment has been submitted." });
    } catch (error) {
      return json({ error: `Your assessment could not be saved. ${error.message}` }, error.status || 503);
    }
  }
  const reference = safeText(body.paymentReference, 120);
  if (!reference) return json({ error: "A verified payment reference or Founding 10 claim is required." }, 403);
  let paymentVerified = false;
  try {
    const payment = await verifyPaystack(reference, env);
    paymentVerified = true;
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    if (!packageInfo || !packageInfo.assessmentRequired) {
      return json({ error: "This purchase does not require a personalised fitness assessment." }, 403);
    }
    verifyAmountAndCurrency(payment, packageId, packageInfo);
    await savePurchase(payment, packageId, env);
    await savePaidAssessment(payment, packageId, assessment, env, assessmentValidation);
    return json({ submitted: true, message: "Your assessment has been submitted successfully." });
  } catch (error) {
    return json({
      error: paymentVerified ? "Your payment is verified, but the assessment could not be saved. Do not pay again; contact FTRIVA." : "We could not verify this payment, so the assessment was not submitted.",
      detail: error.message,
      paymentVerified
    }, error.status || (paymentVerified ? 503 : 400));
  }
}
__name(handleAssessmentSubmit, "handleAssessmentSubmit");
async function hmacSha512Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hmacSha512Hex, "hmacSha512Hex");
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
function membershipPackageForPlan(planCode, env) {
  for (const id of ["ESSENTIAL", "PLUS", "ELITE"]) {
    if (safeText(env[PACKAGES[id].planEnv], 160) === planCode) return id;
  }
  return null;
}
__name(membershipPackageForPlan, "membershipPackageForPlan");
async function handlePaystackWebhook(request, env) {
  if (!env.PAYSTACK_SECRET_KEY) return json({ error: "Webhook secret is not configured." }, 503);
  const rawBody = await request.text();
  const suppliedSignature = request.headers.get("x-paystack-signature") || "";
  const expectedSignature = await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, rawBody);
  if (!constantTimeEqual(suppliedSignature.toLowerCase(), expectedSignature)) {
    return json({ error: "Invalid Paystack webhook signature." }, 401);
  }
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }
  const eventType = safeText(event.event, 100) || "unknown";
  const data = event.data || {};
  const eventKey = await sha256(rawBody);
  const subscriptionCode = safeText(data.subscription_code || data.subscription?.subscription_code, 160);
  const eventRows = await supabaseRequest("/rest/v1/ftriva_paystack_events?on_conflict=event_key", env, {
    method: "POST",
    headers: { prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      event_key: eventKey,
      event_type: eventType,
      payment_reference: safeText(data.reference, 160) || null,
      payload: event,
      processing_status: "received"
    })
  });
  const isNewEvent = Array.isArray(eventRows) && eventRows.length === 1;
  try {
    if (eventType === "charge.success") {
      const reference = safeText(data.reference, 160);
      if (reference) {
        const payment = await verifyPaystack(reference, env);
        const { packageId, packageInfo } = getPackageFromPayment(payment);
        if (packageInfo) {
          verifyAmountAndCurrency(payment, packageId, packageInfo);
          await savePurchase(payment, packageId, env);
          let membershipCode = null;
          if (packageInfo.type === "monthly") membershipCode = await syncMembershipFromVerifiedPayment(payment, packageId, env);
          await sendFtrivaPurchaseEmails(env, payment, packageId, packageInfo, membershipCode);
        }
      }
    } else if (eventType === "subscription.create") {
      const planCode = safeText(data.plan?.plan_code || data.plan_code, 160);
      const packageId = membershipPackageForPlan(planCode, env);
      const email = safeText(data.customer?.email || data.email, 254).toLowerCase();
      if (packageId && validEmail(email) && subscriptionCode) {
        const packageInfo = PACKAGES[packageId];
        await supabaseRequest("/rest/v1/ftriva_memberships?on_conflict=paystack_subscription_code", env, {
          method: "POST",
          headers: { prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({
            customer_email: email,
            package_id: packageId,
            paystack_customer_code: safeText(data.customer?.customer_code, 160) || null,
            paystack_subscription_code: subscriptionCode,
            paystack_email_token: safeText(data.email_token, 300) || null,
            paystack_plan_code: planCode,
            amount: Number(data.amount || data.plan?.amount || packageInfo.amount),
            currency: "ZAR",
            status: "pending",
            start_date: data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
            next_payment_date: data.next_payment_date || null,
            raw_paystack_data: data
          })
        });
      }
    } else if (["subscription.disable", "subscription.not_renew", "invoice.payment_failed"].includes(eventType) && subscriptionCode) {
      const nextStatus = eventType === "subscription.disable" ? "cancelled" : eventType === "subscription.not_renew" ? "non_renewing" : "attention";
      await supabaseRequest(
        `/rest/v1/ftriva_memberships?paystack_subscription_code=eq.${encodeURIComponent(subscriptionCode)}`,
        env,
        {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify({ status: nextStatus, raw_paystack_data: data, ...nextStatus === "cancelled" ? { cancelled_at: (/* @__PURE__ */ new Date()).toISOString() } : {} })
        }
      );
      await syncMemberAppMembership(env, subscriptionCode);
    }
    await supabaseRequest(`/rest/v1/ftriva_paystack_events?event_key=eq.${eventKey}`, env, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ processing_status: "processed", processed_at: (/* @__PURE__ */ new Date()).toISOString() })
    });
    return json({ received: true });
  } catch (error) {
    if (subscriptionCode) await syncMemberAppMembership(env, subscriptionCode);
    await supabaseRequest(`/rest/v1/ftriva_paystack_events?event_key=eq.${eventKey}`, env, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ processing_status: "failed", processing_error: error.message })
    }).catch(() => {
    });
    return json({ received: false, error: "Webhook could not be processed." }, 500);
  }
}
__name(handlePaystackWebhook, "handlePaystackWebhook");
async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method === "POST" && url.pathname === "/api/paystack/webhook") return handlePaystackWebhook(request, env);
  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({
      ok: true,
      service: "FTRIVA Worker",
      environment: env.ENVIRONMENT || "test",
      supabaseConfigured: Boolean(env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)),
      paystackConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  if (request.method === "GET" && url.pathname === "/api/digital/download") return handleDigitalDownload(request, env);
  if (request.method === "POST" && url.pathname === "/api/payment/initialize") return handlePaymentInitialize(request, env);
  if (request.method === "POST" && url.pathname === "/api/payment/verify") return handlePaymentVerify(request, env);
  if (request.method === "POST" && url.pathname === "/api/payment/recover") return handlePaymentRecover(request, env);
  if (request.method === "POST" && url.pathname === "/api/founding10/claim") return handleFounding10Claim(request, env);
  if (request.method === "POST" && url.pathname === "/api/assessment/submit") return handleAssessmentSubmit(request, env);
  return json({ error: "API route not found." }, 404);
}
__name(handleApi, "handleApi");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/app.js") { return new Response(FTRIVA_APP_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }
    if (request.method === "GET" && url.pathname === "/my-account") {
      const appUrl = safeText(env.FTRIVA_APP_URL, 500) || ((env.ENVIRONMENT || "test").toLowerCase() === "test" ? "https://app-test.ftriva.com" : "");
      if (appUrl) {
        try {
          const destination = new URL(appUrl);
          if (destination.protocol === "https:") {
            return Response.redirect(destination.toString(), 302);
          }
        } catch {
        }
      }
      return new Response(
        "<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>FTRIVA Account</title><body style='margin:0;background:#101d2b;color:#f5f1e8;font:16px Arial,sans-serif;display:grid;min-height:100vh;place-items:center;text-align:center'><main style='max-width:520px;padding:32px'><h1 style='letter-spacing:.12em'>FTRIVA</h1><h2>Your account portal is being prepared.</h2><p>Once your FTRIVA web app is ready, you will be able to sign in here using the email address from your purchase.</p><a style='color:#a8b8a0' href='/'>Return to FTRIVA</a></main></body></html>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
      );
    }
    if (url.pathname.startsWith("/api/")) {
      try {
        const response = await handleApi(request, env);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        const response = json({ error: error.message || "Unexpected server error." }, 500);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
        return new Response(response.body, { status: response.status, headers });
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("FTRIVA assets binding is missing. Check wrangler.jsonc.", { status: 500 });
  }
};
export {
  index_default as default
};
