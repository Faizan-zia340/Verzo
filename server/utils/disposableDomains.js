// server/utils/disposableDomains.js
// Curated blocklist of disposable / temporary email providers.
//
// Registration with one of these domains is rejected, so the free signup
// credits cannot be farmed with throwaway addresses. The list is static
// and checked in-process — no external API call is made at registration
// time, so there is no added latency and no new dependency.
//
// This is a curated list of the well-known providers, not an exhaustive
// database (new throwaway services appear constantly). Extend this Set
// when a new provider shows up; the check is in one place so every
// registration path picks it up.
export const DISPOSABLE_DOMAINS = new Set([
  // Mailinator family
  'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
  // Guerrilla Mail family (sharklasers is their domain)
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
  'guerrillamail.de', 'sharklasers.com', 'guerrillamailblock.com',
  // 10 Minute Mail family
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minutemail.co.uk',
  // Temp Mail family
  'temp-mail.org', 'temp-mail.com', 'temp-mail.net', 'temp-mail.io',
  'tempmail.com', 'tempmail.org', 'tempmail.net', 'tempmailaddress.com',
  'temp-mail.de', 'tempail.com', 'tempail.net', 'tempinbox.com',
  // Yopmail family
  'yopmail.com', 'yopmail.net', 'yopmail.fr', 'yopmail.org',
  // Getnada / Nada
  'getnada.com', 'getnada.net',
  // Maildrop
  'maildrop.cc', 'maildrop.com',
  // Throwaway Mail
  'throwawaymail.com', 'throwawaymail.net', 'throwawayemail.com',
  // Other well-known throwaway providers
  'fakeinbox.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
  'mailnesia.com', 'spamgourmet.com', 'mailcatch.com', 'jetable.org',
  'dispostable.com', 'emailondeck.com', 'mohmal.com', '33mail.com',
  'anonbox.net', 'burnermail.io', 'emailfake.com', 'mytemp.email',
  'minuteinbox.com', 'temp-mail.ru', 'tempmailo.com', 'mail-temp.com',
  'guerrillamail.info', 'pokemail.net', 'spambox.us', 'tempemail.net',
  'tempemail.com', 'tmpmail.org', 'tmpmail.com', 'tmpmail.net',
  'mail-tester.com', 'emailtemporanea.com', 'tempr.email', 'maildax.com',
]);

// True when the address belongs to a known disposable provider.
// The domain is matched exactly, and subdomains of a blocked provider
// (e.g. sub.mailinator.com) are blocked too. Non-strings and addresses
// without a domain are not disposable (the email-format validator rejects
// those separately).
export const isDisposableEmail = (email) => {
  if (typeof email !== 'string') return false;
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
};
