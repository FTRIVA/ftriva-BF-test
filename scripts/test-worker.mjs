import assert from 'node:assert/strict';
import worker from '../src/index.js';

const env = {
  ENVIRONMENT: 'test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SECRET_KEY: 'test-only-placeholder',
  PAYSTACK_SECRET_KEY: 'test-only-placeholder'
};
const call = (path, method = 'GET', body) => worker.fetch(
  new Request('https://ftriva-test.example' + path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  }),
  env,
  {}
);

const healthResponse = await call('/api/health');
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.equal(health.ok, true);
assert.equal(health.environment, 'test');
assert.equal(health.supabaseConfigured, true);
assert.equal(health.paystackConfigured, true);

const optionsResponse = await call('/api/payment/initialize', 'OPTIONS');
assert.equal(optionsResponse.status, 204);
assert.equal(optionsResponse.headers.get('access-control-allow-origin'), '*');

const initializeResponse = await call('/api/payment/initialize', 'POST', {});
assert.equal(initializeResponse.status, 400);

const verifyResponse = await call('/api/payment/verify', 'POST', {});
assert.equal(verifyResponse.status, 400);

const foundingResponse = await call('/api/founding10/claim', 'POST', {
  package: 'ELITE', fullName: 'Test User', email: 'test@example.com', phone: '0000000000'
});
assert.equal(foundingResponse.status, 400);

const assessmentResponse = await call('/api/assessment/submit', 'POST', {});
assert.equal(assessmentResponse.status, 400);

const validAssessment = {
  personal: {
    fullName: 'Test User', dateOfBirth: '2000-01-01', email: 'test@example.com',
    phone: '0712345678', country: 'South Africa', communication: 'Email',
    under18: 'no', guardianConsent: false
  },
  goals: { primary: 'General fitness' },
  trainingHistory: { structured: 'Yes', experience: 'Beginner' },
  currentActivity: { activityLevel: 'Lightly active' },
  health: { injuryOrPain: 'no', warningSymptoms: 'No', restrictions: '' },
  equipment: { environment: 'Home with no equipment' },
  schedule: { sessions: '3', duration: '30–45 minutes' },
  startDatePreference: 'as_soon_as_available',
  startDate: 'as_soon_as_available',
  consents: { accurate: 'yes', privacy: 'yes', onlineScope: 'yes' }
};
const missingConsent = structuredClone(validAssessment);
missingConsent.consents.privacy = 'no';
const missingConsentResponse = await call('/api/assessment/submit', 'POST', { assessment: missingConsent });
assert.equal(missingConsentResponse.status, 400);

const validAdultWithoutPayment = await call('/api/assessment/submit', 'POST', { assessment: validAssessment });
assert.equal(validAdultWithoutPayment.status, 403);

const minorWithoutGuardian = structuredClone(validAssessment);
minorWithoutGuardian.personal.dateOfBirth = '2012-01-01';
minorWithoutGuardian.personal.under18 = 'yes';
const minorResponse = await call('/api/assessment/submit', 'POST', { assessment: minorWithoutGuardian });
assert.equal(minorResponse.status, 400);

const minorWithGuardian = structuredClone(minorWithoutGuardian);
minorWithGuardian.personal.guardianName = 'Guardian Test';
minorWithGuardian.personal.guardianEmail = 'guardian@example.com';
minorWithGuardian.personal.guardianConsent = true;
minorWithGuardian.consents.guardian = 'yes';
const validMinorWithoutPayment = await call('/api/assessment/submit', 'POST', { assessment: minorWithGuardian });
assert.equal(validMinorWithoutPayment.status, 403);

const pastStartDate = structuredClone(validAssessment);
pastStartDate.startDatePreference = 'specific_date';
pastStartDate.startDate = '2020-01-01';
const pastStartResponse = await call('/api/assessment/submit', 'POST', { assessment: pastStartDate });
assert.equal(pastStartResponse.status, 400);

const unknownResponse = await call('/api/not-a-real-route');
assert.equal(unknownResponse.status, 404);

const accountResponse = await call('/my-account');
assert.equal(accountResponse.status, 503);
assert.match(await accountResponse.text(), /Your account portal is being prepared/);

console.log('FTRIVA Worker smoke tests passed: health, CORS, checkout validation, payment validation, Founding 10 validation, adult/minor consent, assessment completeness, date validation, unknown routes and account placeholder.');
