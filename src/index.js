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
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(row.id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({atte

--- TRUNCATED ---
Response was ~17,425 tokens (limit: 6,000). Use more specific queries to reduce response size.