// Delete-user safeguards for the admin panel.
// Pure function (no DB access) so the rules are unit-testable.
// Returns null when the delete is allowed, otherwise { status, message }.
export function getDeleteBlockReason({ requesterId, target }) {
  if (!target) return { status: 404, message: 'User not found' };
  if (String(target._id) === String(requesterId)) {
    return { status: 403, message: 'You cannot delete your own account' };
  }
  if (target.isAdmin) {
    return { status: 403, message: 'Admin accounts cannot be deleted' };
  }
  return null;
}
