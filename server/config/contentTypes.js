// Purpose-based content templates.
// Each purpose defines what the generator must ask for, how the piece is
// structured, its default tone, its length range (words) and two short
// human-written example snippets used as few-shot guidance in prompts.
// The frontend mirrors this shape (see Generator.jsx); the server is the
// authority — validators.js enforces the required fields per purpose.

export const TONES = ['friendly', 'formal', 'persuasive', 'urgent', 'empathetic', 'professional', 'casual'];
export const READING_LEVELS = ['simple', 'standard', 'professional'];

const F = (key, label, alt) => (alt ? { key, label, alt } : { key, label });

export const CONTENT_TYPES = {
  email: {
    label: 'Email',
    purposes: {
      'cold-outreach': {
        label: 'Cold outreach',
        requiredFields: [F('company', 'Company'), F('senderName', 'Sender name'), F('audience', 'Audience'), F('applyLink', 'Apply link or contact', 'contact')],
        structure: 'Subject line naming one specific benefit → greeting by name only if the recipient name was provided, otherwise start with "Hi there," → one-line personal opener tied to the recipient\'s work → 2 sentences on the concrete value → one soft ask → sign-off with sender name.',
        defaultTone: 'friendly',
        lengthRange: { min: 80, max: 150 },
        examples: [
          'Hi Sara, I saw your team just opened a second warehouse in Mississauga — congrats. We help warehouses cut picking errors by about 30% without new hardware. Worth a 15-minute call next Tuesday?',
          'Hi Omar, your recent post on cutting delivery times stood out. Our route planner saved a similar fleet 6 hours a week. Can I send a one-page summary?',
        ],
      },
      'follow-up': {
        label: 'Follow-up',
        requiredFields: [F('company', 'Company'), F('senderName', 'Sender name'), F('contact', 'Contact')],
        structure: 'Brief reminder of the previous message → one new concrete detail or reason to reply → one short ask → sign-off.',
        defaultTone: 'friendly',
        lengthRange: { min: 50, max: 120 },
        examples: [
          'Hi Lina, just floating my note from last week back to the top. We onboarded two clinics in Karachi since then, and both went live in under a week. Still open to a quick chat?',
          'Hi Dan, following up on my email about the invoicing tool. I can set up a 10-minute demo on Thursday if that helps. Let me know either way.',
        ],
      },
      'job-posting': {
        label: 'Job posting',
        requiredFields: [F('company', 'Company'), F('role', 'Role'), F('location', 'Location'), F('senderName', 'Sender name'), F('applyLink', 'Apply link or contact', 'contact')],
        structure: 'Role title plus one-line hook → what the person will actually do (2–3 bullets) → what the company offers → how to apply, with link or contact → sign-off.',
        defaultTone: 'professional',
        lengthRange: { min: 150, max: 300 },
        examples: [
          'We are hiring a Delivery Driver in Lahore. You will run 25–30 drops a day on a fixed route, with fuel paid and weekends off. Apply at the link below — we reply within 3 days.',
          'Junior Graphic Designer, Toronto (hybrid). You will design social posts and store signage, working with our marketing lead. Two years of Figma experience is enough. Send your portfolio to the address below.',
        ],
      },
      complaint: {
        label: 'Complaint',
        requiredFields: [F('company', 'Company'), F('senderName', 'Sender name'), F('topic', 'Topic'), F('contact', 'Contact')],
        structure: 'State the problem and when it happened → how it affected you, with facts → what you want fixed → contact details → sign-off.',
        defaultTone: 'formal',
        lengthRange: { min: 100, max: 250 },
        examples: [
          'I am writing about order #4821, delivered on 12 November with two items missing. I paid Rs. 4,800 and received only the charger. Please send the missing items or refund Rs. 2,100 by Friday.',
          'Our internet has dropped every evening since Monday, between 7 and 10 pm. I work from home and lost two client calls. Please send a technician this week and confirm a time.',
        ],
      },
      apology: {
        label: 'Apology',
        requiredFields: [F('company', 'Company'), F('senderName', 'Sender name'), F('topic', 'Topic')],
        structure: 'Own the mistake plainly → say what went wrong in one sentence → what you are doing to fix it → how you will make it right → sign-off.',
        defaultTone: 'empathetic',
        lengthRange: { min: 80, max: 200 },
        examples: [
          'We got your order wrong, and I am sorry. Your parcel went to the wrong address on Tuesday, and that was our mistake. We have re-shipped it today and refunded your delivery fee.',
          'I am sorry we missed your appointment yesterday. Our scheduler double-booked the slot, and you should never have been left waiting. We have rebooked you for Thursday at 11 am, free of charge.',
        ],
      },
      'payment-reminder': {
        label: 'Payment reminder',
        requiredFields: [F('company', 'Company'), F('senderName', 'Sender name'), F('deadline', 'Deadline'), F('contact', 'Contact')],
        structure: 'Invoice or payment due, with amount and date → polite reminder of the deadline → how to pay → contact for questions → sign-off.',
        defaultTone: 'formal',
        lengthRange: { min: 60, max: 150 },
        examples: [
          'A friendly reminder that invoice #1042 for Rs. 18,500 is due on 30 November. You can pay by bank transfer or through the link below. Please reply if you have already paid.',
          'Your March subscription of $49 is due on the 28th. Payment takes under a minute from your account page. Questions? Reply to this email and we will help.',
        ],
      },
      newsletter: {
        label: 'Newsletter',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience'), F('senderName', 'Sender name')],
        structure: 'One-line highlight → 2–3 short sections with concrete news → one CTA → sign-off.',
        defaultTone: 'friendly',
        lengthRange: { min: 150, max: 350 },
        examples: [
          'This month we shipped three things you asked for: faster search, offline drafts, and a dark mode. Read on for how each one works, then try them in the app.',
          'November at the bakery: our sourdough is back on Fridays, and we now deliver to Gulberg. Order before Thursday noon for the weekend batch.',
        ],
      },
      announcement: {
        label: 'Announcement',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience'), F('company', 'Company')],
        structure: 'The news in the first sentence → what changes, with dates → what it means for the reader → CTA → sign-off.',
        defaultTone: 'formal',
        lengthRange: { min: 80, max: 250 },
        examples: [
          'Our Clifton store moves to a bigger space on 1 December. Same team, same menu, twice the seating. Come see us at the new address on Khayaban-e-Ittehad.',
          'Verzo 2.0 launches on Monday. The editor is faster, and you can now save brand voices. Your existing projects carry over automatically.',
        ],
      },
      'thank-you': {
        label: 'Thank-you',
        requiredFields: [F('senderName', 'Sender name'), F('recipient', 'Recipient'), F('topic', 'Topic')],
        structure: 'Thank the person by name for one specific thing → say what it meant, concretely → one warm closing line → sign-off.',
        defaultTone: 'friendly',
        lengthRange: { min: 50, max: 150 },
        examples: [
          'Thank you, Ayesha, for staying late on Friday to finish the client report. We sent it on time because of you, and the client noticed.',
          'Thank you for the referral, Bilal. Your neighbour signed up yesterday, and your next month is on us.',
        ],
      },
      'meeting-request': {
        label: 'Meeting request',
        requiredFields: [F('senderName', 'Sender name'), F('recipient', 'Recipient'), F('topic', 'Topic'), F('contact', 'Contact')],
        structure: 'Why you want to meet, in one sentence → 2–3 suggested times or a short agenda → ask to confirm → sign-off.',
        defaultTone: 'professional',
        lengthRange: { min: 60, max: 150 },
        examples: [
          'Hi Nadia, I would like 30 minutes to walk through the new onboarding flow with you. I am free Tuesday after 2 pm or Wednesday morning — does either work?',
          'Could we meet this week to finalise the budget? I have the numbers ready and only need your sign-off on two items. Thursday at 10 works on my side.',
        ],
      },
    },
  },

  blog: {
    label: 'Blog',
    purposes: {
      'how-to': {
        label: 'How-to',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Hook stating what the reader will achieve → short list of what they need → numbered steps with concrete detail → one common mistake to avoid → short close.',
        defaultTone: 'friendly',
        lengthRange: { min: 200, max: 400 },
        examples: [
          'You can set up a home Wi-Fi network in 20 minutes with just a router and a phone. First, plug the router into the wall socket near your main room — not behind the TV.',
          'Start by opening the app and tapping the plus icon. Name your first project something you will recognise in a month, not "Test 1".',
        ],
      },
      listicle: {
        label: 'Listicle',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Hook → numbered list, each item one concrete point with a specific example → short close.',
        defaultTone: 'friendly',
        lengthRange: { min: 200, max: 400 },
        examples: [
          '1. Keep your charger in the same pocket every day. It sounds small, but it is the one habit that stops the morning panic.',
          '3. Water your plants on Sundays, not when they look sad. By then the soil is already dry two inches down.',
        ],
      },
      opinion: {
        label: 'Opinion',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Clear position in the first paragraph → 2–3 reasons with examples → address one counterpoint honestly → closing line.',
        defaultTone: 'persuasive',
        lengthRange: { min: 200, max: 400 },
        examples: [
          'Remote work is not a perk anymore; it is how small teams hire the best people. A designer in Multan can now do the same job as one in Toronto, for half the cost.',
          'I think most meetings should be emails. Last month we cut our weekly standup to 15 minutes and shipped the same amount of work.',
        ],
      },
      'case-study': {
        label: 'Case study',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience'), F('company', 'Company')],
        structure: 'The situation → the problem → what was done, concretely → results with numbers → the lesson.',
        defaultTone: 'professional',
        lengthRange: { min: 250, max: 500 },
        examples: [
          'A Lahore bakery was losing weekend orders because its phone line was always busy. We added a simple order form, and weekend sales rose 40% in six weeks.',
          'The clinic had a 3-week waiting list. Moving bookings online cut no-shows from 22% to 8% in two months, without hiring anyone.',
        ],
      },
      'seo-article': {
        label: 'SEO article',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Answer the question in the first paragraph → headings covering the sub-topics → concrete examples → short summary.',
        defaultTone: 'professional',
        lengthRange: { min: 300, max: 600 },
        examples: [
          'A good sourdough starter needs only flour, water, and seven days. Feed it the same time each morning, and keep it somewhere warm — on top of the fridge works.',
          'The cheapest way to insulate a rented flat is draught strips on the doors and thick curtains. Together they cut heat loss noticeably in winter.',
        ],
      },
    },
  },

  social: {
    label: 'Social',
    purposes: {
      linkedin: {
        label: 'LinkedIn',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Hook line → 2–3 short paragraphs with a concrete lesson → question to drive comments.',
        defaultTone: 'professional',
        lengthRange: { min: 80, max: 200 },
        examples: [
          'I spent 6 months avoiding one difficult conversation with a client. When I finally had it, the project finished two weeks early. What conversation are you putting off?',
          'We hired our first intern from a bootcamp, not a university. She shipped her first feature in week three. Degrees open doors; work keeps them open.',
        ],
      },
      'x-twitter': {
        label: 'X / Twitter',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'One punchy line, under 280 characters. No hashtag spam — at most one hashtag.',
        defaultTone: 'friendly',
        lengthRange: { min: 15, max: 40 },
        examples: [
          'Shipped a feature at 2 am. Woke up to 40 signups. Sleep is overrated; shipping is not.',
          'Your first 10 customers will teach you more than any course. Go find them.',
        ],
      },
      'instagram-caption': {
        label: 'Instagram caption',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience'), F('product', 'Product')],
        structure: 'Hook → 2–3 short lines → up to 3 hashtags.',
        defaultTone: 'friendly',
        lengthRange: { min: 30, max: 80 },
        examples: [
          'Fresh out of the oven. Our sourdough takes 18 hours, and you can taste every one of them. #sourdough #lahoreeats',
          'New drop: the canvas tote in sage green. Fits a laptop, a book, and your entire day. Link in bio.',
        ],
      },
      facebook: {
        label: 'Facebook',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience')],
        structure: 'Hook → short story or concrete detail → question or CTA.',
        defaultTone: 'friendly',
        lengthRange: { min: 40, max: 120 },
        examples: [
          'We are giving away 5 free haircuts this Saturday at our DHA branch. First come, first served — doors open at 10.',
          'Rainy weekend? Our board game night starts at 7. Bring a friend, we bring the chai.',
        ],
      },
      'whatsapp-broadcast': {
        label: 'WhatsApp broadcast',
        requiredFields: [F('topic', 'Topic'), F('audience', 'Audience'), F('contact', 'Contact')],
        structure: 'Short greeting → the news or offer in 2–3 lines → how to reply or contact.',
        defaultTone: 'friendly',
        lengthRange: { min: 30, max: 80 },
        examples: [
          'Hi! This week only: 20% off all winter shawls at our Liberty store. Reply YES and we will hold your size till Sunday.',
          'Reminder: your appointment is tomorrow at 4 pm. Reply 1 to confirm or 2 to reschedule.',
        ],
      },
    },
  },

  ad: {
    label: 'Ad',
    purposes: {
      'google-search': {
        label: 'Google search ad',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience'), F('cta', 'Call to action (CTA)')],
        structure: 'Headline of 30 characters or fewer → description of 90 characters or fewer → direct CTA. Every line must fit the character limit.',
        defaultTone: 'persuasive',
        lengthRange: { min: 15, max: 40 },
        examples: [
          'Headline: Cheap Flights to Dubai. Description: Direct flights from Lahore from Rs. 48,000. Book today.',
          'Headline: Plumber in Karachi. Description: Fixed in one visit or no call-out fee. Book online now.',
        ],
      },
      'facebook-instagram': {
        label: 'Facebook / Instagram ad',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience'), F('cta', 'Call to action (CTA)')],
        structure: 'Hook → one concrete benefit → direct CTA.',
        defaultTone: 'persuasive',
        lengthRange: { min: 30, max: 80 },
        examples: [
          'Tired of shoes that hurt by noon? Our cushioned insoles are made for 12-hour shifts. Try them with a 30-day guarantee.',
          'Your skin deserves better than guesswork. One quiz, one routine, made for you. Take the quiz now.',
        ],
      },
      'product-launch': {
        label: 'Product launch',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience'), F('cta', 'Call to action (CTA)')],
        structure: 'The news first → what is new, concretely → CTA.',
        defaultTone: 'persuasive',
        lengthRange: { min: 40, max: 120 },
        examples: [
          'Meet the Atlas 2: our lightest laptop yet, at 990 grams with 18 hours of battery. Pre-order today and get a free sleeve.',
          'We just launched night mode for the app. Your drafts now sync offline and post when you are back online. Update now.',
        ],
      },
    },
  },

  product: {
    label: 'Product',
    purposes: {
      'ecommerce-description': {
        label: 'E-commerce description',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience')],
        structure: 'Benefit-led opening → 2–3 key features with specifics → materials or specs → CTA.',
        defaultTone: 'friendly',
        lengthRange: { min: 80, max: 200 },
        examples: [
          'This cotton kurta stays cool through a Lahore summer. The fabric is 100% lawn, pre-washed so it will not shrink, and the pockets actually fit a phone.',
          'A 1-litre steel bottle that keeps chai hot for 8 hours. Leak-proof lid, fits a car cup holder, and comes in four colours.',
        ],
      },
      'app-store-description': {
        label: 'App store description',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience')],
        structure: 'One-line hook → what the app does → 3 key features → CTA to download.',
        defaultTone: 'friendly',
        lengthRange: { min: 80, max: 200 },
        examples: [
          'Track your expenses in 10 seconds a day. Snap a receipt, and the app sorts it for you. Free for your first 50 expenses.',
          'Learn Urdu with 5-minute daily lessons. Real conversations, not flashcards. Download free and try the first week.',
        ],
      },
      'feature-announcement': {
        label: 'Feature announcement',
        requiredFields: [F('product', 'Product'), F('audience', 'Audience')],
        structure: 'The new feature first → what it does for the user → how to try it.',
        defaultTone: 'persuasive',
        lengthRange: { min: 60, max: 150 },
        examples: [
          'Dark mode is here. It is easier on the eyes at night and saves battery on OLED screens. Turn it on in Settings.',
          'You can now export any project as a PDF in one click. Find it under Share in the top-right corner.',
        ],
      },
    },
  },
};

/** Return the purpose config for a type+purpose, or null if unknown. */
export const getPurpose = (type, purpose) =>
  CONTENT_TYPES[type]?.purposes?.[purpose] || null;

/** List { value, label } purposes for a type (for dropdowns). */
export const listPurposes = (type) =>
  Object.entries(CONTENT_TYPES[type]?.purposes || {}).map(([value, p]) => ({
    value,
    label: p.label,
  }));

/** Required fields for a type+purpose; falls back to the type's first purpose. */
export const getPurposeFields = (type, purpose) => {
  const p = getPurpose(type, purpose);
  return p ? p.requiredFields : [];
};

/** All purpose ids for a type. */
export const purposeIds = (type) => Object.keys(CONTENT_TYPES[type]?.purposes || {});
