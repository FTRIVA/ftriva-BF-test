
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const menu = $('.menu-toggle');
if (menu) menu.addEventListener('click', () => $('.nav-links')?.classList.toggle('open'));

const current = location.pathname.split('/').pop() || 'index.html';
$$('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === current) a.classList.add('active');
});

const PACKAGE_INFO = {
  START: {name:'START',price:'R199',regular:'R299',type:'once_off'},
  PROGRESS: {name:'PROGRESS',price:'R399',regular:'R549',type:'once_off'},
  PERFORMANCE: {name:'PERFORMANCE',price:'R299',regular:'R399',type:'once_off'},
  DIGITAL: {name:'DIGITAL',price:'R49',regular:'R149',type:'once_off'},
  ESSENTIAL: {name:'ESSENTIAL',price:'R249 / month',type:'monthly'},
  PLUS: {name:'PLUS',price:'R399 / month',type:'monthly'},
  ELITE: {name:'ELITE',price:'R599 / month',type:'monthly'}
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));
}

// PACKAGE RECOMMENDATION
const quizForm = $('#recommendation-form');

if (quizForm) {
  quizForm.addEventListener('submit', e => {
    e.preventDefault();

    const data = new FormData(quizForm);
    const goal = data.get('goal');
    const ongoing = data.get('coaching') === 'ongoing';

    let id = ongoing
      ? 'PLUS'
      : goal === 'performance'
        ? 'PERFORMANCE'
        : data.get('experience') === 'beginner' || data.get('experience') === 'returning'
          ? 'START'
          : 'PROGRESS';

    const p = PACKAGE_INFO[id];
    const result = $('#recommendation-result');

    result.classList.remove('hidden');

    result.innerHTML = `
      <span class="recommend-label">Suggested for you</span>
      <h3>${p.name} — ${p.price}</h3>
      <p>Based on your answers, ${p.name} may be a useful starting point. This is a recommendation, not a restriction — you can choose any package.</p>
      <a class="btn btn-bronze" href="start-assessment.html?package=${id}">Choose ${id}</a>
      <div class="recommendation-package-list">
        <a href="#packages">Compare all seven packages</a>
      </div>
    `;

    result.scrollIntoView({behavior:'smooth',block:'center'});
  });
}

// PACKAGE CHECKOUT
const checkoutForm = $('#checkout-form');

if (checkoutForm) {
  const id = new URLSearchParams(location.search).get('package')?.toUpperCase();
  const p = PACKAGE_INFO[id];
  const field = $('#package');

  if (!p) {
    $('#selected-package-name').textContent = 'No package selected';
    $('#selected-package-price').textContent = 'Please return to the packages page and choose one.';
    checkoutForm.classList.add('hidden');
  } else {
    field.value = id;
    $('#selected-package-name').textContent = p.name;
    $('#selected-package-price').textContent =
      p.price + (p.regular ? ` · Black Friday (regular price ${p.regular})` : '');
  }

  checkoutForm.addEventListener('submit', async e => {
    e.preventDefault();

    const button = $('button[type="submit"]', checkoutForm);
    const message = $('#checkout-message');

    message.className = '';
    message.textContent = '';
    button.disabled = true;
    button.textContent = 'Connecting to secure checkout…';

    try {
      const payload = Object.fromEntries(new FormData(checkoutForm).entries());

      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Unable to start checkout.');

      location.href = result.authorizationUrl;

    } catch(err) {
      message.className = 'error';
      message.textContent = err.message;
      button.disabled = false;
      button.textContent = 'Continue to secure Paystack checkout';
    }
  });
}

// FOUNDING 10 CLAIM
const foundingForm = $('#founding10-form');

if (foundingForm) {
  foundingForm.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = $('button[type="submit"]', foundingForm);
    const msg = $('#founding10-message');

    msg.className = '';
    msg.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Checking availability…';

    try {
      const payload = Object.fromEntries(new FormData(foundingForm).entries());

      const response = await fetch('/api/founding10/claim', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.claimed) {
        throw new Error(result.error || 'A Founding 10 place could not be confirmed.');
      }

      location.href = `assessment.html?claim=${encodeURIComponent(result.claimToken)}&package=${encodeURIComponent(payload.package)}`;

    } catch(err) {
      msg.className = 'error';
      msg.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Claim my free programme';
    }
  });
}

// PAYSTACK PAYMENT CALLBACK
const callbackMessage = $('#callback-message');

if (callbackMessage) {
  const params = new URLSearchParams(location.search);
  const reference = params.get('reference') || params.get('trxref');

  if (!reference) {
    callbackMessage.innerHTML = '<div class="error">No payment reference was found. Please contact FTRIVA before trying again.</div>';
  } else {
    (async () => {
      callbackMessage.innerHTML = '<p>Verifying your payment securely…</p>';

      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {'content-type':'application/json'},
          body: JSON.stringify({reference})
        });

        const result = await response.json();

        if (result.verified && !result.recorded) {
          callbackMessage.innerHTML = `
            <div class="error">
              <strong>Your payment is verified, but the purchase record needs attention.</strong>
              <p>${escapeHtml(result.error || 'Do not pay again. Please contact FTRIVA so the verified payment can be reconciled.')}</p>
              <a href="mailto:ftrivafitness@gmail.com">Contact FTRIVA</a>
            </div>`;
          return;
        }

        if (!response.ok || !result.verified) {
          throw new Error(result.error || 'Payment could not be verified.');
        }

        sessionStorage.setItem('ftriva_verified_reference', result.reference);
        sessionStorage.setItem('ftriva_verified_package', result.package);

        if (result.package === 'DIGITAL') {
          callbackMessage.innerHTML = `
            <div class="success">
              <strong>Payment verified.</strong>
              <p>Your DIGITAL purchase has been recorded. FTRIVA will contact you at the email address used at checkout with delivery details.</p>
              <a class="btn btn-dark" href="index.html">Return to FTRIVA</a>
            </div>`;
        } else {
          callbackMessage.innerHTML = `
            <div class="success">
              <strong>Payment verified.</strong>
              <p>Your ${escapeHtml(result.package)} purchase has been recorded. You can now complete your detailed fitness assessment.</p>
              <a class="btn btn-dark" href="assessment.html">Continue to fitness assessment</a>
            </div>`;
        }

      } catch(err) {
        callbackMessage.innerHTML = `
          <div class="error">
            <strong>Payment not verified.</strong>
            <p>${escapeHtml(err.message)}</p>
            <p>If money was deducted, do not pay again until the transaction has been checked.</p>
            <a href="mailto:ftrivafitness@gmail.com">Contact FTRIVA</a>
          </div>`;
      }
    })();
  }
}

// DETAILED FITNESS ASSESSMENT
const assessmentForm = $('#assessment-form');

if (assessmentForm) {
  const params = new URLSearchParams(location.search);
  const claimToken = params.get('claim');
  const reference = sessionStorage.getItem('ftriva_verified_reference');

  const claimField = $('#founding-claim-token');
  const lockedMessage = $('#assessment-locked');

  // Keep the form hidden until a valid payment or Founding 10 claim exists.
  if (claimToken) {
    if (claimField) claimField.value = claimToken;

    lockedMessage?.classList.add('hidden');
    assessmentForm.classList.remove('hidden');

    $('#assessment-package').textContent =
      'FOUNDING 10 — ' + (params.get('package') || 'Free personalised programme');

  } else if (reference) {
    $('#payment-reference').value = reference;

    $('#assessment-package').textContent =
      sessionStorage.getItem('ftriva_verified_package') || 'Selected FTRIVA package';

    lockedMessage?.classList.add('hidden');

    // FIX: Explicitly reveal the assessment form after verified payment.
    assessmentForm.classList.remove('hidden');

  } else {
    assessmentForm.classList.add('hidden');
    lockedMessage?.classList.remove('hidden');
  }

  // CONDITIONAL ASSESSMENT FIELDS
  $$('[data-conditional]').forEach(el => {
    const source = el.dataset.conditional;

    const update = () => {
      const target = document.getElementById(el.dataset.target);

      if (target) {
        target.classList.toggle('hidden', !el.checked);
      }
    };

    $$(`[name="${source}"]`).forEach(input => {
      input.addEventListener('change', update);
    });

    update();
  });

  // ASSESSMENT SUBMISSION
  assessmentForm.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = $('button[type="submit"]', assessmentForm);
    const msg = $('#assessment-message');

    btn.disabled = true;
    btn.textContent = 'Submitting securely…';
    msg.className = '';
    msg.textContent = '';

    const fd = new FormData(assessmentForm);
    const data = {};

    for (const [key, value] of fd.entries()) {
      if (['paymentReference','foundingClaimToken'].includes(key)) continue;

      if (key.endsWith('[]')) {
        const k = key.slice(0, -2);
        (data[k] ||= []).push(value);
      } else if (data[key] !== undefined) {
        data[key] = Array.isArray(data[key])
          ? [...data[key], value]
          : [data[key], value];
      } else {
        data[key] = value;
      }
    }

    const assessment = {
      personal: {
        fullName:data.fullName,
        email:data.email,
        phone:data.phone,
        dateOfBirth:data.dateOfBirth,
        country:data.country,
        communication:data.communication,
        guardianName:data.guardianName,
        guardianEmail:data.guardianEmail
      },
      goals: {
        primary:data.primaryGoal,
        secondary:data.secondaryGoal,
        target:data.target,
        motivation:data.motivation
      },
      trainingHistory: {
        structured:data.structuredTraining,
        experience:data.experience,
        trainingTypes:data.trainingTypes,
        lastConsistent:data.lastConsistent
      },
      currentActivity: {
        activityLevel:data.activityLevel,
        daysPerWeek:data.daysPerWeek,
        activities:data.activities,
        fitnessLevel:data.fitnessLevel,
        height:data.height,
        weight:data.weight
      },
      health: {
        injuryOrPain:data.injuryOrPain,
        injuryDetails:data.injuryDetails,
        conditions:data.conditions,
        medication:data.medication,
        restrictions:data.restrictions,
        warningSymptoms:data.warningSymptoms,
        avoidMovements:data.avoidMovements
      },
      equipment: {
        environment:data.environment,
        equipment:data.equipment,
        access:data.access,
        limitations:data.limitations
      },
      schedule: {
        sessions:data.sessions,
        duration:data.duration,
        days:data.days,
        sport:data.sport,
        restPreference:data.restPreference
      },
      preferences: {
        styles:data.styles,
        favouriteExercises:data.favouriteExercises,
        dislikedExercises:data.dislikedExercises,
        sessionStyle:data.sessionStyle
      },
      startDate:data.startDate === 'specific_date'
        ? data.desiredStartDate
        : data.startDate,
      startDatePreference:data.startDate,
      additionalComments:data.additionalComments,
      consents: {
        accurate:data.consentAccurate,
        privacy:data.consentPrivacy,
        onlineScope:data.consentScope,
        guardian:data.guardianConsent
      }
    };

    try {
      const payload = claimToken
        ? {claimToken, assessment}
        : {paymentReference:reference, assessment};

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error + (result.detail ? ` ${result.detail}` : ''));
      }

      msg.className = 'success';
      msg.textContent = 'Thank you. Your assessment has been submitted successfully. FTRIVA will review your information and prepare your programme.';

      assessmentForm.reset();
      sessionStorage.removeItem('ftriva_verified_reference');

    } catch(err) {
      msg.className = 'error';
      msg.textContent = err.message;
    }

    btn.disabled = false;
    btn.textContent = 'Submit my assessment';
  });
}
