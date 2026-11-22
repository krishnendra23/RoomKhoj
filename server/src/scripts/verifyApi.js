import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Configure test environment before importing app/env
process.env.NODE_ENV = 'test';
process.env.STORAGE_PROVIDER = 'local';
process.env.OTP_PROVIDER = '';
process.env.JWT_SECRET = 'test-verification-secret-key-roomkhoj';

const { connectDB, disconnectDB } = await import('../config/db.js');
const { default: app } = await import('../app.js');
const { seedLocalities, seedAdminUser, seedPilotListings } = await import('./seedData.js');

let mongod;
let server;
let baseUrl;

async function req(path, { method = 'GET', token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, raw: text };
}

async function runTests() {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  await seedLocalities();
  const adminUser = await seedAdminUser({
    mobile: '9999999999',
    password: 'Admin@1234',
  });
  await seedPilotListings(adminUser);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  console.log(`\n[Verify] Running end-to-end API checks against ${baseUrl}...\n`);

  // 1. Health & capabilities
  const health = await req('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.capabilities.otpEnabled, false);
  console.log('✓ 1. Health check & honest capability reporting passed');

  // 2. Public homepage & localities (no login required)
  const home = await req('/api/properties/homepage?city=Prayagraj');
  assert.equal(home.status, 200);
  assert.ok(home.json.data.recentlyAdded.length > 0, 'Expected approved rooms on homepage');
  assert.ok(home.json.data.popularLocations.length >= 6, 'Expected Prayagraj popular localities');
  assert.equal(
    home.json.data.recentlyAdded[0].address.exactAddress,
    undefined,
    'Public listing must NOT expose exactAddress'
  );
  console.log('✓ 2. Public homepage, Prayagraj localities & exactAddress privacy check passed');

  // 3. Public registration blocks admin role escalation
  const adminAttempt = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Fake Admin',
      mobile: '9876500001',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'admin',
      isDirectOwnerDeclared: true,
    },
  });
  assert.equal(adminAttempt.status, 400, 'Public registration must reject admin role');
  console.log('✓ 3. Security: public admin role escalation blocked (400)');

  // 4. Owner registration requires direct owner declaration
  const brokerAttempt = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Broker Attempt',
      mobile: '9876500002',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'owner',
      isDirectOwnerDeclared: false,
    },
  });
  assert.equal(brokerAttempt.status, 400, 'Owner without direct declaration must be rejected');

  // Register genuine Owner A & Owner B & Seeker
  const ownerAReg = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Owner Alpha',
      mobile: '9876500010',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'owner',
      isDirectOwnerDeclared: true,
    },
  });
  assert.equal(ownerAReg.status, 201);
  const ownerAToken = ownerAReg.json.data.token;

  const ownerBReg = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Owner Beta',
      mobile: '9876500020',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'owner',
      isDirectOwnerDeclared: true,
    },
  });
  assert.equal(ownerBReg.status, 201);
  const ownerBToken = ownerBReg.json.data.token;

  const seekerReg = await req('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Prayagraj Student',
      mobile: '9876500030',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'seeker',
    },
  });
  assert.equal(seekerReg.status, 201);
  const seekerToken = seekerReg.json.data.token;
  console.log('✓ 4. Owner & Seeker registration + direct-owner declaration checks passed');

  // 5. Unconfigured OTP returns 503 (never simulates fake success)
  const otpRes = await req('/api/auth/send-otp', { method: 'POST', token: ownerAToken });
  assert.equal(otpRes.status, 503, 'Unconfigured OTP must return 503, not fake success');
  console.log('✓ 5. Unconfigured OTP refuses fake simulation (503)');

  // 6. Image upload validation (rejects non-image, accepts valid PNG)
  const badForm = new FormData();
  badForm.append('photos', new Blob(['not-an-image'], { type: 'text/plain' }), 'malicious.txt');
  const badUpload = await req('/api/uploads/property-photos', {
    method: 'POST',
    token: ownerAToken,
    formData: badForm,
  });
  assert.equal(badUpload.status, 400, 'Non-image file upload must be rejected');

  // Minimal valid 1x1 PNG buffer
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  const goodForm = new FormData();
  goodForm.append('photos', new Blob([pngBytes], { type: 'image/png' }), 'room.png');
  const goodUpload = await req('/api/uploads/property-photos', {
    method: 'POST',
    token: ownerAToken,
    formData: goodForm,
  });
  assert.equal(goodUpload.status, 201);
  const uploadedPhoto = goodUpload.json.data.photos[0];
  assert.ok(uploadedPhoto.url && uploadedPhoto.publicId);
  console.log('✓ 6. Image upload MIME validation & upload passed');

  // 7. Contradictory tenant preferences (Girls Only + Couples) rejected
  const baseProperty = {
    title: 'Clean Student Room Near Allahpur Chauraha',
    description:
      'Well-lit single room with attached bathroom, RO water, and 24x7 water supply near Allahpur market.',
    propertyType: 'Single Room',
    monthlyRent: 4500,
    securityDeposit: 4500,
    negotiable: true,
    brokerage: 0,
    city: 'Prayagraj',
    locality: 'Allahpur',
    address: {
      publicArea: 'Matyara Road, Allahpur',
      landmark: 'Near Shiv Mandir',
      exactAddress: 'House 77-A, Private Lane',
      pincode: '211006',
    },
    furnishing: 'Semi-Furnished',
    rooms: 1,
    bathrooms: 1,
    kitchen: 'Shared Kitchen',
    floor: '1st Floor',
    amenities: {
      attachedBathroom: true,
      parking: true,
      wifi: true,
      ac: false,
      waterSupply: '24x7',
    },
    tenantPreferences: {
      tenantTypes: ['Students', 'Couples'],
      genderPreference: 'Girls Only',
      occupancy: ['Single Occupancy'],
      foodPreference: 'Vegetarian Only',
      smokingAllowed: false,
      petsAllowed: false,
      visitorsAllowed: 'Restricted',
      couplesAllowed: true,
    },
    photos: [{ url: uploadedPhoto.url, publicId: uploadedPhoto.publicId, isPrimary: true }],
    contactPhone: '9876500010',
    whatsappNumber: '9876500010',
    isDirectOwner: true,
  };

  const contradictoryRes = await req('/api/properties', {
    method: 'POST',
    token: ownerAToken,
    body: baseProperty,
  });
  assert.equal(
    contradictoryRes.status,
    400,
    'Contradictory tenant preferences must be rejected'
  );

  // Valid property creation -> status MUST be 'pending'
  baseProperty.tenantPreferences.tenantTypes = ['Students'];
  baseProperty.tenantPreferences.couplesAllowed = false;

  const createdRes = await req('/api/properties', {
    method: 'POST',
    token: ownerAToken,
    body: baseProperty,
  });
  assert.equal(createdRes.status, 201);
  const createdProp = createdRes.json.data.property;
  assert.equal(createdProp.status, 'pending', 'New listing must default to pending');
  console.log('✓ 7. Tenant preference contradiction check & pending property creation passed');

  // 8. Pending property hidden from public API
  const publicHidden = await req(`/api/properties/${createdProp.slug}`);
  assert.equal(publicHidden.status, 404, 'Pending listing must not be visible publicly');
  console.log('✓ 8. Pending listing hidden from public access (404)');

  // 9. Owner isolation: Owner B cannot modify or delete Owner A's listing
  const hijackAvail = await req(`/api/properties/${createdProp.id}/availability`, {
    method: 'PATCH',
    token: ownerBToken,
    body: { availability: 'rented' },
  });
  assert.equal(hijackAvail.status, 403, 'Owner B must not update Owner A listing');

  const hijackDelete = await req(`/api/properties/${createdProp.id}`, {
    method: 'DELETE',
    token: ownerBToken,
  });
  assert.equal(hijackDelete.status, 403, 'Owner B must not delete Owner A listing');

  // Non-admin cannot access admin endpoints
  const ownerAdminTry = await req('/api/admin/stats', { token: ownerAToken });
  assert.equal(ownerAdminTry.status, 403, 'Non-admin must be blocked from admin APIs');
  console.log('✓ 9. Owner isolation & admin RBAC protection verified (403)');

  // 10. Admin login & moderation approval workflow
  const adminLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { mobile: '9999999999', password: 'Admin@1234' },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.json.data.token;

  const pendingQueue = await req('/api/admin/properties?status=pending', { token: adminToken });
  assert.equal(pendingQueue.status, 200);
  const targetInQueue = pendingQueue.json.data.properties.find((p) => p.id === createdProp.id);
  assert.ok(targetInQueue, 'Pending listing must appear in admin moderation queue');
  assert.equal(
    targetInQueue.address.exactAddress,
    'House 77-A, Private Lane',
    'Admin must see exactAddress for moderation verification'
  );

  const approveRes = await req(`/api/admin/properties/${createdProp.id}/moderate`, {
    method: 'PATCH',
    token: adminToken,
    body: { action: 'approve' },
  });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.json.data.property.status, 'approved');

  // Now publicly visible & exactAddress masked!
  const publicVisible = await req(`/api/properties/${createdProp.slug}`);
  assert.equal(publicVisible.status, 200);
  assert.equal(publicVisible.json.data.property.address.exactAddress, undefined);
  console.log('✓ 10. Admin approval workflow & public visibility verified');

  // 11. Server-side search filters & pagination
  const searchRes = await req(
    '/api/properties?city=Prayagraj&locality=Allahpur&genderPreference=Girls+Only&wifi=true&attachedBathroom=true&sort=rent_asc'
  );
  assert.equal(searchRes.status, 200);
  assert.ok(
    searchRes.json.data.properties.some((p) => p.id === createdProp.id),
    'Approved listing must appear in matching server-side search results'
  );
  assert.ok(searchRes.json.data.nearbyLocalities.length > 0, 'Expected GeoJSON nearby localities');
  console.log('✓ 11. Server-side filtered search & GeoJSON nearby localities verified');

  // 12. Seeker favourites, listing report, & admin resolution
  const favToggle = await req(`/api/favourites/${createdProp.id}`, {
    method: 'POST',
    token: seekerToken,
  });
  assert.equal(favToggle.status, 201);
  assert.equal(favToggle.json.data.isFavourited, true);

  const reportRes = await req('/api/reports', {
    method: 'POST',
    token: seekerToken,
    body: {
      propertyId: createdProp.id,
      reason: 'Incorrect Rent or Details',
      description: 'Testing moderation report queue',
    },
  });
  assert.equal(reportRes.status, 201);

  const adminReports = await req('/api/admin/reports?status=open', { token: adminToken });
  assert.equal(adminReports.status, 200);
  assert.ok(adminReports.json.data.reports.length >= 1);

  const resolveRep = await req(`/api/admin/reports/${reportRes.json.data.reportId}`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'resolved', adminNote: 'Reviewed and verified with owner' },
  });
  assert.equal(resolveRep.status, 200);
  console.log('✓ 12. Favourites, reporting & admin report resolution verified');

  // 13. Dynamic XML sitemap includes approved slug
  const sitemapRes = await req('/sitemap.xml');
  assert.equal(sitemapRes.status, 200);
  assert.ok(sitemapRes.raw.includes(createdProp.slug), 'Sitemap must include approved property slug');
  console.log('✓ 13. Dynamic SEO /sitemap.xml verified');

  // Cleanup uploaded test file
  await req(`/api/properties/${createdProp.id}`, { method: 'DELETE', token: ownerAToken });

  console.log('\n✅ ALL 13 END-TO-END BACKEND & SECURITY WORKFLOWS PASSED!\n');
}

runTests()
  .catch((err) => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((r) => server.close(r));
    await disconnectDB();
    if (mongod) await mongod.stop();
  });
