// server/tests/dataExport.test.js
// Tests the user data export builder with NO database: the same
// node:test + node:assert/strict pattern as server/tests/creditReset.test.js.
// Fake collections capture the filter they were queried with, so the tests
// prove the export only ever reads the requesting user's own rows.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserDataExport } from '../utils/dataExport.js';

// Fake Mongoose collection: find(filter) records the filter, then
// .sort().lean() resolves the canned rows.
const fakeCollection = (rows, seenFilters) => ({
  find: (filter) => {
    seenFilters.push(filter);
    return { sort: () => ({ lean: async () => rows }) };
  },
});

const profile = {
  name: 'Test User',
  email: 'test@example.com',
  credits: 12,
  subscription: 'free',
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
};

const generations = [
  {
    _id: 'g1',
    type: 'blog',
    subtype: '',
    prompt: 'Write about cats',
    output: 'Cats are great.',
    language: 'english_us',
    format: 'paragraphs',
    creditsUsed: 1,
    favorite: true,
    mediaUrl: 'https://res.cloudinary.com/demo/image/upload/v1/penlix/u1/cat.webp',
    mediaPublicId: 'penlix/u1/cat',
    mediaType: 'image',
    createdAt: new Date('2026-11-20T00:00:00.000Z'),
    updatedAt: new Date('2026-11-20T00:00:00.000Z'),
  },
  {
    _id: 'g2',
    type: 'email',
    subtype: 'follow-up',
    prompt: 'Follow up with Sara',
    output: 'Hi Sara,',
    language: 'english_us',
    format: 'paragraphs',
    creditsUsed: 1,
    favorite: false,
    mediaUrl: '',
    mediaPublicId: '',
    mediaType: '',
    createdAt: new Date('2026-11-21T00:00:00.000Z'),
    updatedAt: new Date('2026-11-21T00:00:00.000Z'),
  },
];

const feedbackRows = [
  { page: '/dashboard', category: 'Bug', message: 'The button overlaps.', createdAt: new Date('2026-11-22T00:00:00.000Z') },
];

const suggestionRows = [
  {
    word: 'hello',
    language: 'french',
    suggestedTranslation: 'bonjour',
    status: 'pending',
    createdAt: new Date('2026-11-23T00:00:00.000Z'),
  },
];

const buildModels = () => {
  const seen = { Content: [], Feedback: [], Suggestion: [] };
  return {
    seen,
    models: {
      Content: fakeCollection(generations, seen.Content),
      Feedback: fakeCollection(feedbackRows, seen.Feedback),
      Suggestion: fakeCollection(suggestionRows, seen.Suggestion),
    },
  };
};

describe('buildUserDataExport', () => {
  it('queries only the requesting user’s own rows', async () => {
    const { seen, models } = buildModels();
    await buildUserDataExport(models, 'user-123', profile);
    assert.deepEqual(seen.Content, [{ user: 'user-123' }]);
    assert.deepEqual(seen.Feedback, [{ user: 'user-123' }]);
    assert.deepEqual(seen.Suggestion, [{ suggestedBy: 'user-123' }]);
  });

  it('includes the profile, generations, feedback and suggestions', async () => {
    const { models } = buildModels();
    const out = await buildUserDataExport(models, 'user-123', profile);
    assert.equal(out.profile.name, 'Test User');
    assert.equal(out.profile.email, 'test@example.com');
    assert.equal(out.profile.credits, 12);
    assert.equal(out.profile.subscription, 'free');
    assert.equal(out.generations.length, 2);
    assert.equal(out.generations[0].type, 'blog');
    assert.equal(out.generations[0].prompt, 'Write about cats');
    assert.equal(out.feedback.length, 1);
    assert.equal(out.feedback[0].message, 'The button overlaps.');
    assert.equal(out.glossarySuggestions.length, 1);
    assert.equal(out.glossarySuggestions[0].suggestedTranslation, 'bonjour');
    assert.deepEqual(out.counts, { generations: 2, uploads: 1, feedback: 1, glossarySuggestions: 1 });
  });

  it('lists uploads as records only, from generations that have media', async () => {
    const { models } = buildModels();
    const out = await buildUserDataExport(models, 'user-123', profile);
    assert.equal(out.uploads.length, 1);
    assert.equal(out.uploads[0].mediaUrl, 'https://res.cloudinary.com/demo/image/upload/v1/penlix/u1/cat.webp');
    assert.equal(out.uploads[0].mediaPublicId, 'penlix/u1/cat');
    assert.equal(out.uploads[0].attachedToGeneration, 'g1');
    assert.ok(!('buffer' in out.uploads[0]) && !('data' in out.uploads[0]));
  });

  it('never includes a password hash, token or other sensitive field', async () => {
    const { models } = buildModels();
    const out = await buildUserDataExport(models, 'user-123', profile);
    const json = JSON.stringify(out);
    assert.doesNotMatch(json, /password/i);
    assert.doesNotMatch(json, /token/i);
    assert.doesNotMatch(json, /hash/i);
    assert.doesNotMatch(json, /stripe/i);
    assert.deepEqual(Object.keys(out.profile).sort(), [
      'credits',
      'email',
      'memberSince',
      'name',
      'subscription',
    ]);
  });

  it('returns empty sections and zero counts for a user with no data', async () => {
    const seen = { Content: [], Feedback: [], Suggestion: [] };
    const models = {
      Content: fakeCollection([], seen.Content),
      Feedback: fakeCollection([], seen.Feedback),
      Suggestion: fakeCollection([], seen.Suggestion),
    };
    const out = await buildUserDataExport(models, 'user-999', profile);
    assert.deepEqual(out.generations, []);
    assert.deepEqual(out.uploads, []);
    assert.deepEqual(out.feedback, []);
    assert.deepEqual(out.glossarySuggestions, []);
    assert.deepEqual(out.counts, { generations: 0, uploads: 0, feedback: 0, glossarySuggestions: 0 });
    assert.ok(out.exportedAt);
  });
});
