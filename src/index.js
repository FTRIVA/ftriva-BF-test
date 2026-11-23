var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var FTRIVA_APP_JS = "const $ = (s, root=document) => root.querySelector(s);\nconst $$ = (s, root=document) => [...root.querySelectorAll(s)];\nconst menu = $('.menu-toggle');\nif (menu) menu.addEventListener('click', () => $('.nav-links')?.classList.toggle('open'));\nconst current = location.pathname.split('/').pop() || 'index.html';\n$$('.nav-links a').forEach(a => { if (a.getAttribute('href') === current) a.classList.add('active'); });\nconst PACKAGE_INFO = {\n START:{name:'START',price:'R199',regular:'R299',type:'once_off'},\n PROGRESS:{name:'PROGRESS',price:'R399',regular:'R549',type:'once_off'},\n PERFORMANCE:{name:'PERFORMANCE',price:'R299',regular:'R399',type:'once_off'},\n DIGITAL:{name:'DIGITAL',price:'R49',regular:'R149',type:'once_off'},\n ESSENTIAL:{name:'ESSENTIAL',price:'R249 / month',type:'monthly'},\n PLUS:{name:'PLUS',price:'R399 / month',type:'monthly'},\n ELITE:{name:'ELITE',price:'R599 / month',type:'monthly'}\n};\nfunction escapeHtml(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));}\n\nconst quizForm = $('#recommendation-form');\nif (quizForm) quizForm.addEventListener('submit', e => {\n e.preventDefault(); const data=new FormData(quizForm); const goal=data.get('goal'); const experience=String(data.get('experience')||'').trim().toLowerCase(); const ongoing=data.get('coaching')==='ongoing';\n let id=ongoing?'PLUS':goal==='performance'?'PERFORMANCE':experience==='beginner'||experience.includes('returning')?'START':'PROGRESS';\n const p=PACKAGE_INFO[id], result=$('#recommendation-result'); result.classList.remove('hidden');\n result.innerHTML=`<span class=\"recommend-label\">Suggested for you</span><h3>${p.name} — ${p.price}</h3><p>Based on your answers, ${p.name} may be a useful starting point. This is a recommendation, not a restriction — you can choose any package.</p><a class=\"btn btn-bronze\" href=\"start-assessment.html?package=${id}\">Choose ${id}</a><div class=\"recommendation-package-list\"><a href=\"programmes.html#packages\">Compare all seven packages</a></div>`;\n result.scrollIntoView({behavior:'smooth',block:'center'});\n});\n\nconst checkoutForm=$('#checkout-form');\nif(checkoutForm){\n const id=new URLSearchParams(location.search).get('package')?.toUpperCase(); const p=PACKAGE_INFO[id]; const field=$('#package');\n if(!p){$('#selected-package-name').textContent='No package selected';$('#selected-package-price').textContent='Please return to the packages page and choose one.';checkoutForm.classList.add('hidden');}\n else {field.value=id;$('#selected-package-name').textContent=p.name;$('#selected-package-price').textContent=p.price+(p.regular?` · Black Friday (regular price R${p.regular.replace('R','')})`:'');}\n checkoutForm.addEventListener('submit',async e=>{e.preventDefault();const button=$('button[type=\"submit\"]',checkoutForm),message=$('#checkout-message');message.className='';message.textContent='';button.disabled=true;button.textContent='Connecting to secure checkout…';\n try{const payload=Object.fromEntries(new FormData(checkoutForm).entries());const response=await fetch('/api/payment/initialize',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to start checkout.');location.href=result.authorizationUrl;}\n catch(err){message.className='error';message.textContent=err.message;button.disabled=false;button.textContent='Continue to secure Paystack checkout';}\n });\n}\n\nconst foundingForm=$('#founding10-form');\nif(foundingForm) foundingForm.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type=\"submit\"]',foundingForm),msg=$('#founding10-message');msg.className='';msg.textContent='';btn.disabled=true;btn.textContent='Checking availability…';\n try{const payload=Object.fromEntries(new FormData(foundingForm).entries());const response=await fetch('/api/founding10/claim',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok||!result.claimed)throw new Error(result.error||'A Founding 10 place could not be confirmed.');if(payload.package==='DIGITAL'){foundingForm.reset();msg.className='success';msg.textContent='Your Founding 10 DIGITAL claim is confirmed. No payment or fitness assessment is required. FTRIVA will contact you at the email address provided to arrange delivery.';btn.textContent='Claim confirmed';return;}sessionStorage.setItem('ftriva_founding10_claim',result.claimToken);location.href=`assessment.html?founding10=1&package=${encodeURIComponent(payload.package)}`;}\n catch(err){msg.className='error';msg.textContent=err.message;btn.disabled=false;btn.textContent='Claim my free programme';}\n});\n\nconst callbackMessage=$('#callback-message');\nif(callbackMessage){const params=new URLSearchParams(location.search),reference=params.get('reference')||params.get('trxref');if(!reference)callbackMessage.innerHTML='<div class=\"error\">No payment reference was found. Please contact FTRIVA before trying again.</div>';else{(async()=>{callbackMessage.innerHTML='<p>Verifying your payment securely…</p>';try{const response=await fetch('/api/payment/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference})});const result=await response.json();if(result.verified&&!result.recorded){callbackMessage.innerHTML=`<div class=\"error\"><strong>Your payment is verified, but the purchase record needs attention.</strong><p>${escapeHtml(result.error||'Do not pay again. Please contact FTRIVA so the verified payment can be reconciled.')}</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;return;}if(!response.ok||!result.verified)throw new Error(result.error||'Payment could not be verified.');sessionStorage.setItem('ftriva_verified_reference',result.reference);sessionStorage.setItem('ftriva_verified_package',result.package);if(result.package==='DIGITAL'){if(!result.digitalDeliveryReady){callbackMessage.innerHTML='<div class=\"success\"><strong>Payment verified.</strong><p>Your DIGITAL purchase is recorded, but app access is still being synchronised. Do not pay again. Please contact FTRIVA if it is not visible shortly.</p><a class=\"btn btn-dark\" href=\"/my-account\">Open FTRIVA app</a><p><a href=\"/payment-callback.html?reference=${encodeURIComponent(reference)}\">Retry secure access synchronisation</a></p></div>';}else{callbackMessage.innerHTML='<div class=\"success\"><strong>Payment verified.</strong><p>Your DIGITAL purchase is confirmed. Your Training Toolkit and Workout Tracker are available in the Downloads section of the FTRIVA app. Sign in with the same email address used at checkout.</p><p><a class=\"btn btn-dark\" href=\"/my-account\">Open FTRIVA app</a></p><p>To install: on iPhone/iPad, open the app in Safari, tap Share, then Add to Home Screen. On Android, use Chrome’s menu and choose Install app or Add to Home screen.</p></div>';}}else if(['ESSENTIAL','PLUS','ELITE'].includes(result.package)){if(result.membershipRecorded){callbackMessage.innerHTML=`<div class=\"success\"><strong>Your membership is active.</strong><p>Your ${escapeHtml(result.package)} membership payment is verified and your app access has been synchronised. Sign in with the same email address used at checkout.</p><a class=\"btn btn-dark\" href=\"/my-account\">Open FTRIVA app</a></div>`;}else{callbackMessage.innerHTML=`<div class=\"error\"><strong>Your payment is verified.</strong><p>Your ${escapeHtml(result.package)} membership is still being activated. Do not pay again. Please contact FTRIVA if you do not receive confirmation.</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;}}else{callbackMessage.innerHTML=`<div class=\"success\"><strong>Payment verified.</strong><p>Your ${escapeHtml(result.package)} purchase has been recorded. You can now complete your detailed fitness assessment.</p><a class=\"btn btn-dark\" href=\"assessment.html?reference=${encodeURIComponent(result.reference)}&package=${encodeURIComponent(result.package)}\">Continue to fitness assessment</a></div>`;}}\n catch(err){callbackMessage.innerHTML=`<div class=\"error\"><strong>Payment not verified.</strong><p>${escapeHtml(err.message)}</p><p>If money was deducted, do not pay again until the transaction has been checked.</p><a href=\"mailto:ftrivafitness@gmail.com\">Contact FTRIVA</a></div>`;}})();}}\n\nconst assessmentForm=$('#assessment-form');\nif(assessmentForm){\n const params=new URLSearchParams(location.search),claimToken=params.get('claim')||sessionStorage.getItem('ftriva_founding10_claim')||'';\n let reference=params.get('reference')||params.get('trxref')||sessionStorage.getItem('ftriva_verified_reference')||'';\n let verifiedPackage=params.get('package')||sessionStorage.getItem('ftriva_verified_package')||'Selected FTRIVA package';\n const claimField=$('#founding-claim-token'),locked=$('#assessment-locked'),paymentField=$('#payment-reference'),packageLabel=$('#assessment-package');\n const showAssessment=()=>{locked?.classList.add('hidden');assessmentForm.classList.remove('hidden');};\n const lockAssessment=message=>{assessmentForm.classList.add('hidden');locked?.classList.remove('hidden');const status=$('#assessment-message');if(message&&status){status.className='';status.textContent=message;}};\n if(claimToken){if(claimField)claimField.value=claimToken;showAssessment();if(packageLabel)packageLabel.textContent='FOUNDING 10 — '+(params.get('package')||'Free personalised programme');}\n else if(reference){\n  lockAssessment('Verifying your existing payment securely with Paystack…');\n  (async()=>{try{const response=await fetch('/api/payment/recover',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference})});const result=await response.json();if(!response.ok||!result.verified)throw new Error(result.error||'Payment could not be verified.');reference=result.reference;verifiedPackage=result.package;if(paymentField)paymentField.value=reference;if(packageLabel)packageLabel.textContent=verifiedPackage;sessionStorage.setItem('ftriva_verified_reference',reference);sessionStorage.setItem('ftriva_verified_package',verifiedPackage);showAssessment();}catch(err){lockAssessment('We could not restore access to this assessment. If you have already paid, do not pay again. Contact FTRIVA with your Paystack transaction reference. '+err.message);}})();\n }else{lockAssessment();}\n $$('[data-conditional]').forEach(el=>{const source=el.dataset.conditional;const update=()=>{const target=document.getElementById(el.dataset.target);if(target)target.classList.toggle('hidden',!el.checked);};$$(`[name=\"${source}\"]`).forEach(input=>input.addEventListener('change',update));update();});\n assessmentForm.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type=\"submit\"]',assessmentForm),msg=$('#assessment-message');const under18=$('[name=\"under18\"]',assessmentForm)?.value==='yes';if(under18){const guardianName=$('[name=\"guardianName\"]',assessmentForm)?.value.trim();const guardianEmail=$('[name=\"guardianEmail\"]',assessmentForm)?.value.trim();const guardianConsent=$('[name=\"guardianConsent\"]',assessmentForm)?.checked;if(!guardianName||!guardianEmail||!guardianConsent){msg.className='error';msg.textContent='Because the client is under 18, please provide the parent/guardian name and email address and confirm that parent/guardian consent has been obtained.';return;}}btn.disabled=true;btn.textContent='Submitting securely…';msg.className='';msg.textContent='';const fd=new FormData(assessmentForm),data={};for(const [key,value] of fd.entries()){if(['paymentReference','foundingClaimToken'].includes(key))continue;if(key.endsWith('[]')){const k=key.slice(0,-2);(data[k]||=[]).push(value);}else if(data[key]!==undefined)data[key]=Array.isArray(data[key])?[...data[key],value]:[data[key],value];else data[key]=value;}\n const assessment={personal:{fullName:data.fullName,email:data.email,phone:data.phone,dateOfBirth:data.dateOfBirth,under18:data.under18,country:data.country,communication:data.communication,guardianName:data.guardianName,guardianEmail:data.guardianEmail,guardianConsent:data.guardianConsent==='yes'},goals:{primary:data.primaryGoal,secondary:data.secondaryGoal,target:data.target,motivation:data.motivation},trainingHistory:{structured:data.structuredTraining,experience:data.experience,trainingTypes:data.trainingTypes,lastConsistent:data.lastConsistent},currentActivity:{activityLevel:data.activityLevel,daysPerWeek:data.daysPerWeek,activities:data.activities,fitnessLevel:data.fitnessLevel,height:data.height,weight:data.weight},health:{injuryOrPain:data.injuryOrPain,injuryDetails:data.injuryDetails,conditions:data.conditions,medication:data.medication,restrictions:data.restrictions,warningSymptoms:data.warningSymptoms,avoidMovements:data.avoidMovements},equipment:{environment:data.environment,equipment:data.equipment,access:data.access,limitations:data.limitations},schedule:{sessions:data.sessions,duration:data.duration,days:data.days,sport:data.sport,restPreference:data.restPreference},preferences:{styles:data.styles,favouriteExercises:data.favouriteExercises,dislikedExercises:data.dislikedExercises,sessionStyle:data.sessionStyle},startDate:data.startDate==='specific_date'?data.desiredStartDate:data.startDate,startDatePreference:data.startDate,additionalComments:data.additionalComments,consents:{accurate:data.consentAccurate,privacy:data.consentPrivacy,onlineScope:data.consentScope,guardian:data.guardianConsent}};\n try{const payload=claimToken?{claimToken,assessment}:{paymentReference:reference,assessment};const response=await fetch('/api/assessment/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error+(result.detail?` ${result.detail}`:''));msg.className='success';msg.textContent='Thank you. Your assessment has been submitted successfully. FTRIVA will review your information and prepare your programme.';assessmentForm.reset();sessionStorage.removeItem('ftriva_verified_reference');sessionStorage.removeItem('ftriva_verified_package');sessionStorage.removeItem('ftriva_founding10_claim');}\n catch(err){msg.className='error';msg.textContent=err.message;}btn.disabled=false;btn.textContent='Submit my assessment';});\n}\n";
var FTRIVA_CSS = ":root{--navy:#101d2b;--navy2:#182a3b;--sage:#91a994;--sage-dark:#627c69;--white:#fff;--ivory:#f5f2ea;--bronze:#b58a55;--ink:#18232d;--muted:#64717c;--line:#dfe5e1;--radius:18px;--shadow:0 18px 50px rgba(16,29,43,.10)}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,Arial,sans-serif;color:var(--ink);background:var(--white);line-height:1.65}a{color:inherit;text-decoration:none}button,input,select,textarea{font:inherit}.container{width:min(1140px,calc(100% - 40px));margin:auto}.site-header{background:var(--navy);color:var(--white);position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,.1)}.nav-wrap{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font-family:Syne,Arial,sans-serif;font-weight:800;letter-spacing:.13em;font-size:1.42rem}.brand span{color:var(--sage)}.nav-links{display:flex;align-items:center;gap:24px;font-size:.9rem;color:#e7ece9}.nav-links a:hover,.nav-links a.active{color:var(--sage)}.nav-cta{background:var(--sage);color:var(--navy)!important;padding:11px 17px;border-radius:8px;font-weight:800}.menu-toggle{display:none;background:transparent;color:white;border:1px solid #ffffff55;border-radius:8px;padding:8px 12px}.hero{background:var(--navy);color:var(--white);padding:100px 0 94px;position:relative;overflow:hidden}.hero:after{content:\"\";position:absolute;width:430px;height:430px;border:1px solid rgba(145,169,148,.22);border-radius:50%;right:-160px;top:-190px}.eyebrow{color:var(--sage);font-size:.76rem;letter-spacing:.19em;text-transform:uppercase;font-weight:800}.hero h1,.page-hero h1{font-family:Syne,Arial,sans-serif;font-size:clamp(2.65rem,6vw,5.1rem);line-height:1.04;letter-spacing:-.045em;max-width:800px;margin:18px 0}.hero h1 em{font-style:normal;color:var(--sage)}.hero p{max-width:610px;color:#d6dfdb;font-size:1.08rem}.actions{display:flex;flex-wrap:wrap;gap:13px;margin-top:30px}.btn{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:9px;padding:14px 21px;font-weight:800;cursor:pointer;transition:.2s}.btn:hover{transform:translateY(-2px)}.btn-primary{background:var(--sage);color:var(--navy)}.btn-secondary{border:1px solid rgba(255,255,255,.45);color:white;background:transparent}.btn-dark{background:var(--navy);color:white}.btn-bronze{background:var(--bronze);color:var(--navy)}.section{padding:82px 0}.section-sage{background:#eaf0eb}.section-ivory{background:var(--ivory)}.section-navy{background:var(--navy);color:white}.section-head{max-width:690px;margin-bottom:36px}.section-head h2,.content h2{font-family:Syne,Arial,sans-serif;font-size:clamp(2rem,4vw,3.1rem);line-height:1.12;margin:10px 0 15px;color:var(--navy)}.section-navy .section-head h2{color:white}.section-head p{color:var(--muted)}.section-navy .section-head p{color:#d5dfda}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.grid.two{grid-template-columns:repeat(2,1fr)}.card{background:white;border:1px solid var(--line);border-radius:var(--radius);padding:27px;box-shadow:var(--shadow)}.card h3{font-family:Syne,Arial,sans-serif;color:var(--navy);font-size:1.35rem;margin:8px 0}.card p{color:var(--muted)}.card-feature{border:2px solid var(--bronze);position:relative}.recommend-label{display:inline-block;background:var(--bronze);color:var(--navy);padding:5px 10px;border-radius:5px;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.price{font-family:Syne,Arial,sans-serif;color:var(--navy);font-size:2.4rem;font-weight:800;margin:15px 0}.price small{font:500 .85rem Inter,Arial;color:var(--muted)}.list{padding-left:19px;color:var(--muted)}.list li{margin:7px 0}.page-hero{background:var(--navy);color:white;padding:66px 0}.page-hero h1{font-size:clamp(2.4rem,5vw,4rem);margin:10px 0}.page-hero p{max-width:680px;color:#d9e1dc}.content{padding:62px 0}.content p,.content li{color:var(--muted)}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.step{border-top:3px solid var(--sage);padding:18px 12px 12px}.step b{color:var(--bronze);font-family:Syne,Arial,sans-serif;font-size:1.7rem}.step h3{font-family:Syne,Arial,sans-serif;color:var(--navy)}.site-footer{background:#0b1520;color:#dce4df;padding:48px 0 25px}.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:30px}.site-footer p,.site-footer a{color:#b9c6bf}.footer-bottom{border-top:1px solid #ffffff20;margin-top:30px;padding-top:18px;font-size:.82rem;color:#aab7b0}.form-shell{max-width:800px;margin:auto;background:white;border:1px solid var(--line);border-radius:var(--radius);padding:clamp(20px,4vw,38px);box-shadow:var(--shadow)}.form-shell h2{font-family:Syne,Arial,sans-serif;color:var(--navy)}.field{margin:17px 0}.field label{display:block;font-weight:750;color:var(--navy);margin-bottom:7px}.field input,.field select,.field textarea{width:100%;padding:13px 14px;border:1px solid #cbd5cf;border-radius:8px;background:#fff;color:var(--ink)}.field textarea{min-height:100px;resize:vertical}.field small{display:block;color:var(--muted);margin-top:5px}.choice-list{display:grid;gap:9px}.choice{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:9px}.choice input{margin-top:6px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.notice{background:#edf3ee;border-left:4px solid var(--sage-dark);padding:14px 17px;border-radius:7px;color:#34463a;margin:18px 0}.error{background:#fff0ed;border-left:4px solid #b84e3c;color:#762f24;padding:13px;border-radius:7px;margin:15px 0}.success{background:#edf6ef;border-left:4px solid #4e8a5b;color:#285c34;padding:13px;border-radius:7px;margin:15px 0}.progress{height:7px;background:#e7ece8;border-radius:10px;overflow:hidden;margin:20px 0}.progress span{display:block;height:100%;width:0;background:var(--sage-dark);transition:width .2s}.hidden{display:none!important}.muted{color:var(--muted)}.contact-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.tag{display:inline-block;padding:5px 9px;background:#edf2ed;color:var(--sage-dark);border-radius:5px;font-size:.76rem;font-weight:800}.faq details{padding:18px 0;border-bottom:1px solid var(--line)}.faq summary{font-weight:800;color:var(--navy);cursor:pointer}.center{text-align:center}.center .section-head{margin-left:auto;margin-right:auto}.tiny{font-size:.82rem}.legal{font-size:.9rem}.loading{opacity:.65;pointer-events:none}@media(max-width:850px){.nav-links{display:none;position:absolute;top:78px;left:0;right:0;background:var(--navy);padding:20px;flex-direction:column;align-items:stretch}.nav-links.open{display:flex}.menu-toggle{display:block}.grid{grid-template-columns:1fr 1fr}.steps{grid-template-columns:1fr 1fr}.footer-grid{grid-template-columns:1fr 1fr}}@media(max-width:580px){.container{width:min(100% - 28px,1140px)}.hero{padding:72px 0}.section{padding:60px 0}.grid,.grid.two,.steps,.form-row,.footer-grid{grid-template-columns:1fr}.nav-wrap{min-height:70px}.nav-links{top:70px}.hero h1{font-size:2.7rem}.card{padding:22px}}\n\n/* FTRIVA Black Friday package presentation */\n.bf-hero{position:relative;overflow:hidden}.bf-strip{display:inline-block;margin-top:22px;padding:10px 16px;background:#A6C6B5;color:#101C32;font-weight:800;letter-spacing:1.2px;border-radius:4px;font-size:.82rem}.founders-banner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px;border:1px solid #B58B59;border-radius:14px;background:#101C32;color:#fff;margin-bottom:46px}.founders-banner h2{color:#fff;margin:8px 0}.founders-banner p{color:#F2F0EA;max-width:680px;margin-bottom:0}.package-grid{align-items:stretch}.package-card{display:flex;flex-direction:column;align-items:flex-start}.package-card .btn{margin-top:auto}.package-sub{color:#A6C6B5;font-weight:700}.tag-sale{background:#B58B59;color:#101C32}.old-price{text-decoration:line-through;color:#8a8a8a;font-size:.78em;font-weight:500;margin-right:7px}.package-card .price strong{font-size:1.25em;color:inherit}.package-card .price{margin:12px 0}.package-card h3{margin-top:16px}@media(max-width:700px){.founders-banner{align-items:flex-start;flex-direction:column}.bf-strip{font-size:.68rem;line-height:1.5}}\n\n/* FTRIVA Black Friday package presentation */\n.bf-hero{position:relative;overflow:hidden}.bf-strip{display:inline-block;margin-top:22px;padding:10px 16px;background:#A6C6B5;color:#101C32;font-weight:800;letter-spacing:1.2px;border-radius:4px;font-size:.82rem}.founders-banner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px;border:1px solid #B58B59;border-radius:14px;background:#101C32;color:#fff;margin-bottom:46px}.founders-banner h2{color:#fff;margin:8px 0}.founders-banner p{color:#F2F0EA;max-width:680px;margin-bottom:0}.package-grid{align-items:stretch}.package-card{display:flex;flex-direction:column;align-items:flex-start}.package-card .btn{margin-top:auto}.package-sub{color:#A6C6B5;font-weight:700}.tag-sale{background:#B58B59;color:#101C32}.old-price{text-decoration:line-through;color:#8a8a8a;font-size:.78em;font-weight:500;margin-right:7px}.package-card .price strong{font-size:1.25em;color:inherit}.package-card .price{margin:12px 0}.package-card h3{margin-top:16px}@media(max-width:700px){.founders-banner{align-items:flex-start;flex-direction:column}.bf-strip{font-size:.68rem;line-height:1.5}}\n";
var FTRIVA_HTML_OVERRIDES = {"/index.html":"<!doctype html><html lang=\"en\"><head>\n<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\">\n<meta name=\"description\" content=\"FTRIVA — science-informed online fitness and sport performance support. FIT. TRAIN. THRIVE.\">\n<title>FTRIVA | Fit. Train. Thrive.</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body>\n<header class=\"site-header\"><div class=\"container nav-wrap\">\n<a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n<button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button>\n<nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav>\n</div></header>\n<main>\n<section class=\"hero\"><div class=\"container\">\n<div class=\"eyebrow\">FIT. TRAIN. THRIVE.</div>\n<h1>BUILT ON <em>CONSISTENCY.</em></h1>\n<p>FTRIVA is an online fitness and sport-performance brand built on purposeful training, practical science and individual progress. We help people move with confidence, develop strength and create habits that last.</p>\n<div class=\"actions\"><a class=\"btn btn-primary\" href=\"help-me-choose.html\">Help me choose</a><a class=\"btn btn-secondary\" href=\"#founding10\">Explore Founding 10</a></div>\n<p class=\"tiny\">Science-informed · Individual-focused · 100% online</p>\n</div></section>\n\n<section class=\"section section-sage\" id=\"founding10\"><div class=\"container\">\n<div class=\"founders-banner\"><div>\n<div class=\"eyebrow\">FOUNDING 10 · LIMITED PLACES</div>\n<h2>10 people. 10 free programmes. Zero cost.</h2>\n<p>The first 10 eligible customers can claim one qualifying once-off programme free. No payment details and no subscription commitment.</p>\n</div><a class=\"btn btn-bronze\" href=\"founding10.html\">Claim a free programme</a></div>\n</div></section>\n\n<section class=\"section\"><div class=\"container\">\n<div class=\"section-head\"><div class=\"eyebrow\">WHO WE ARE</div><h2>Fitness with purpose. Progress with direction.</h2>\n<p>FTRIVA brings together sport science principles and practical training to make structured fitness more accessible. Every person starts somewhere. The goal is to build a clear, realistic path forward.</p></div>\n<div class=\"grid\">\n<article class=\"card\"><span class=\"tag\">01 · SCIENCE-INFORMED</span><h3>Knowledge behind every step</h3><p>Our approach is grounded in exercise science, movement principles and an understanding of how people develop over time.</p></article>\n<article class=\"card\"><span class=\"tag\">02 · INDIVIDUAL</span><h3>Built around real life</h3><p>We recognise that goals, experience, schedules, equipment and starting points differ. Training should reflect the individual.</p></article>\n<article class=\"card\"><span class=\"tag\">03 · PROGRESSIVE</span><h3>Small steps. Meaningful progress.</h3><p>Consistency, sensible progression and clear structure help turn good intentions into sustainable habits.</p></article>\n</div>\n</div></section>\n\n<section class=\"section section-ivory\"><div class=\"container\">\n<div class=\"section-head\"><div class=\"eyebrow\">THE FTRIVA EXPERIENCE</div><h2>Your training. Your space. Your pace.</h2>\n<p>FTRIVA operates entirely online, giving you the flexibility to access your training resources wherever you choose to exercise. No in-person appointments or gym location requirements.</p></div>\n<div class=\"grid two\">\n<article class=\"card\"><h3>Made for everyday life</h3><p>Whether you are building a fitness routine, returning after time away or working towards a sporting goal, we believe training should be practical and purposeful.</p></article>\n<article class=\"card\"><h3>Support beyond the workout</h3><p>Clear guidance and a structured approach help you understand what you are doing, why it matters and how to keep moving forward.</p></article>\n</div>\n<div class=\"actions\"><a class=\"btn btn-dark\" href=\"help-me-choose.html\">Help me find my starting point</a></div>\n</div></section>\n\n<section class=\"section section-navy\"><div class=\"container center\">\n<div class=\"section-head\"><div class=\"eyebrow\">FIT. TRAIN. THRIVE.</div><h2>Start where you are. Build from there.</h2><p>Take the first step towards a more structured approach to your fitness.</p></div>\n<div class=\"actions\"><a class=\"btn btn-primary\" href=\"help-me-choose.html\">Help me choose</a><a class=\"btn btn-secondary\" href=\"founding10.html\">Claim a free programme</a></div>\n</div></section>\n</main>\n<footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\">\n<div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div>\n<div><strong>Explore</strong><p><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div>\n<div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div>\n</div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/help-me-choose.html":"<!doctype html><html lang=\"en\"><head>\n<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\">\n<title>Help Me Choose | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body>\n<header class=\"site-header\"><div class=\"container nav-wrap\">\n<a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n<button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button>\n<nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav>\n</div></header><main>\n<section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">YOUR STARTING POINT</div><h1>LET'S FIND YOUR <em>FIT.</em></h1><p>Answer a few quick questions about your goals and how you like to train. We'll guide you towards a suitable option.</p></div></section>\n<section class=\"section section-ivory\"><div class=\"container\"><div class=\"form-shell\">\n<form id=\"recommendation-form\">\n<div class=\"field\"><label for=\"goal\">What is your main goal?</label><select id=\"goal\" name=\"goal\" required><option value=\"\">Choose your main goal</option><option value=\"general\">Improve my general fitness</option><option value=\"strength\">Build strength or muscle</option><option value=\"performance\">Improve my sport performance</option><option value=\"body\">Improve body composition</option></select></div>\n<div class=\"field\"><label for=\"experience\">How would you describe your training experience?</label><select id=\"experience\" name=\"experience\" required><option value=\"\">Choose your experience</option><option>Beginner</option><option>Some experience</option><option>Experienced</option><option>Returning after a break</option></select></div>\n<div class=\"field\"><label for=\"coaching\">What kind of structure are you looking for?</label><select id=\"coaching\" name=\"coaching\" required><option value=\"\">Choose what suits you</option><option value=\"independent\">A focused plan I can follow independently</option><option value=\"ongoing\">Ongoing guidance and support</option></select></div>\n<div class=\"field\"><label for=\"reviews\">Would regular progress reviews be useful?</label><select id=\"reviews\" name=\"reviews\" required><option value=\"\">Choose an answer</option><option value=\"yes\">Yes</option><option value=\"no\">No</option></select></div>\n<button class=\"btn btn-dark\" type=\"submit\">Show my recommendation</button>\n</form>\n<div id=\"recommendation-result\" class=\"notice hidden\" aria-live=\"polite\"></div>\n</div></div></section>\n</main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\">\n<div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div>\n<div><strong>Explore</strong><p><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div>\n<div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div>\n</div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/programmes.html":"\n<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n  <meta name=\"theme-color\" content=\"#101d2b\">\n  <meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\">\n  <title>Programmes | FTRIVA</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n\n<body>\n<header class=\"site-header\">\n  <div class=\"container nav-wrap\">\n    <a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n    <button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button>\n    <nav class=\"nav-links\">\n      <a href=\"index.html\">Home</a>\n      <a href=\"programmes.html\">Programmes</a>\n      <a href=\"memberships.html\">Memberships</a>\n      <a href=\"how-it-works.html\">How it works</a>\n      <a href=\"sponsorships.html\">Sponsorships</a>\n      \n    <a class=\"nav-cta\" href=\"/my-account\">My account</a></nav>\n  </div>\n</header>\n\n<main>\n\n<section class=\"page-hero bf-hero\">\n  <div class=\"container\">\n    <div class=\"eyebrow\">FTRIVA BLACK FRIDAY · LIMITED-TIME OFFERS</div>\n    <h1>Find your programme. Own your progress.</h1>\n    <p>Choose the package that fits your goals. Complete your assessment and FTRIVA will use your information to guide your programme.</p>\n    <div class=\"bf-strip\">BLACK FRIDAY OFFERS · SELECT YOUR PACKAGE · TRAIN WITH PURPOSE</div>\n  </div>\n</section>\n\n<section class=\"section\" id=\"packages\">\n  <div class=\"container\">\n\n    <div class=\"section-head\">\n      <div class=\"eyebrow\">CHOOSE YOUR PACKAGE</div>\n      <h2>Individual packages. Clear pricing.</h2>\n      <p>Membership prices remain unchanged during Black Friday.</p>\n    </div>\n\n    <div class=\"grid three package-grid\">\n\n      <!-- START -->\n      <article class=\"card package-card\">\n        <span class=\"tag tag-sale\">BLACK FRIDAY</span>\n        <h3>START</h3>\n        <p class=\"package-sub\">4-week personalised programme</p>\n        <div class=\"price\">\n          <span class=\"old-price\">R299</span>\n          <strong>R199</strong>\n          <small>once-off</small>\n        </div>\n        <p>Focused structure to help you build consistency.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=start\">Choose START</a>\n      </article>\n\n      <!-- PROGRESS -->\n      <article class=\"card package-card\">\n        <span class=\"tag tag-sale\">BLACK FRIDAY</span>\n        <h3>PROGRESS</h3>\n        <p class=\"package-sub\">8-week personalised programme</p>\n        <div class=\"price\">\n          <span class=\"old-price\">R549</span>\n          <strong>R399</strong>\n          <small>once-off</small>\n        </div>\n        <p>A longer programme for continued progression.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=progress\">Choose PROGRESS</a>\n      </article>\n\n      <!-- PERFORMANCE -->\n      <article class=\"card package-card\">\n        <span class=\"tag tag-sale\">BLACK FRIDAY</span>\n        <h3>PERFORMANCE</h3>\n        <p class=\"package-sub\">4-week performance programme</p>\n        <div class=\"price\">\n          <span class=\"old-price\">R399</span>\n          <strong>R299</strong>\n          <small>once-off</small>\n        </div>\n        <p>A focused programme for sport and performance goals.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=performance\">Choose PERFORMANCE</a>\n      </article>\n\n      <!-- DIGITAL -->\n      <article class=\"card package-card\">\n        <span class=\"tag tag-sale\">BLACK FRIDAY</span>\n        <h3>DIGITAL</h3>\n        <p class=\"package-sub\">Digital training product</p>\n        <div class=\"price\">\n          <span class=\"old-price\">R149</span>\n          <strong>R49</strong>\n          <small>once-off</small>\n        </div>\n        <p>A digital product for independent training.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=digital\">Choose DIGITAL</a>\n      </article>\n\n      <!-- ESSENTIAL MEMBERSHIP -->\n      <article class=\"card package-card\">\n        <span class=\"tag\">MEMBERSHIP · REGULAR PRICE</span>\n        <h3>ESSENTIAL</h3>\n        <p class=\"package-sub\">Monthly membership</p>\n        <div class=\"price\">\n          <strong>R249</strong>\n          <small>/ month</small>\n        </div>\n        <p>Ongoing programming at the Essential level.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=essential\">Choose ESSENTIAL</a>\n      </article>\n\n      <!-- PLUS MEMBERSHIP -->\n      <article class=\"card package-card\">\n        <span class=\"tag\">MEMBERSHIP · REGULAR PRICE</span>\n        <h3>PLUS</h3>\n        <p class=\"package-sub\">Monthly membership</p>\n        <div class=\"price\">\n          <strong>R399</strong>\n          <small>/ month</small>\n        </div>\n        <p>Ongoing programming at the Plus level.</p>\n        <a class=\"btn btn-bronze\" href=\"start-assessment.html?package=plus\">Choose PLUS</a>\n      </article>\n\n      <!-- ELITE MEMBERSHIP -->\n      <article class=\"card package-card\">\n        <span class=\"tag\">MEMBERSHIP · REGULAR PRICE</span>\n        <h3>ELITE</h3>\n        <p class=\"package-sub\">Monthly membership</p>\n        <div class=\"price\">\n          <strong>R599</strong>\n          <small>/ month</small>\n        </div>\n        <p>Ongoing programming at the Elite level.</p>\n        <a class=\"btn btn-dark\" href=\"start-assessment.html?package=elite\">Choose ELITE</a>\n      </article>\n\n    </div>\n  </div>\n</section>\n\n<section class=\"section section-ivory\" id=\"recommend\">\n  <div class=\"container\">\n    <div class=\"section-head\">\n      <div class=\"eyebrow\">NOT SURE WHERE TO START?</div>\n      <h2>Get a package recommendation.</h2>\n      <p>Answer a few questions. Your recommendation is a starting point — you can still select any package.</p>\n    </div>\n\n    <div class=\"form-shell\">\n      <form id=\"recommendation-form\">\n\n        <div class=\"field\">\n          <label>Main goal</label>\n          <select name=\"goal\" required>\n            <option value=\"\">Choose</option>\n            <option value=\"general\">General fitness</option>\n            <option value=\"strength\">Strength or muscle development</option>\n            <option value=\"performance\">Sport performance</option>\n            <option value=\"body\">Body composition</option>\n          </select>\n        </div>\n\n        <div class=\"field\">\n          <label>Training experience</label>\n          <select name=\"experience\" required>\n            <option value=\"\">Choose</option>\n            <option>Beginner</option>\n            <option>Some experience</option>\n            <option>Experienced</option>\n            <option>Returning after a break</option>\n          </select>\n        </div>\n\n        <div class=\"field\">\n          <label>What do you prefer?</label>\n          <select name=\"coaching\" required>\n            <option value=\"\">Choose</option>\n            <option value=\"independent\">A focused programme</option>\n            <option value=\"ongoing\">Ongoing programming and support</option>\n          </select>\n        </div>\n\n        <div class=\"field\">\n          <label>Would regular progress reviews help?</label>\n          <select name=\"reviews\" required>\n            <option value=\"\">Choose</option>\n            <option value=\"yes\">Yes</option>\n            <option value=\"no\">No</option>\n          </select>\n        </div>\n\n        <button class=\"btn btn-dark\" type=\"submit\">Recommend my package</button>\n      </form>\n\n      <div id=\"recommendation-result\" class=\"notice hidden\" aria-live=\"polite\"></div>\n    </div>\n  </div>\n</section>\n\n</main>\n\n<footer class=\"site-footer\">\n  <div class=\"container\">\n    <div class=\"footer-grid\">\n\n      <div>\n        <a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n        <p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p>\n      </div>\n\n      <div>\n        <strong>Explore</strong>\n        <p>\n          <a href=\"programmes.html\">Programmes</a><br>\n          <a href=\"memberships.html\">Memberships</a><br>\n          <a href=\"how-it-works.html\">How it works</a><br>\n          <a href=\"privacy.html\">Privacy</a>\n        </p>\n      </div>\n\n      <div>\n        <strong>Get in touch</strong>\n        <p>\n          <a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br>\n          <a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br>\n          <a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a>\n        </p>\n      </div>\n\n    </div>\n\n    <div class=\"footer-bottom\">\n      © 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.\n    </div>\n  </div>\n</footer>\n\n<script src=\"app.js\" defer></script>\n</body>\n</html>\n\n","/memberships.html":"<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n  <meta name=\"theme-color\" content=\"#101d2b\">\n  <meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\">\n  <title>Memberships | FTRIVA</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n\n<body>\n<header class=\"site-header\">\n  <div class=\"container nav-wrap\">\n    <a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n    <button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button>\n    <nav class=\"nav-links\">\n      <a href=\"index.html\">Home</a>\n      <a href=\"programmes.html\">Programmes</a>\n      <a href=\"memberships.html\">Memberships</a>\n      <a href=\"how-it-works.html\">How it works</a>\n      <a href=\"sponsorships.html\">Sponsorships</a>\n      \n    <a class=\"nav-cta\" href=\"/my-account\">My account</a></nav>\n  </div>\n</header>\n\n<main>\n  <section class=\"page-hero\">\n    <div class=\"container\">\n      <div class=\"eyebrow\">ONGOING PROGRAMMING</div>\n      <h1>Build consistency over time.</h1>\n      <p>Membership is designed for people who want continued structure, updated programming and progress reviews.</p>\n    </div>\n  </section>\n\n  <section class=\"section\">\n    <div class=\"container\">\n      <div class=\"grid three package-grid\">\n\n        <article class=\"card package-card\">\n          <h3>ESSENTIAL</h3>\n          <div class=\"price\">R249 <small>/ month</small></div>\n          <p>Ongoing programming at the Essential level.</p>\n          <a class=\"btn btn-dark\" href=\"start-assessment.html?package=essential\">Choose ESSENTIAL</a>\n        </article>\n\n        <article class=\"card package-card card-feature\">\n          <span class=\"recommend-label\">POPULAR MEMBERSHIP</span>\n          <h3>PLUS</h3>\n          <div class=\"price\">R399 <small>/ month</small></div>\n          <p>Ongoing programming at the Plus level.</p>\n          <a class=\"btn btn-bronze\" href=\"start-assessment.html?package=plus\">Choose PLUS</a>\n        </article>\n\n        <article class=\"card package-card\">\n          <h3>ELITE</h3>\n          <div class=\"price\">R599 <small>/ month</small></div>\n          <p>Ongoing programming at the Elite level.</p>\n          <a class=\"btn btn-dark\" href=\"start-assessment.html?package=elite\">Choose ELITE</a>\n        </article>\n\n      </div>\n\n      <p class=\"tiny muted\">\n        Memberships remain at their regular monthly prices during Black Friday.\n        Recurring billing requires the matching Paystack plan to be configured.\n      </p>\n\n      <div class=\"actions\">\n        <a class=\"btn btn-dark\" href=\"programmes.html\">View all FTRIVA packages</a>\n      </div>\n    </div>\n  </section>\n</main>\n\n<footer class=\"site-footer\">\n  <div class=\"container\">\n    <div class=\"footer-grid\">\n      <div>\n        <a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a>\n        <p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p>\n      </div>\n\n      <div>\n        <strong>Explore</strong>\n        <p>\n          <a href=\"programmes.html\">Programmes</a><br>\n          <a href=\"memberships.html\">Memberships</a><br>\n          <a href=\"how-it-works.html\">How it works</a><br>\n          <a href=\"privacy.html\">Privacy</a>\n        </p>\n      </div>\n\n      <div>\n        <strong>Get in touch</strong>\n        <p>\n          <a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br>\n          <a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br>\n          <a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a>\n        </p>\n      </div>\n    </div>\n\n    <div class=\"footer-bottom\">\n      © 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only ·\n      We aim to respond within 24–48 business hours, Monday to Friday.\n    </div>\n  </div>\n</footer>\n\n<script src=\"app.js\" defer></script>\n</body>\n</html>\n","/how-it-works.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>How It Works | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">SIMPLE, STRUCTURED, ONLINE</div><h1>How FTRIVA works.</h1><p>A clear journey from choosing your package to receiving a programme built around your information.</p></div></section><section class=\"section\"><div class=\"container\"><div class=\"steps\"><div class=\"step\"><b>01</b><h3>Choose</h3><p>Explore the packages or complete the short recommendation questionnaire.</p></div><div class=\"step\"><b>02</b><h3>Checkout</h3><p>Enter your details and pay securely through Paystack.</p></div><div class=\"step\"><b>03</b><h3>Assess</h3><p>After payment verification, complete your detailed fitness assessment and request a start date.</p></div><div class=\"step\"><b>04</b><h3>Prepare</h3><p>Your information is reviewed and your programme is prepared before it becomes available.</p></div></div><div class=\"notice\"><strong>Programme start dates:</strong> Your requested start date is recorded automatically. Programme access begins on that date only after the programme has been published and any required safety review is complete.</div><a class=\"btn btn-dark\" href=\"programmes.html#recommend\">Start your journey</a></div></section><section class=\"section section-ivory\"><div class=\"container faq\"><div class=\"section-head\"><h2>Good to know.</h2></div><details><summary>Is FTRIVA online only?</summary><p>Yes. FTRIVA provides online fitness programming and support. No in-person training sessions or consultations are offered.</p></details><details><summary>When do I complete the detailed assessment?</summary><p>After your payment has been successfully verified.</p></details><details><summary>When does my programme begin?</summary><p>Your requested start date is recorded during assessment. Access depends on the programme being published and any required safety review being complete.</p></details></div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/sponsorships.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>Sponsorships | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">PARTNERSHIPS</div><h1>Grow performance together.</h1><p>FTRIVA welcomes relevant partnership and sponsorship enquiries aligned with accessible, evidence-informed fitness and sport.</p></div></section><section class=\"content\"><div class=\"container\"><h2>Let's explore a partnership.</h2><p>We are interested in thoughtful collaborations that support participation, development and performance. Share your organisation, proposal and intended audience.</p><div class=\"contact-row\"><a class=\"btn btn-dark\" href=\"mailto:ftrivafitness@gmail.com?subject=FTRIVA%20Sponsorship%20Enquiry\">Email sponsorship enquiry</a><a class=\"btn btn-primary\" href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp FTRIVA</a></div></div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/founding10.html":"<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"theme-color\" content=\"#101C32\">\n<title>Founding 10 | FTRIVA</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n<header class=\"site-header\">\n<div class=\"container nav-wrap\">\n<a class=\"brand\" href=\"index.html\">FTRI<span>VA</span>\n</a>\n<button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button>\n<nav class=\"nav-links\">\n<a href=\"index.html\">Home</a>\n<a href=\"programmes.html\">Programmes</a>\n<a href=\"memberships.html\">Memberships</a>\n<a href=\"how-it-works.html\">How it works</a>\n<a href=\"sponsorships.html\">Sponsorships</a>\n\n<a class=\"nav-cta\" href=\"/my-account\">My account</a></nav>\n</div>\n</header>\n<main>\n<section class=\"page-hero\">\n<div class=\"container\">\n<div class=\"eyebrow\">FOUNDING 10 · FIRST 10 QUALIFYING CLIENTS</div>\n<h1>Your first programme. On us.</h1>\n<p>Claim one qualifying once-off FTRIVA programme for free. This offer is exclusively for START, PROGRESS and PERFORMANCE. Memberships and DIGITAL are excluded. No payment details or subscription commitment.</p>\n</div>\n</section>\n<section class=\"section section-ivory\">\n<div class=\"container\">\n<div class=\"form-shell\">\n<div class=\"notice\">\n<strong>Eligible programmes only:</strong> START (4 weeks), PROGRESS (8 weeks) or PERFORMANCE (4 weeks). ESSENTIAL, PLUS and ELITE memberships are excluded, as is DIGITAL. One claim per person. Claims are accepted only while places remain.</div>\n<form id=\"founding10-form\">\n<div class=\"field\">\n<label for=\"founding-package\">Choose your free once-off programme</label>\n<select id=\"founding-package\" name=\"package\" required>\n<option value=\"\">Select your programme</option>\n<option value=\"START\">START — 4-week programme</option>\n<option value=\"PROGRESS\">PROGRESS — 8-week programme</option>\n<option value=\"PERFORMANCE\">PERFORMANCE — 4-week programme</option>\n\n</select>\n</div>\n<div class=\"field\">\n<label for=\"founding-name\">Full name</label>\n<input id=\"founding-name\" name=\"fullName\" autocomplete=\"name\" maxlength=\"120\" required>\n</div>\n<div class=\"field\">\n<label for=\"founding-email\">Email address</label>\n<input id=\"founding-email\" name=\"email\" type=\"email\" autocomplete=\"email\" maxlength=\"254\" required>\n</div>\n<div class=\"field\">\n<label for=\"founding-phone\">Phone number</label>\n<input id=\"founding-phone\" name=\"phone\" type=\"tel\" autocomplete=\"tel\" maxlength=\"40\" required>\n</div>\n<div id=\"founding10-message\" aria-live=\"polite\">\n</div>\n<button class=\"btn btn-dark\" type=\"submit\">Claim my free programme</button>\n<p class=\"tiny muted\">Your place is confirmed only after the secure system accepts your claim. No card details are requested.</p>\n</form>\n<p class=\"center\">\n<a href=\"programmes.html\">← Back to packages</a>\n</p>\n</div>\n</div>\n</section>\n</main>\n<footer class=\"site-footer\">\n<div class=\"container\">\n<div class=\"footer-grid\">\n<div>\n<a class=\"brand\" href=\"index.html\">FTRI<span>VA</span>\n</a>\n<p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p>\n</div>\n<div>\n<strong>Explore</strong>\n<p>\n<a href=\"programmes.html\">Programmes</a>\n<br>\n<a href=\"memberships.html\">Memberships</a>\n<br>\n<a href=\"how-it-works.html\">How it works</a>\n<br>\n<a href=\"privacy.html\">Privacy</a>\n</p>\n</div>\n<div>\n<strong>Get in touch</strong>\n<p>\n<a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a>\n<br>\n<a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a>\n<br>\n<a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a>\n</p>\n</div>\n</div>\n<div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div>\n</div>\n</footer>\n<script src=\"app.js\" defer>\n</script>\n</body>\n</html>\n","/start-assessment.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>Start Assessment | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">GET STARTED</div><h1>Your next step starts here.</h1><p>Select your individual package, then complete checkout. Your detailed fitness assessment unlocks after payment verification — or immediately after a successful Founding 10 claim.</p></div></section><section class=\"section section-ivory\"><div class=\"container\"><div class=\"form-shell\"><h2>Package and account details</h2><div id=\"selected-package-summary\" class=\"notice\" aria-live=\"polite\"><strong id=\"selected-package-name\">Your selected FTRIVA package</strong><p id=\"selected-package-price\">Your package price will appear here.</p><p id=\"checkout-billing-note\" class=\"tiny muted\" aria-live=\"polite\"></p></div><form id=\"checkout-form\"><input type=\"hidden\" id=\"package\" name=\"package\"><div class=\"field\"><label for=\"fullName\">Full name</label><input id=\"fullName\" name=\"fullName\" autocomplete=\"name\" required maxlength=\"120\"></div><div class=\"field\"><label for=\"email\">Email address</label><input id=\"email\" name=\"email\" type=\"email\" autocomplete=\"email\" required maxlength=\"254\"></div><div class=\"field\"><label for=\"phone\">Phone number</label><input id=\"phone\" name=\"phone\" type=\"tel\" autocomplete=\"tel\" required maxlength=\"40\"></div><div id=\"checkout-message\" aria-live=\"polite\"></div><button class=\"btn btn-dark\" type=\"submit\">Continue to secure payment</button><p class=\"tiny muted\">Payments are processed securely by Paystack. Memberships are billed monthly. The Founding 10 claim does not require payment details.</p></form></div></div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/assessment.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>Fitness Assessment | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">PERSONALISED PROGRAMMING</div><h1>Your fitness assessment.</h1><p>Complete the sections as accurately as possible. Your information helps FTRIVA understand your goals, experience, environment and exercise-safety considerations.</p></div></section><section class=\"section section-ivory\"><div class=\"container\"><div class=\"form-shell\"><div id=\"assessment-locked\" class=\"error hidden\"><strong>Assessment locked.</strong><p>A successful Paystack payment verification is required before you can complete this assessment.</p><a class=\"btn btn-dark\" href=\"programmes.html#packages\">Return to packages</a></div><form id=\"assessment-form\" class=\"hidden\"><div class=\"notice\">Access confirmed for: <strong id=\"assessment-package\"></strong>. Enter the same email address you used at checkout or on your Founding 10 claim so we can match your assessment to your purchase or claim. Your requested start date is recorded as the intended programme start date, subject to programme publication and any required safety review.</div><input type=\"hidden\" id=\"payment-reference\" name=\"paymentReference\"><h2>1. Personal information</h2><div class=\"form-row\"><div class=\"field\"><label>Full name *</label><input name=\"fullName\" required></div><div class=\"field\"><label>Date of birth *</label><input type=\"date\" name=\"dateOfBirth\" required></div></div><div class=\"form-row\"><div class=\"field\"><label>Email *</label><input type=\"email\" name=\"email\" required></div><div class=\"field\"><label>Phone *</label><input name=\"phone\" required></div></div><div class=\"form-row\"><div class=\"field\"><label>Country *</label><input name=\"country\" value=\"South Africa\" required></div><div class=\"field\"><label>Preferred communication *</label><select name=\"communication\" required><option value=\"\">Select</option><option>Email</option><option>WhatsApp</option></select></div></div><div class=\"field\"><label>Are you under 18? *</label><select name=\"under18\" required><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></div><div id=\"guardian-details\" class=\"form-row hidden\"><div class=\"field\"><label>Parent/guardian name *</label><input name=\"guardianName\"></div><div class=\"field\"><label>Parent/guardian email *</label><input type=\"email\" name=\"guardianEmail\"></div></div>\n<h2>2. Goals</h2><div class=\"field\"><label>Primary goal *</label><select name=\"primaryGoal\" required><option value=\"\">Select</option><option>General health and fitness</option><option>Weight loss / body composition</option><option>Muscle development</option><option>Strength</option><option>Athletic performance</option><option>Endurance</option><option>Mobility</option><option>Return to exercise</option><option>Other</option></select></div><div class=\"field\"><label>Secondary goals</label><textarea name=\"secondaryGoal\"></textarea></div><div class=\"field\"><label>Specific event, target or desired outcome</label><textarea name=\"target\"></textarea></div><div class=\"field\"><label>What motivates you to achieve this goal?</label><textarea name=\"motivation\"></textarea></div>\n<h2>3. Training history</h2><div class=\"field\"><label>Have you followed a structured training programme before? *</label><select name=\"structuredTraining\" required><option value=\"\">Select</option><option>Yes</option><option>No</option></select></div><div class=\"field\"><label>How would you describe your training experience? *</label><select name=\"experience\" required><option value=\"\">Select</option><option>Beginner</option><option>Less than 6 months</option><option>6–12 months</option><option>1–3 years</option><option>More than 3 years</option><option>Returning after a break</option></select></div><div class=\"field\"><label>Types of training you have done</label><textarea name=\"trainingTypes\" placeholder=\"e.g. gym, running, team sport, home workouts\"></textarea></div><div class=\"field\"><label>When did you last train consistently?</label><select name=\"lastConsistent\"><option>Currently training consistently</option><option>Within the last month</option><option>1–3 months ago</option><option>3–6 months ago</option><option>More than 6 months ago</option></select></div>\n<h2>4. Current activity and fitness</h2><div class=\"field\"><label>Current activity level *</label><select name=\"activityLevel\" required><option value=\"\">Select</option><option>Sedentary</option><option>Lightly active</option><option>Moderately active</option><option>Very active</option></select></div><div class=\"field\"><label>How many days per week do you currently exercise?</label><select name=\"daysPerWeek\"><option>0</option><option>1–2</option><option>3–4</option><option>5–6</option><option>7</option></select></div><div class=\"field\"><label>Current activities</label><textarea name=\"activities\"></textarea></div><div class=\"field\"><label>How would you rate your current fitness?</label><select name=\"fitnessLevel\"><option>Below average</option><option>Average</option><option>Good</option><option>Very good</option><option>Unsure</option></select></div><div class=\"form-row\"><div class=\"field\"><label>Height (optional)</label><input name=\"height\" placeholder=\"e.g. 175 cm\"></div><div class=\"field\"><label>Weight (optional)</label><input name=\"weight\" placeholder=\"e.g. 70 kg\"></div></div>\n<h2>5. Health and injury screening</h2><div class=\"field\"><label>Do you currently have an injury, pain or physical limitation? *</label><select name=\"injuryOrPain\" required><option value=\"\">Select</option><option value=\"no\">No</option><option value=\"yes\">Yes</option></select></div><div class=\"field\"><label>If yes, please describe the injury, pain, date, aggravating movements, treatment and any clearance received.</label><textarea name=\"injuryDetails\"></textarea></div><div class=\"field\"><label>Any diagnosed conditions that may affect exercise?</label><textarea name=\"conditions\"></textarea></div><div class=\"field\"><label>Medication that may affect exercise?</label><textarea name=\"medication\"></textarea></div><div class=\"field\"><label>Has a healthcare professional restricted your exercise or advised you to avoid any activity?</label><textarea name=\"restrictions\"></textarea></div><div class=\"field\"><label>Have you experienced chest pain, fainting, unexplained dizziness or unusual shortness of breath during physical activity? *</label><select name=\"warningSymptoms\" required><option value=\"\">Select</option><option>No</option><option>Yes</option><option>Unsure</option></select></div><div class=\"field\"><label>Movements or exercises you have been advised to avoid</label><textarea name=\"avoidMovements\"></textarea></div><div class=\"notice\">If you report concerning symptoms, unresolved injuries or medical restrictions, your information may need manual review before a programme is prepared. This assessment does not provide medical clearance.</div>\n<h2>6. Equipment and training environment</h2><div class=\"field\"><label>Where will you train most often? *</label><select name=\"environment\" required><option value=\"\">Select</option><option>Commercial gym</option><option>Home gym</option><option>Home with no equipment</option><option>Outdoor</option><option>Sports facility</option><option>Combination</option></select></div><div class=\"field\"><label>Available equipment (select all that apply)</label><div class=\"choice-list\"><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Dumbbells\"> Dumbbells</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Barbells\"> Barbells</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Resistance bands\"> Resistance bands</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Cable machines\"> Cable machines</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Weight machines\"> Weight machines</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Kettlebells\"> Kettlebells</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Bench\"> Bench</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Squat rack\"> Squat rack</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Pull-up bar\"> Pull-up bar</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Cardio equipment\"> Cardio equipment</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Bodyweight only\"> Bodyweight only</label><label class=\"choice\"><input type=\"checkbox\" name=\"equipment[]\" value=\"Other\"> Other</label></div></div><div class=\"field\"><label>How consistent is your access to this equipment?</label><select name=\"access\"><option>Consistent</option><option>Some days only</option><option>Varies</option></select></div><div class=\"field\"><label>Space, access or equipment limitations</label><textarea name=\"limitations\"></textarea></div>\n<h2>7. Schedule and availability</h2><div class=\"field\"><label>How many training sessions per week would you prefer? *</label><select name=\"sessions\" required><option value=\"\">Select</option><option>1–2</option><option>3</option><option>4</option><option>5</option><option>6+</option></select></div><div class=\"field\"><label>Preferred session duration *</label><select name=\"duration\" required><option value=\"\">Select</option><option>15–30 minutes</option><option>30–45 minutes</option><option>45–60 minutes</option><option>60–90 minutes</option><option>More than 90 minutes</option></select></div><div class=\"field\"><label>Preferred training days and times</label><textarea name=\"days\"></textarea></div><div class=\"field\"><label>Do you participate in a sport or other organised physical activity?</label><textarea name=\"sport\"></textarea></div><div class=\"field\"><label>Rest-day preferences or schedule limitations</label><textarea name=\"restPreference\"></textarea></div>\n<h2>8. Training preferences</h2><div class=\"field\"><label>Training styles you enjoy</label><textarea name=\"styles\" placeholder=\"e.g. strength, circuits, running, mobility\"></textarea></div><div class=\"field\"><label>Favourite exercises</label><textarea name=\"favouriteExercises\"></textarea></div><div class=\"field\"><label>Exercises you dislike or prefer to avoid</label><textarea name=\"dislikedExercises\"></textarea></div><div class=\"field\"><label>Do you prefer a highly structured plan or more variety?</label><select name=\"sessionStyle\"><option>Highly structured</option><option>A balance of structure and variety</option><option>More variety</option><option>No preference</option></select></div>\n<h2>9. Programme start date</h2><div class=\"field\"><label>When would you like to start? *</label><select name=\"startDate\" required><option value=\"\">Select</option><option value=\"as_soon_as_available\">As soon as available</option><option value=\"within_7_days\">Within 7 days</option><option value=\"within_14_days\">Within 14 days</option><option value=\"within_30_days\">Within 30 days</option><option value=\"specific_date\">I have a specific date</option></select></div><div class=\"field\"><label>Specific requested start date (complete if you selected a specific date)</label><input type=\"date\" name=\"desiredStartDate\" min=\"2026-11-17\"></div><div class=\"field\"><label>Additional comments or information</label><textarea name=\"additionalComments\"></textarea></div>\n<h2>Consent and confirmation</h2><div class=\"choice-list\"><label class=\"choice\"><input type=\"checkbox\" name=\"consentAccurate\" value=\"yes\" required> I confirm that the information I have provided is accurate and complete, and I will disclose relevant changes. *</label><label class=\"choice\"><input type=\"checkbox\" name=\"consentPrivacy\" value=\"yes\" required> I consent to FTRIVA using this information to prepare and manage my online fitness programme, in line with its privacy notice. *</label><label class=\"choice\"><input type=\"checkbox\" name=\"consentScope\" value=\"yes\" required> I understand FTRIVA provides online fitness programming, not medical diagnosis or treatment. I will stop exercise and seek appropriate medical assistance if concerning symptoms occur. *</label><label class=\"choice\" id=\"guardian-consent-row\"><input type=\"checkbox\" name=\"guardianConsent\" value=\"yes\"> Parent/guardian consent has been obtained where the client is under 18.</label></div><div id=\"assessment-message\" aria-live=\"polite\"></div><button class=\"btn btn-dark\" type=\"submit\">Submit my assessment</button><p class=\"tiny muted\">Your requested start date is recorded as the intended programme start date. Access is activated only after programme publication and any required safety review.</p></form></div></div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/payment-callback.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>Payment Confirmation | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">PAYMENT STATUS</div><h1>Confirming your payment.</h1><p>We are checking your transaction directly with Paystack.</p></div></section><section class=\"section\"><div class=\"container\"><div class=\"form-shell\" id=\"callback-message\" aria-live=\"polite\"><p>Checking transaction…</p></div></div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>","/privacy.html":"<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#101d2b\"><meta name=\"description\" content=\"FTRIVA online strength and conditioning. FIT. TRAIN. THRIVE.\"><title>Privacy Notice | FTRIVA</title><link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin><link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@500;600;700;800&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body><header class=\"site-header\"><div class=\"container nav-wrap\"><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><button class=\"menu-toggle\" aria-label=\"Open navigation\">Menu</button><nav class=\"nav-links\"><a href=\"index.html\">Home</a><a href=\"programmes.html\">Programmes</a><a href=\"memberships.html\">Memberships</a><a href=\"how-it-works.html\">How it works</a><a href=\"sponsorships.html\">Sponsorships</a><a class=\"nav-cta\" href=\"/my-account\">My account</a></nav></div></header><main><section class=\"page-hero\"><div class=\"container\"><div class=\"eyebrow\">YOUR INFORMATION</div><h1>Privacy notice.</h1><p>How information submitted through the FTRIVA website is intended to be handled.</p></div></section><section class=\"content\"><div class=\"container legal\">\n<h2>Who is responsible for your information?</h2>\n<p>FTRIVA is responsible for the personal information collected through this website. For privacy questions or requests, contact <a href=\"mailto:ftrivafitness@gmail.com\">ftrivafitness@gmail.com</a>.</p>\n<h2>Information we collect</h2>\n<p>Depending on the service you choose, FTRIVA may collect your name, email address, phone number, date of birth, parent or guardian contact details where applicable, package or membership selection, payment reference and transaction details, and information you provide about your goals, training history, activity, equipment, schedule, injuries, pain, medical conditions, medication and exercise restrictions.</p>\n<h2>Why we use it</h2>\n<p>We use this information to respond to enquiries, administer Founding 10 claims, process and verify purchases, manage memberships, assess exercise readiness, prepare and manage online fitness programmes, communicate with clients, maintain records and protect the service against fraud or misuse.</p>\n<h2>Health and injury information</h2>\n<p>Information about injuries, pain, medical conditions, medication and exercise restrictions can be sensitive. Please provide only information relevant to safe exercise programming. It is used for programme suitability and safety review, not for medical diagnosis or treatment. If you report concerning symptoms or restrictions, FTRIVA may ask you to obtain guidance or clearance from an appropriate healthcare professional before exercise programming proceeds.</p>\n<h2>Children and guardian consent</h2>\n<p>If a client is under 18, the assessment asks for parent or guardian contact details and confirmation that guardian consent has been obtained. A parent or guardian should complete or supervise the process and contact FTRIVA with any questions about a minor's information.</p>\n<h2>Payments</h2>\n<p>Paystack processes checkout and payment credentials. FTRIVA does not receive or store full card numbers or card security codes. The website stores transaction references and relevant payment confirmation information so that purchases and memberships can be recorded and reconciled.</p>\n<h2>Service providers and where information is processed</h2>\n<p>The website and its server-side functions are hosted through Cloudflare. FTRIVA uses Supabase to store customer, purchase, membership and assessment records, and Paystack to process payments. Generic sign-up notification emails may be sent through Cloudflare Email Service to FTRIVA. These providers process information as needed to deliver their services and are subject to their own terms and privacy practices.</p>\n<p>The Supabase database used for this website is hosted in the EU Central region (Frankfurt, Germany). This means some personal information may be stored outside South Africa. FTRIVA must ensure that any cross-border processing is supported by the safeguards and conditions required by applicable South African data-protection law before accepting client information.</p>\n<h2>How long we keep information</h2>\n<p>FTRIVA keeps personal information only for as long as it is reasonably required for the purposes described above, to provide the service, resolve disputes, maintain appropriate business records or meet legal obligations. Retention and deletion procedures should be applied to the database and connected service providers.</p>\n<h2>Security</h2>\n<p>FTRIVA uses server-side access to the database and restricts public access to customer and assessment records. No online service can guarantee absolute security. Please do not send payment card details or unrelated sensitive information by email or messaging.</p>\n<h2>Your choices and rights</h2>\n<p>Subject to applicable law, you may ask to access or correct personal information, ask questions about how it is used, or request deletion where FTRIVA is not required or otherwise permitted to retain it. You may also raise a concern about how your information has been handled. Contact <a href=\"mailto:ftrivafitness@gmail.com\">ftrivafitness@gmail.com</a>.</p>\n<h2>Updates to this notice</h2>\n<p>This notice may be updated when the website or its data practices change. The version published on this page applies from the date it is posted.</p>\n<p><strong>Important:</strong> This is a working privacy notice, not legal advice. Before launch, FTRIVA should have the notice and its cross-border data arrangements reviewed for compliance with POPIA and any other applicable requirements.</p>\n</div></section></main><footer class=\"site-footer\"><div class=\"container\"><div class=\"footer-grid\"><div><a class=\"brand\" href=\"index.html\">FTRI<span>VA</span></a><p>FIT. TRAIN. THRIVE.<br>Online strength and conditioning, built around your goals.</p></div><div><strong>Explore</strong><p><a href=\"programmes.html\">Programmes</a><br><a href=\"memberships.html\">Memberships</a><br><a href=\"how-it-works.html\">How it works</a><br><a href=\"privacy.html\">Privacy</a></p></div><div><strong>Get in touch</strong><p><a href=\"mailto:ftrivafitness@gmail.com\">Email FTRIVA</a><br><a href=\"https://wa.me/27746160421\" target=\"_blank\" rel=\"noopener\">WhatsApp 074 616 0421</a><br><a href=\"https://instagram.com/ftriva.fitness\" target=\"_blank\" rel=\"noopener\">@ftriva.fitness</a></p></div></div><div class=\"footer-bottom\">© 2026 FTRIVA. FIT. TRAIN. THRIVE. · Online services only · We aim to respond within 24–48 business hours, Monday to Friday.</div></div></footer><script src=\"app.js\" defer></script></body></html>"};
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
var FOUNDING10_PACKAGES = /* @__PURE__ */ new Set(["START", "PROGRESS", "PERFORMANCE"]);
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
async function sendFtrivaPurchaseEmails(env,payment,packageId,packageInfo,subscriptionCode=null,digitalDeliveryReady=false){
 const email=safeText(payment.customer?.email,254).toLowerCase();if(!validEmail(email))return;
 const membership=packageInfo.type==="monthly";const needsAssessment=!membership&&packageInfo.assessmentRequired===true;const isDigital=packageId==="DIGITAL";
 const ref=safeText(membership?(subscriptionCode||payment.subscription_code||payment.subscription?.subscription_code||payment.reference):payment.reference,160);const key=ref||await sha256(email+":"+packageId);
 const name=safeText(payment.metadata?.customer_name||payment.metadata?.full_name,120)||"there";const amount=(Number(payment.amount||packageInfo.amount)/100).toFixed(2);const appUrl=safeText(env.FTRIVA_APP_URL,500)||((env.ENVIRONMENT||"test").toLowerCase()==="test"?"https://app-test.ftriva.com":"https://app.ftriva.com");
 const subject=membership?"Your FTRIVA membership is active":needsAssessment?"Your FTRIVA purchase is confirmed":isDigital?(digitalDeliveryReady?"Your FTRIVA DIGITAL resources are ready":"Your FTRIVA DIGITAL purchase is confirmed — access is syncing"):"Your FTRIVA purchase is confirmed";
 const intro=membership?"Your FTRIVA "+packageId+" membership is active.":needsAssessment?"Your FTRIVA "+packageId+" purchase is confirmed.":isDigital?(digitalDeliveryReady?"Your FTRIVA DIGITAL resources are ready.":"Your DIGITAL payment is verified and your purchase is recorded. We are still synchronising secure app access."):"Your FTRIVA purchase is confirmed.";
 const nextStep=needsAssessment?"Your personalised programme will appear in the app after you complete your assessment and FTRIVA has reviewed and prepared your plan. If you have not submitted your assessment yet, return to the FTRIVA website and complete it.":isDigital?(digitalDeliveryReady?"Your DIGITAL Training Toolkit and Workout Tracker are available in the Downloads section after you sign in.":"Your purchase is recorded, but app access is still being synchronised. Do not pay again. Sign in using the same email address later; if the resources are not visible, contact FTRIVA on WhatsApp +27 74 616 0421."):"Your membership access is active in the app.";
 const standardTextBody=["Hi "+name+",","",intro,"Amount: R"+amount,"",nextStep,"","Log in at "+appUrl+" using the same email address used at checkout. If you are new, create an account and confirm your email first.","","Add to Home Screen:","iPhone/iPad: Open this link in Safari, tap Share, then Add to Home Screen.","Android: Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.","","Need help? WhatsApp FTRIVA: +27 74 616 0421","","FIT. TRAIN. THRIVE.","FTRIVA"].join(String.fromCharCode(10));
 const digitalTextBody=["Hi "+name+",","","Your FTRIVA DIGITAL purchase is confirmed.","Amount: R"+amount,"",digitalDeliveryReady?"Your Training Toolkit PDF and Workout Tracker are available in the Downloads section of the FTRIVA member web app.":"Your payment is verified and your purchase is recorded, but secure app access is still synchronising. Do not pay again. If your files are not visible in Downloads shortly, contact FTRIVA on WhatsApp +27 74 616 0421.","","To access your files, open the FTRIVA member web app and sign in using the same email address used at checkout. Then open Downloads. Your files are kept inside your signed-in account.","","No files are attached to this email, and this email contains no download links.","","You can open the member app using your saved Home Screen shortcut or the Member Login option on the FTRIVA website.","","Add to Home Screen:","iPhone/iPad: Open the FTRIVA member web app in Safari, tap Share, then Add to Home Screen.","Android: Open the FTRIVA member web app in Chrome, tap the three-dot menu, then Add to Home screen or Install app.","","Need help? WhatsApp FTRIVA: +27 74 616 0421","","FIT. TRAIN. THRIVE.","FTRIVA"].join(String.fromCharCode(10));
 const textBody=isDigital?digitalTextBody:standardTextBody;
 const heading=membership?"Your membership is active":needsAssessment?"Your purchase is confirmed":isDigital?"Your DIGITAL purchase is confirmed":"Your purchase is confirmed";
 const standardHtmlBody="<div style='background:#F5F1E8;padding:28px;font-family:Arial,sans-serif;color:#101D2B'><div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px'><div style='font-weight:900;letter-spacing:4px;font-size:22px'>FTRIVA</div><div style='color:#A8B8A0;font-size:11px;letter-spacing:2px;margin-top:4px'>FIT. TRAIN. THRIVE.</div><h1 style='font-size:25px;margin-top:28px'>"+heading+"</h1><p>Hi "+emailEscape(name)+",</p><p>"+emailEscape(intro)+"</p><p style='background:#F5F1E8;padding:14px;border-radius:8px'>Amount: <b>R"+amount+"</b></p><p>"+emailEscape(nextStep)+"</p><p><a href='"+appUrl+"' style='display:inline-block;background:#101D2B;color:white;padding:13px 18px;border-radius:8px;text-decoration:none;font-weight:bold'>Open your FTRIVA app</a></p><h3>Sign in</h3><p>Use the same email address used at checkout. If you are new, create an account and confirm your email first.</p><h3>Add to your Home Screen</h3><p><b>iPhone/iPad:</b> Open in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.</p><p>Need help? WhatsApp <b>+27 74 616 0421</b>.</p><p style='color:#A8B8A0;font-weight:bold'>FIT. TRAIN. THRIVE.</p></div></div>";
 const digitalHtmlBody="<div style='background:#F5F1E8;padding:28px;font-family:Arial,sans-serif;color:#101D2B'><div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px'><div style='font-weight:900;letter-spacing:4px;font-size:22px'>FTRIVA</div><div style='color:#A8B8A0;font-size:11px;letter-spacing:2px;margin-top:4px'>FIT. TRAIN. THRIVE.</div><h1 style='font-size:25px;margin-top:28px'>Your DIGITAL purchase is confirmed</h1><p>Hi "+emailEscape(name)+",</p><p>Your FTRIVA DIGITAL purchase is confirmed.</p><p style='background:#F5F1E8;padding:14px;border-radius:8px'>Amount: <b>R"+amount+"</b></p><p>"+emailEscape(digitalDeliveryReady?"Your Training Toolkit PDF and Workout Tracker are available in the Downloads section of the FTRIVA member web app.":"Your payment is verified and your purchase is recorded, but secure app access is still synchronising. Do not pay again. If your files are not visible in Downloads shortly, contact FTRIVA on WhatsApp +27 74 616 0421.")+"</p><h3>Access your DIGITAL resources</h3><p>Open the FTRIVA member web app and sign in using the same email address used at checkout. Then open <b>Downloads</b>. Your Training Toolkit PDF and Workout Tracker are kept inside your signed-in account.</p><p><b>No files are attached to this email, and this email contains no download links.</b></p><p>Open the member app using your saved Home Screen shortcut or the Member Login option on the FTRIVA website.</p><h3>Add to your Home Screen</h3><p><b>iPhone/iPad:</b> Open the FTRIVA member web app in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open the FTRIVA member web app in Chrome, tap the three-dot menu, then Add to Home screen or Install app.</p><p>Need help? WhatsApp <b>+27 74 616 0421</b>.</p><p style='color:#A8B8A0;font-weight:bold'>FIT. TRAIN. THRIVE.</p></div></div>";
 const htmlBody=isDigital?digitalHtmlBody:standardHtmlBody;
 const payload={package:packageId,amount:Number(payment.amount||packageInfo.amount),currency:payment.currency||"ZAR",reference:ref,environment:"test"};
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":customer"+(isDigital?(digitalDeliveryReady?":digital-ready":":digital-pending"):""),membership?"membership_activation_customer":isDigital?"digital_purchase_customer":"programme_purchase_customer",email,subject,textBody,htmlBody,{...payload,digitalDeliveryReady});
 const deliveryNote=isDigital?(digitalDeliveryReady?"DIGITAL app entitlement sync completed. Resources are available after the member signs in.":"WARNING: verified DIGITAL purchase is recorded, but member-app entitlement sync is not confirmed. Do not ask the customer to pay again; retry fulfilment."):"The app entitlement sync completed before this notification was queued.";
 const internalSubject="FTRIVA "+(membership?"membership activated":isDigital?(digitalDeliveryReady?"DIGITAL fulfilment ready":"DIGITAL fulfilment pending"):"programme purchase confirmed")+" — "+packageId;
 const internalText=["A verified FTRIVA "+(membership?"membership activation":"purchase")+" has completed.","Package: "+packageId,"Amount: R"+amount,"Reference: "+ref,"Environment: TEST",deliveryNote].join(String.fromCharCode(10));
 const internalHtml="<div style='font-family:Arial,sans-serif;color:#101D2B'><h2>FTRIVA "+(membership?"membership activated":isDigital?(digitalDeliveryReady?"DIGITAL fulfilment ready":"DIGITAL fulfilment pending"):"purchase confirmed")+"</h2><p>Package: <b>"+emailEscape(packageId)+"</b></p><p>Amount: <b>R"+amount+"</b></p><p>Reference: "+emailEscape(ref)+"</p><p>Environment: TEST</p><p>"+emailEscape(deliveryNote)+"</p></div>";
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":internal"+(isDigital?(digitalDeliveryReady?":digital-ready":":digital-pending"):""),membership?"membership_activation_internal":isDigital?"digital_purchase_internal":"programme_purchase_internal","ftrivafitness@gmail.com",internalSubject,internalText,internalHtml,{...payload,digitalDeliveryReady});
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
  let memberSync = { synced: false };
  try {
    memberSync = await syncMemberApp(env, { kind: "purchase", reference: safeText(payment.reference, 160), email: customerEmail, packageCode: packageId, amountMinor: Number(payment.amount), currency: payment.currency || "ZAR", paidAt: payment.paid_at || payment.paidAt || null, channel: safeText(payment.channel, 40) }) || { synced: false };
  } catch (error) {
    console.error("FTRIVA purchase saved but member-app sync is pending:", error?.message || "Unknown sync error");
    memberSync = { synced: false, error: String(error?.message || "Member app sync failed").slice(0, 300) };
  }
  return memberSync;
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
  await syncMemberApp(env, { kind: "assessment", email: customerEmail, paymentReference: payment.reference, packageCode: packageId, assessment, submittedAt: record.submitted_at, requiresManualReview: assessmentValidation?.requiresManualReview === true });
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
        { display_name: "FTRIVA package", variable_name: "ftriva_package", value: packageId }
      ],
      ftriva_package: packageId,
      customer_name: fullName,
      phone,
      environment: env.ENVIRONMENT || "test",
      cancel_action: `${new URL(request.url).origin}/start-assessment.html?package=${encodeURIComponent(packageId)}&cancelled=1`
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
      return json({ error: "We could not confirm an active DIGITAL purchase for this link. Please contact FTRIVA." }, 403);
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
    let memberSync = { synced: false };
    try {
      memberSync = await savePurchase(payment, packageId, env) || { synced: false };
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
    const digitalDeliveryReady = packageId === "DIGITAL" && memberSync?.synced === true;
    await sendFtrivaPurchaseEmails(env, payment, packageId, packageInfo, verifiedMembershipCode, digitalDeliveryReady);
    return json({
      verified: true,
      recorded: true,
      ...packageInfo.type === "monthly" ? { membershipRecorded: true } : {},
      ...packageId === "DIGITAL" ? { digitalDeliveryReady: true } : {},
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
  if (!reference) return json({ verified: false, error: "The original Paystack transaction reference is required." },400);
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
            amount: Number(data.amount || data.plan?.amount || packaggeInfo.amount),
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
    const overridePath = url.pathname === "/" ? "/index.html" : url.pathname;
    if (request.method === "GET" && FTRIVA_HTML_OVERRIDES[overridePath]) return new Response(FTRIVA_HTML_OVERRIDES[overridePath], { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    if (request.method === "GET" && url.pathname === "/styles.css") return new Response(FTRIVA_CSS, { headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    if (request.method === "GET" && url.pathname === "/app.js") { return new Response(FTRIVA_APP_JS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }
    if (request.method === "GET" && url.pathname === "/my-account") {
      const appUrl = safeText(env.FTRIVA_APP_URL, 500) || ((env.ENVIRONMENT || "test").toLowerCase() === "test" ? "https://app-test.ftriva.com" : "https://app.ftriva.com");
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
