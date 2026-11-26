import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedbackInput, MAX_FEEDBACK_MESSAGE } from '../utils/feedbackValidation.js';

describe('validateFeedbackInput', () => {
  it('accepts a valid report and trims fields', () => {
    const { error, value } = validateFeedbackInput({
      page: ' /dashboard ', category: 'Bug', message: '  The button does nothing. ', name: ' Tester ',
    });
    assert.equal(error, undefined);
    assert.equal(value.page, '/dashboard');
    assert.equal(value.category, 'Bug');
    assert.equal(value.message, 'The button does nothing.');
    assert.equal(value.name, 'Tester');
  });

  it('defaults page to / and category to Other', () => {
    const { error, value } = validateFeedbackInput({ message: 'Nice site.' });
    assert.equal(error, undefined);
    assert.equal(value.page, '/');
    assert.equal(value.category, 'Other');
    assert.equal(value.name, '');
  });

  it('normalizes an unknown category to Other', () => {
    const { value } = validateFeedbackInput({ message: 'Hi', category: 'Complaint' });
    assert.equal(value.category, 'Other');
  });

  it('rejects a missing or blank message', () => {
    assert.match(validateFeedbackInput({}).error, /write your feedback/);
    assert.match(validateFeedbackInput({ message: '   ' }).error, /write your feedback/);
    assert.match(validateFeedbackInput({ message: 42 }).error, /write your feedback/);
  });

  it('rejects a message over 2000 characters', () => {
    const { error } = validateFeedbackInput({ message: 'x'.repeat(MAX_FEEDBACK_MESSAGE + 1) });
    assert.match(error, /2000 characters/);
  });

  it('caps page and name lengths', () => {
    const { value } = validateFeedbackInput({
      message: 'Hi', page: `/${'p'.repeat(600)}`, name: 'n'.repeat(150),
    });
    assert.equal(value.page.length, 500);
    assert.equal(value.name.length, 100);
  });
});
