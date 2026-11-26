// Pure validation + normalization for the temporary feedback form.
// Returns { error } on bad input, { value } with cleaned fields on success.
export const FEEDBACK_CATEGORIES = ['Bug', 'Suggestion', 'Other'];
export const MAX_FEEDBACK_MESSAGE = 2000;

export function validateFeedbackInput(body = {}) {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return { error: 'Please write your feedback before sending.' };
  if (message.length > MAX_FEEDBACK_MESSAGE) {
    return { error: 'Feedback must be 2000 characters or less.' };
  }
  return {
    value: {
      page: typeof body.page === 'string' ? body.page.trim().slice(0, 500) || '/' : '/',
      category: FEEDBACK_CATEGORIES.includes(body.category) ? body.category : 'Other',
      message,
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '',
    },
  };
}
