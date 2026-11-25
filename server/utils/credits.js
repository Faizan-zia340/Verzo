// server/utils/credits.js
// Atomic credit reservation. Deducts `amount` credits ONLY if the user
// currently holds at least that many — a single conditional update, so two
// concurrent requests can never both pass on the same last credit.
// (The old creditCheck middleware only READ the balance, and the deduction
// happened after generation, so two concurrent requests both passed.)
// Returns the updated user, or null when the balance is insufficient.
//
// The store is built through a factory so tests can pass a fake model:
// createCreditStore(fakeUser).reserve(...) — see server/tests/billingIntegrity.test.js.
// The real User model is loaded lazily (dynamic import) so this module — and
// the tests — can be imported without mongoose installed. The public API is
// unchanged: reserve/refund still return promises.
export const createCreditStore = (UserModel) => ({
  reserve: (userId, amount = 1) =>
    UserModel.findOneAndUpdate(
      { _id: userId, credits: { $gte: amount } },
      { $inc: { credits: -amount } },
      { new: true },
    ),
  refund: (userId, amount = 1) =>
    UserModel.findByIdAndUpdate(userId, { $inc: { credits: amount } }, { new: true }),
});

let _creditStore = null;
const getCreditStore = async () => {
  if (!_creditStore) {
    const { default: User } = await import('../models/User.js');
    _creditStore = createCreditStore(User);
  }
  return _creditStore;
};

export const creditStore = {
  reserve: (userId, amount = 1) => getCreditStore().then((s) => s.reserve(userId, amount)),
  refund: (userId, amount = 1) => getCreditStore().then((s) => s.refund(userId, amount)),
};

export const reserveCredit = (userId, amount = 1) => creditStore.reserve(userId, amount);
export const refundCredit = (userId, amount = 1) => creditStore.refund(userId, amount);
