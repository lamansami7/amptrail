/**
 * Official AmpTrail support contact.
 *
 * This is public business contact information, not a secret. It is rendered
 * into the marketing site, account screens and recovery guidance so customers
 * always know where to ask for help. A deployment may override the address
 * with NEXT_PUBLIC_SUPPORT_EMAIL, but the shipped default is the official
 * AmpTrail support inbox.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'amptrail.support@gmail.com';

/** Builds a mailto link with a useful subject and body pre-filled. */
export function supportMailto(options?: { subject?: string; body?: string }) {
  const params = new URLSearchParams();
  if (options?.subject) params.set('subject', options.subject);
  if (options?.body) params.set('body', options.body);
  const query = params.toString();
  return `mailto:${SUPPORT_EMAIL}${query ? `?${query}` : ''}`;
}

/** Prefills a support request about a specific record. */
export function supportMailtoForRecord(kind: string, reference: string) {
  return supportMailto({
    subject: `AmpTrail support — ${kind} ${reference}`,
    body: `Hello AmpTrail support,\n\nI need help with ${kind} ${reference}.\n\nWhat happened:\n\nWhat I expected:\n\nThank you.`,
  });
}
