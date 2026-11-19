const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const menu = $('.menu-toggle');
if (menu) menu.addEventListener('click', () => $('.nav-links')?.classList.toggle('open'));
const current = location.pathname.split('/').pop() || 'index.html';
$$('.nav-links a').forEach(a => { if (a.getAttribute('href') === current) a.classList.add('active'); });

const quizForm = $('#recommendation-form');
if (quizForm) {
  quizForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(quizForm);
    const ongoing = data.get('coaching') === 'ongoing' || data.get('reviews') === 'yes' || data.get('support') === 'high';
    const result = $('#recommendation-result');
    result.classList.remove('hidden');
    result.innerHTML = ongoing
      ? `<span class="recommend-label">Recommended for you</span><h3>Monthly membership — from R249/month</h3><p>Your answers suggest that ongoing programming and regular progress support may suit your goals. You can still choose the once-off programme if you prefer.</p><a class="btn btn-bronze" href="start-assessment.html?package=monthly">Choose monthly membership</a> <a class="btn btn-dark" href="start-assessment.html?package=once_off">Choose once-off</a>`
      : `<span class="recommend-label">Recommended for you</span><h3>Once-off programme — from R299</h3><p>Your answers suggest that a focused 4–8 week programme may be a good starting point. You can still choose ongoing membership if you prefer.</p><a class="btn btn-bronze" href="start-assessment.html?package=once_off">Choose once-off programme</a> <a class="btn btn-dark" href="start-assessment.html?package=monthly">Choose monthly membership</a>`;
    result.scrollIntoView({behavior:'smooth',block:'center'});
  });
}

const checkoutForm = $('#checkout-form');
if (checkoutForm) {
  const packageField = $('#package');
  const selected = new URLSearchParams(location.search).get('package');
  if (selected && packageField) packageField.value = selected;
  checkoutForm.addEventListener('submit', async e => {
    e.preventDefault();
    const button = $('button[type="submit"]', checkoutForm), message = $('#checkout-message');
    message.className = ''; message.textContent = '';
    button.disabled = true; button.textContent = 'Connecting to secure checkout…';
    try {
      const payload = Object.fromEntries(new FormData(checkoutForm).entries());
      const response = await fetch('/api/payment/initialize', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to start checkout.');
      sessionStorage.setItem('ftriva_checkout_email', payload.email);
      sessionStorage.setItem('ftriva_checkout_name', payload.fullName);
      sessionStorage.setItem('ftriva_checkout_package', payload.package);
      location.href = result.authorizationUrl;
    } catch (err) {
      message.className = 'error'; message.textContent = err.message;
      button.disabled = false; button.textContent = 'Continue to secure payment';
    }
  });
}

const callbackMessage = $('#callback-message');
if (callbackMessage) {
  const reference = new URLSearchParams(location.search).get('reference') || new URLSearchParams(location.search).get('trxref');
  if (!reference) callbackMessage.innerHTML = '<div class="error">No payment reference was found. Please contact FTRIVA before trying again.</div>';
  else {
    (async () => {
      callbackMessage.innerHTML = '<p>Verifying your payment securely…</p>';
      try {
        const response = await fetch('/api/payment/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reference})});
        const result = await response.json();
        if (!response.ok || !result.verified) throw new Error(result.error || 'Payment could not be verified.');
        sessionStorage.setItem('ftriva_verified_reference', result.reference);
        sessionStorage.setItem('ftriva_verified_package', result.package);
        callbackMessage.innerHTML = `<div class="success"><strong>Payment verified.</strong><p>Your payment was successfully verified. You can now complete your detailed fitness assessment.</p><a class="btn btn-dark" href="assessment.html">Continue to fitness assessment</a></div>`;
      } catch (err) { callbackMessage.innerHTML = `<div class="error"><strong>Payment not verified.</strong><p>${escapeHtml(err.message)}</p><p>If money was deducted, do not pay again until the transaction has been checked.</p><a href="mailto:ftrivafitness@gmail.com">Contact FTRIVA</a></div>`; }
    })();
  }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

const assessmentForm = $('#assessment-form');
if (assessmentForm) {
  const reference = sessionStorage.getItem('ftriva_verified_reference');
  if (!reference) {
    assessmentForm.classList.add('hidden');
    $('#assessment-locked')?.classList.remove('hidden');
  } else {
    $('#payment-reference').value = reference;
    $('#assessment-package').textContent = sessionStorage.getItem('ftriva_verified_package') === 'monthly' ? 'Monthly membership' : 'Once-off programme';
  }
  $$('[data-conditional]').forEach(el => {
    const source = el.dataset.conditional;
    const update = () => { const target = document.getElementById(el.dataset.target); if (target) target.classList.toggle('hidden', !el.checked); };
    $$(`[name="${source}"]`).forEach(input => input.addEventListener('change', update)); update();
  });
  assessmentForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type="submit"]', assessmentForm), msg = $('#assessment-message');
    btn.disabled = true; btn.textContent = 'Submitting securely…'; msg.className=''; msg.textContent='';
    const fd = new FormData(assessmentForm); const data = {};
    for (const [key,value] of fd.entries()) { if (key === 'paymentReference') continue; if (key.endsWith('[]')) { const k=key.slice(0,-2); (data[k] ||= []).push(value); } else if (data[key] !== undefined) { data[key] = Array.isArray(data[key]) ? [...data[key],value] : [data[key],value]; } else data[key]=value; }
    const assessment = {
      personal:{fullName:data.fullName,email:data.email,phone:data.phone,dateOfBirth:data.dateOfBirth,country:data.country,communication:data.communication,guardianName:data.guardianName,guardianEmail:data.guardianEmail},
      goals:{primary:data.primaryGoal,secondary:data.secondaryGoal,target:data.target,motivation:data.motivation},
      trainingHistory:{structured:data.structuredTraining,experience:data.experience,trainingTypes:data.trainingTypes,lastConsistent:data.lastConsistent},
      currentActivity:{activityLevel:data.activityLevel,daysPerWeek:data.daysPerWeek,activities:data.activities,fitnessLevel:data.fitnessLevel,height:data.height,weight:data.weight},
      health:{injuryOrPain:data.injuryOrPain,injuryDetails:data.injuryDetails,conditions:data.conditions,medication:data.medication,restrictions:data.restrictions,warningSymptoms:data.warningSymptoms,avoidMovements:data.avoidMovements},
      equipment:{environment:data.environment,equipment:data.equipment,access:data.access,limitations:data.limitations},
      schedule:{sessions:data.sessions,duration:data.duration,days:data.days,sport:data.sport,restPreference:data.restPreference},
      preferences:{styles:data.styles,favouriteExercises:data.favouriteExercises,dislikedExercises:data.dislikedExercises,sessionStyle:data.sessionStyle},
      startDate:data.startDate === "specific_date" ? data.desiredStartDate : data.startDate, startDatePreference:data.startDate, additionalComments:data.additionalComments, consents:{accurate:data.consentAccurate,privacy:data.consentPrivacy,onlineScope:data.consentScope,guardian:data.guardianConsent}
    };
    try {
      const response = await fetch('/api/assessment/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({paymentReference:reference,assessment})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error + (result.detail ? ` ${result.detail}` : ''));
      msg.className='success'; msg.textContent='Thank you. Your assessment has been submitted. FTRIVA will review your information and prepare your programme.';
      assessmentForm.reset(); sessionStorage.removeItem('ftriva_verified_reference');
    } catch(err) { msg.className='error'; msg.textContent=err.message; }
    btn.disabled=false; btn.textContent='Submit my assessment';
  });
}
