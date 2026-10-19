import type { Language } from '@/lib/translations';

/**
 * Homepage copy, per locale.
 *
 * This is the last mile of the language selector: the selector has always
 * navigated to `/ml`, `/ta` and `/hi`, and the chrome (navbar, footer, islands)
 * has always translated, but everything Astro rendered between them was English
 * literals in the `.astro` files — so switching language changed the URL and the
 * navigation and left the page body in English.
 *
 * The strings live here rather than in `translations-extended.ts` because they
 * are page content, not chrome: a reviewer can read a whole page's copy in one
 * block per language instead of scrolling between four interleaved dictionaries.
 * They merge into the same `TRANSLATIONS` table at load, so `t()` and
 * `getTranslation()` work unchanged.
 *
 * Rules for this file:
 *   - every key exists in all four languages (a test enforces it);
 *   - brand names (Bhagya Thara, Karunya…) and figures (₹1 Crore) are not
 *     translated — they are the same words on the ticket and in the gazette;
 *   - `{placeholders}` are filled by `tf()` in `lib/i18n/server.ts`.
 */
export const HOME_COPY: Record<Language, Record<string, string>> = {
  en: {
    'home.h1.title': 'Kerala Lottery Result Today LIVE at 3 PM — Check Full Result',
    'home.h1.intro':
      'Kerala lottery result today: the live 3:00 PM draw, the 1st prize and the complete prize list, draw number, date, series codes and previous results — all cross-checked with the official Kerala Government Gazette.',

    'home.next.eyebrow': 'Next Draw',
    'home.next.publishes_at': 'Publishes at {time} IST',
    'home.next.published': "Today's result is published",
    'home.next.checking': 'Draw in progress — result is being published',
    'home.next.delayed': "Today's result has not been published yet",
    'home.next.hours': 'hrs',
    'home.next.minutes': 'min',
    'home.next.seconds': 'sec',

    'home.latest.badge_today': "Today's Published Result",
    'home.latest.badge_latest': 'Latest Published Result',
    'home.latest.provisional': 'Live Source · Awaiting Gazette',
    'home.latest.official': 'Official Gazette Certified',
    'home.latest.heading': '{name} ({draw}) Result',
    'home.latest.meta_draw_number': 'Draw Number',
    'home.latest.meta_draw_date': 'Draw Date',
    'home.latest.meta_draw_day': 'Draw Day',
    'home.latest.meta_update_time': 'Update Time',
    'home.latest.view_full': 'View Complete Result',
    'home.latest.all_draws': 'All draws on {date}',
    'home.latest.gazette_pdf': 'Official Gazette PDF',
    'home.latest.permalink': 'Permalink',
    'home.latest.updated': 'Verified and last updated {timestamp}.',
    'home.latest.series_codes': "Today's Lottery Series Codes",
    'home.latest.syncing_body':
      'The latest draw is being retrieved. Kerala results are published daily at 3:00 PM IST.',

    'home.tools.title': 'Kerala Lottery Ticket Scanner & Checker',
    'home.tools.body':
      'Select the draw and type your ticket number, or scan the ticket with your camera, to check every prize tier against the certified result.',
    'home.tools.open': 'Open Ticket Scanner Page',
    'home.tools.gazette_title': 'Every number on this page comes from the gazette',
    'home.tools.gazette_body':
      'Results, prize tiers and winning numbers are stored from the official LOTIS notices and the Kerala Government Gazette PDFs, then published as static HTML.',
    'home.tools.browse': 'Browse the results archive',

    'home.chart.heading': '{scheme} Prize Chart',
    'home.chart.permalink': 'Permalink',
    'home.chart.print': 'Print',
    'home.chart.empty':
      'The prize chart for this draw is still being verified against the official gazette.',
    'home.chart.ending_banner': 'For the tickets ending with the following numbers',
    'home.chart.consolation_note': 'Matching number in the remaining series',
    'home.chart.provisional':
      'Live numbers from an unofficial source — the official gazette has not been published yet.',
    'home.chart.official':
      'Official Result Source: Directorate of Kerala State Lotteries (Kerala Government Gazette).',
    'home.chart.gazette_pdf': 'Gazette PDF',
    'home.chart.structure': 'Prize structure explained',
    'home.chart.ending_note': 'Last {digits} digits to be drawn {count} times',
    'home.chart.digit_1': 'one',
    'home.chart.digit_2': 'two',
    'home.chart.digit_3': 'three',
    'home.chart.digit_4': 'four',
    'home.chart.digit_5': 'five',

    'home.schedule.title': 'Kerala Lottery Weekly Schedule',
    'home.schedule.intro':
      'Kerala runs seven weekly lotteries, one fixed for each day. Each has its own series of draw numbers; the prize categories are similar across schemes but the amounts differ. Draws are held at Gorky Bhavan, Thiruvananthapuram at 3:00 PM IST.',
    'home.schedule.today_in': 'Today in Kerala:',
    'home.schedule.note':
      'Daily recurring timetable · draw at 3:00 PM IST · LOTIS verified results published by 4:00 PM IST.',
    'home.schedule.caption':
      'Kerala State Lottery weekly draw schedule: day, scheme, draw code, draw time, ticket price and first prize.',
    'home.schedule.col_day': 'Draw Day',
    'home.schedule.col_scheme': 'Lottery Scheme',
    'home.schedule.col_code': 'Code',
    'home.schedule.col_price': 'Ticket Price',
    'home.schedule.col_first_prize': '1st Prize',
    'home.schedule.col_action': 'Scheme',
    'home.schedule.today_chip': 'TODAY',
    'home.schedule.view': 'View',
    'home.schedule.view_aria': 'View {name} results and schedule',
    'home.schedule.bumper_note_before':
      "Bumper draw dates shift slightly each year — confirm the current year's calendar on the",
    'home.schedule.bumper_note_link': 'draw schedule page',

    'home.bumper.title': 'Kerala Bumper Lotteries',
    'home.bumper.intro': 'Seasonal bumper draws with jackpots up to ₹25 Crore.',
    'home.bumper.first_prize': '1st prize',
    'home.bumper.ticket': 'Ticket',
    'home.bumper.season_thiruvonam': 'September (Annual Onam)',
    'home.bumper.season_xmas': 'January (New Year)',
    'home.bumper.season_vishu': 'May (Summer Festival)',
    'home.bumper.season_pooja': 'November (Festive)',
    'home.bumper.season_monsoon': 'July (Monsoon Season)',
    'home.bumper.season_summer': 'March (Spring Season)',

    'home.claim.title': 'How to Claim Kerala Lottery Prize Money',
    'home.claim.intro':
      "The Directorate of Kerala State Lotteries' claim protocol for prize winnings, tax deductions and ticket security. Rules apply equally to the seven weekly schemes and to bumper draws.",
    'home.claim.s1.eyebrow': 'Step 01: Secure your ticket',
    'home.claim.s1.title': 'Sign the original ticket',
    'home.claim.s1.body':
      'Write your full legal name, permanent address and signature on the reverse of the original ticket. Never tamper with, staple or fold the barcode region, and check both the two-letter series code and the six-digit number against the official LOTIS gazette.',
    'home.claim.s1.note': 'A pristine original ticket is required.',
    'home.claim.s2.eyebrow': 'Step 02: Prizes under ₹1,00,000',
    'home.claim.s2.title': 'Claim at a retailer or district office',
    'home.claim.s2.body':
      'Prize amounts up to ₹1,00,000 can be encashed through any licensed Kerala lottery retailer or through a District Lottery Office. Retailers deduct their statutory commission and pay the remaining prize amount immediately.',
    'home.claim.s2.note': '14 District Lottery Offices.',
    'home.claim.s3.eyebrow': 'Step 03: Prizes above ₹1,00,000',
    'home.claim.s3.title': 'Directorate and bank surrender',
    'home.claim.s3.body':
      'For higher tiers, submit the original winning ticket with a completed claim application, a self-attested PAN card, Aadhaar card, two passport photographs and a cancelled bank cheque to the Directorate of Kerala State Lotteries in Thiruvananthapuram, or through an authorised bank.',
    'home.claim.s3.note': 'Paid by direct bank transfer (NEFT/RTGS).',
    'home.claim.s4.eyebrow': 'Rule 04: Taxes and deadlines',
    'home.claim.s4.title': 'TDS and the claim window',
    'home.claim.s4.body':
      'Prize winnings attract tax deducted at source, and any agent commission is also deducted before the amount is credited. Claims must be submitted within the statutory window from the draw date; unclaimed amounts lapse.',
    'home.claim.s4.note': 'Claim within the statutory deadline.',
    'home.claim.legal_before':
      'Claim limits, documents and tax rates are set by the Government of Kerala and by Indian income tax law, and can change. Always confirm the current rules with the',
    'home.claim.legal_link': 'official claim instructions',
    'home.claim.legal_after': 'before submitting a claim.',

    'home.verify.title': 'How to Verify a Kerala Lottery Result',
    'home.verify.intro':
      'The result information published here is an independent reference. The applicable official result publication is the record that decides a claim, so treat this page as the fast check and the gazette as the final one.',
    'home.verify.step_1': 'Check the lottery name shown on your ticket.',
    'home.verify.step_2': 'Confirm the draw number.',
    'home.verify.step_3': 'Confirm the draw date.',
    'home.verify.step_4': 'Compare your ticket number with the published winning numbers.',
    'home.verify.step_5': 'Check which prize category your ticket falls into.',
    'home.verify.step_6':
      'Verify the result against the applicable official gazette publication.',
    'home.verify.source':
      'Official result source: Directorate of Kerala State Lotteries (Kerala Government Gazette).',
    'home.verify.guides': 'Verification guides',
    'home.verify.disclaimer': 'Disclaimer & claim rules',
    'home.verify.archive': 'Results archive',

    'home.win.title': 'What to Do After Winning a Kerala Lottery Prize',
    'home.win.body1':
      'If your ticket matches a winning number, the first thing to do is double-check everything: the lottery name, the draw number, the draw date and the prize category. Cross-check all of them against the official Kerala Government Gazette publication before you act on the result.',
    'home.win.body2':
      'Keep the original ticket safe and undamaged — a damaged or torn ticket can delay or invalidate a claim. Then confirm the current claim rules, the documents required and the submission deadline for your prize amount before heading out.',
    'home.win.check': 'Check another ticket',
    'home.win.prizes': 'Prize amounts & tiers',
    'home.win.today': "Today's result",

    'home.bumpercards.title': 'Kerala Bumper Lottery',
    'home.bumpercards.body':
      'Alongside the seven weekly draws, Kerala State Lotteries runs seasonal bumper draws with jackpots in crores of rupees. Bumper tickets cost more than a weekly ticket and the prize figures are larger, but the rules are the same: the claim must be submitted within the statutory window from the draw date, and standard TDS applies to the winnings.',
    'home.bumpercards.note_before':
      'Exact bumper draw dates move slightly each year — always use the official draw calendar for the current year.',
    'home.bumpercards.note_link': 'See the draw schedule',

    'home.about.title': 'About KeralaDraws',
    'home.about.body1':
      'KeralaDraws is an independent information portal for Kerala State Lottery results. It publishes daily results, the weekly draw timetable, prize breakdowns and step-by-step ticket verification guides for ticket holders.',
    'home.about.body2':
      'It is not affiliated with the Government of Kerala, the Directorate of Kerala State Lotteries, or any official lottery authority. Everything published here is general reference information. Winners should always cross-check their tickets against the official Kerala Government Gazette.',
    'home.about.verified_label': 'Verified:',
    'home.about.verified_body':
      '{subject}has been cross-checked with the official Kerala Government Gazette PDF.',
    'home.about.latest_result': 'The latest result ',
    'home.about.updated': ' Last updated {timestamp}.',
    'home.about.notice_label': 'Important notice:',
    'home.about.notice_body':
      'the online sale and purchase of lottery tickets is banned in Kerala. Only physical tickets bought from authorised agents and retailers are valid. This website is intended solely for results and information — it does not sell tickets and does not run any online purchase. Before claiming a prize, verify your ticket against the official gazette result.',
    'home.about.link_about': 'About us',
    'home.about.link_contact': 'Contact',
    'home.about.link_privacy': 'Privacy policy',
    'home.about.link_portal': 'Official LOTIS portal',

    'home.faq.title': 'Kerala Lottery Results & Verification FAQs',
    'home.faq.intro':
      'Clear, verified answers on daily 3:00 PM draw times, weekly schemes, prize claim protocols, taxes and government gazette verification.',
    'home.faq.count': '{count} questions answered',
    'home.faq.topic': 'Topic: {topic}',

    'home.find.title': 'Search Any Previous Result',
    'home.find.intro':
      'Pick a draw date, or narrow it down to one scheme, to open the archived result.',
    'home.find.previous': 'Previous results',
    'home.find.archive': 'Full archive',
    'home.schemes.intro': 'Weekly and bumper schemes, ticket prices and top prizes.',
    'home.schemes.all': 'All schemes',
    'home.news.intro': 'Gazette releases, schedule changes and prize announcements.',
    'home.news.all': 'All news',
    'home.trust.eyebrow': 'Government Verification & Architecture',
    'home.trust.badge': '4-Stage Verification',
    'home.trust.venue_label': 'Draw Venue',
    'home.trust.venue': 'Gorky Bhavan, TVM',
    'home.trust.source_label': 'Audit Source',
    'home.trust.source': 'Official Government Gazette',
    'home.trust.stage': 'Stage {n} of 4 Complete',

    'home.sidebar.tools_aria': 'Result tools and navigation',
    'home.sidebar.check_title': 'Check Ticket Number',
    'home.sidebar.number_aria': 'Kerala lottery ticket number',
    'home.sidebar.placeholder': 'e.g. 1234 or KN',
    'home.sidebar.search': 'Search',
    'home.sidebar.scan': 'Or scan the ticket with your camera',
    'home.sidebar.lotteries': 'Kerala Lotteries',
    'home.sidebar.all_schemes': 'All schemes, prices & top prizes',
    'home.sidebar.recent': 'Recent Result Updates',
    'home.sidebar.all_previous': 'All previous results',
  },

  ml: {
    'home.h1.title': 'ഇന്നത്തെ കേരള ഭാഗ്യക്കുറി ഫലം — വൈകുന്നേരം 3 മണിക്ക് ലൈവ്',
    'home.h1.intro':
      'ഇന്നത്തെ കേരള ഭാഗ്യക്കുറി ഫലം: വൈകുന്നേരം 3 മണിയിലെ ലൈവ് നറുക്കെടുപ്പ്, ഒന്നാം സമ്മാനം, പൂർണ്ണ സമ്മാനപ്പട്ടിക, നറുക്കെടുപ്പ് നമ്പർ, തീയതി, സീരീസ് കോഡുകൾ, മുൻ ഫലങ്ങൾ — എല്ലാം ഔദ്യോഗിക കേരള സർക്കാർ ഗസറ്റുമായി ഒത്തുനോക്കി.',

    'home.next.eyebrow': 'അടുത്ത നറുക്കെടുപ്പ്',
    'home.next.publishes_at': '{time} IST-യ്ക്ക് പ്രസിദ്ധീകരിക്കും',
    'home.next.published': 'ഇന്നത്തെ ഫലം പ്രസിദ്ധീകരിച്ചു',
    'home.next.checking': 'നറുക്കെടുപ്പ് നടക്കുന്നു — ഫലം പ്രസിദ്ധീകരിക്കുന്നു',
    'home.next.delayed': 'ഇന്നത്തെ ഫലം ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല',
    'home.next.hours': 'മണി',
    'home.next.minutes': 'മിനിറ്റ്',
    'home.next.seconds': 'സെക്കൻഡ്',

    'home.latest.badge_today': 'ഇന്ന് പ്രസിദ്ധീകരിച്ച ഫലം',
    'home.latest.badge_latest': 'ഏറ്റവും പുതിയ പ്രസിദ്ധീകരിച്ച ഫലം',
    'home.latest.provisional': 'ലൈവ് സ്രോതസ്സ് · ഗസറ്റിനായി കാത്തിരിക്കുന്നു',
    'home.latest.official': 'ഔദ്യോഗിക ഗസറ്റ് സാക്ഷ്യപ്പെടുത്തിയത്',
    'home.latest.heading': '{name} ({draw}) ഫലം',
    'home.latest.meta_draw_number': 'നറുക്കെടുപ്പ് നമ്പർ',
    'home.latest.meta_draw_date': 'നറുക്കെടുപ്പ് തീയതി',
    'home.latest.meta_draw_day': 'നറുക്കെടുപ്പ് ദിവസം',
    'home.latest.meta_update_time': 'അപ്ഡേറ്റ് സമയം',
    'home.latest.view_full': 'പൂർണ്ണ ഫലം കാണുക',
    'home.latest.all_draws': '{date} ലെ എല്ലാ നറുക്കെടുപ്പുകളും',
    'home.latest.gazette_pdf': 'ഔദ്യോഗിക ഗസറ്റ് PDF',
    'home.latest.permalink': 'സ്ഥിരം ലിങ്ക്',
    'home.latest.updated': '{timestamp}-ൽ പരിശോധിച്ച് അവസാനം അപ്ഡേറ്റ് ചെയ്തു.',
    'home.latest.series_codes': 'ഇന്നത്തെ ഭാഗ്യക്കുറി സീരീസ് കോഡുകൾ',
    'home.latest.syncing_body':
      'ഏറ്റവും പുതിയ നറുക്കെടുപ്പ് ശേഖരിക്കുന്നു. കേരളത്തിലെ ഫലങ്ങൾ ദിവസവും വൈകുന്നേരം 3 മണിക്ക് (IST) പ്രസിദ്ധീകരിക്കുന്നു.',

    'home.tools.title': 'കേരള ഭാഗ്യക്കുറി ടിക്കറ്റ് സ്കാനർ & ചെക്കർ',
    'home.tools.body':
      'നറുക്കെടുപ്പ് തിരഞ്ഞെടുത്ത് ടിക്കറ്റ് നമ്പർ നൽകുക, അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിച്ച് ടിക്കറ്റ് സ്കാൻ ചെയ്യുക — സാക്ഷ്യപ്പെടുത്തിയ ഫലവുമായി എല്ലാ സമ്മാനത്തലങ്ങളും പരിശോധിക്കാം.',
    'home.tools.open': 'ടിക്കറ്റ് സ്കാനർ പേജ് തുറക്കുക',
    'home.tools.gazette_title': 'ഈ പേജിലെ ഓരോ നമ്പറും ഗസറ്റിൽ നിന്നുള്ളതാണ്',
    'home.tools.gazette_body':
      'ഫലങ്ങൾ, സമ്മാനത്തലങ്ങൾ, വിജയ നമ്പറുകൾ എന്നിവ ഔദ്യോഗിക ലോട്ടിസ് അറിയിപ്പുകളിൽ നിന്നും കേരള സർക്കാർ ഗസറ്റ് PDF-കളിൽ നിന്നും ശേഖരിച്ച് സ്റ്റാറ്റിക് HTML ആയി പ്രസിദ്ധീകരിക്കുന്നു.',
    'home.tools.browse': 'ഫല ശേഖരം കാണുക',

    'home.chart.heading': '{scheme} സമ്മാനപ്പട്ടിക',
    'home.chart.permalink': 'സ്ഥിരം ലിങ്ക്',
    'home.chart.print': 'പ്രിന്റ്',
    'home.chart.empty':
      'ഈ നറുക്കെടുപ്പിന്റെ സമ്മാനപ്പട്ടിക ഇപ്പോൾ ഔദ്യോഗിക ഗസറ്റുമായി പരിശോധിക്കുന്നു.',
    'home.chart.ending_banner': 'താഴെ പറയുന്ന നമ്പറുകളിൽ അവസാനിക്കുന്ന ടിക്കറ്റുകൾക്ക്',
    'home.chart.consolation_note': 'ബാക്കിയുള്ള സീരീസുകളിൽ ഒരേ നമ്പർ',
    'home.chart.provisional':
      'അനൗദ്യോഗിക സ്രോതസ്സിൽ നിന്നുള്ള ലൈവ് നമ്പറുകൾ — ഔദ്യോഗിക ഗസറ്റ് ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല.',
    'home.chart.official':
      'ഔദ്യോഗിക ഫല സ്രോതസ്സ്: കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റ് (കേരള സർക്കാർ ഗസറ്റ്).',
    'home.chart.gazette_pdf': 'ഗസറ്റ് PDF',
    'home.chart.structure': 'സമ്മാന ഘടന വിശദീകരിച്ചിരിക്കുന്നു',
    'home.chart.ending_note': 'അവസാന {digits} അക്കങ്ങൾ {count} തവണ നറുക്കെടുക്കും',
    'home.chart.digit_1': 'ഒരു',
    'home.chart.digit_2': 'രണ്ട്',
    'home.chart.digit_3': 'മൂന്ന്',
    'home.chart.digit_4': 'നാല്',
    'home.chart.digit_5': 'അഞ്ച്',

    'home.schedule.title': 'കേരള ഭാഗ്യക്കുറി പ്രതിവാര ഷെഡ്യൂൾ',
    'home.schedule.intro':
      'കേരളത്തിൽ ആഴ്ചയിൽ ഏഴ് ഭാഗ്യക്കുറികൾ നടത്തുന്നു, ഓരോ ദിവസത്തിനും ഒന്ന്. ഓരോന്നിനും സ്വന്തം നറുക്കെടുപ്പ് നമ്പർ പരമ്പരയുണ്ട്; സമ്മാന വിഭാഗങ്ങൾ സമാനമാണെങ്കിലും തുകകൾ വ്യത്യാസപ്പെടും. നറുക്കെടുപ്പുകൾ തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ വൈകുന്നേരം 3 മണിക്ക് (IST) നടക്കുന്നു.',
    'home.schedule.today_in': 'ഇന്ന് കേരളത്തിൽ:',
    'home.schedule.note':
      'ദൈനംദിന ഷെഡ്യൂൾ · വൈകുന്നേരം 3:00 IST-യ്ക്ക് നറുക്കെടുപ്പ് · ലോട്ടിസ് സാക്ഷ്യപ്പെടുത്തിയ ഫലങ്ങൾ 4:00 IST-യ്ക്ക് പ്രസിദ്ധീകരിക്കുന്നു.',
    'home.schedule.caption':
      'കേരള സംസ്ഥാന ഭാഗ്യക്കുറി പ്രതിവാര ഷെഡ്യൂൾ: ദിവസം, പദ്ധതി, കോഡ്, നറുക്കെടുപ്പ് സമയം, ടിക്കറ്റ് വില, ഒന്നാം സമ്മാനം.',
    'home.schedule.col_day': 'നറുക്കെടുപ്പ് ദിവസം',
    'home.schedule.col_scheme': 'ഭാഗ്യക്കുറി പദ്ധതി',
    'home.schedule.col_code': 'കോഡ്',
    'home.schedule.col_price': 'ടിക്കറ്റ് വില',
    'home.schedule.col_first_prize': 'ഒന്നാം സമ്മാനം',
    'home.schedule.col_action': 'പദ്ധതി',
    'home.schedule.today_chip': 'ഇന്ന്',
    'home.schedule.view': 'കാണുക',
    'home.schedule.view_aria': '{name} ഫലങ്ങളും ഷെഡ്യൂളും കാണുക',
    'home.schedule.bumper_note_before':
      'ബംപർ നറുക്കെടുപ്പ് തീയതികൾ ഓരോ വർഷവും അൽപം മാറും — ഈ വർഷത്തെ കലണ്ടർ സ്ഥിരീകരിക്കുക',
    'home.schedule.bumper_note_link': 'നറുക്കെടുപ്പ് ഷെഡ്യൂൾ പേജ്',

    'home.bumper.title': 'കേരള ബംപർ ഭാഗ്യക്കുറികൾ',
    'home.bumper.intro': '₹25 കോടി വരെ ജാക്ക്പോട്ടുള്ള സീസണൽ ബംപർ നറുക്കെടുപ്പുകൾ.',
    'home.bumper.first_prize': 'ഒന്നാം സമ്മാനം',
    'home.bumper.ticket': 'ടിക്കറ്റ്',
    'home.bumper.season_thiruvonam': 'സെപ്റ്റംബർ (ഓണം)',
    'home.bumper.season_xmas': 'ജനുവരി (പുതുവർഷം)',
    'home.bumper.season_vishu': 'മേയ് (വിഷു)',
    'home.bumper.season_pooja': 'നവംബർ (പൂജ)',
    'home.bumper.season_monsoon': 'ജൂലൈ (മൺസൂൺ)',
    'home.bumper.season_summer': 'മാർച്ച് (വേനൽ)',

    'home.claim.title': 'കേരള ഭാഗ്യക്കുറി സമ്മാനം എങ്ങനെ നേടാം',
    'home.claim.intro':
      'സമ്മാനം, നികുതി കിഴിവ്, ടിക്കറ്റ് സുരക്ഷ എന്നിവയ്ക്കായുള്ള കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റിന്റെ നടപടിക്രമം. ഏഴ് പ്രതിവാര പദ്ധതികൾക്കും ബംപർ നറുക്കെടുപ്പുകൾക്കും ഒരേ നിയമങ്ങളാണ്.',
    'home.claim.s1.eyebrow': 'ഘട്ടം 01: ടിക്കറ്റ് സൂക്ഷിക്കുക',
    'home.claim.s1.title': 'യഥാർത്ഥ ടിക്കറ്റിൽ ഒപ്പിടുക',
    'home.claim.s1.body':
      'യഥാർത്ഥ ടിക്കറ്റിന്റെ പിന്നിലായി നിങ്ങളുടെ പൂർണ്ണ നിയമപരമായ പേര്, സ്ഥിരവിലാസം, ഒപ്പ് എന്നിവ എഴുതുക. ബാർകോഡ് ഭാഗത്ത് ഒരിക്കലും മാറ്റം വരുത്തുകയോ സ്റ്റേപ്പിൾ ചെയ്യുകയോ മടക്കുകയോ ചെയ്യരുത്; രണ്ട് അക്ഷര സീരീസ് കോഡും ആറ് അക്ക നമ്പറും ഔദ്യോഗിക ലോട്ടിസ് ഗസറ്റുമായി ഒത്തുനോക്കുക.',
    'home.claim.s1.note': 'കേടുപാടില്ലാത്ത യഥാർത്ഥ ടിക്കറ്റ് ആവശ്യമാണ്.',
    'home.claim.s2.eyebrow': 'ഘട്ടം 02: ₹1,00,000-ൽ താഴെയുള്ള സമ്മാനങ്ങൾ',
    'home.claim.s2.title': 'വിൽപ്പനക്കാരനിൽ നിന്നോ ജില്ലാ ഓഫീസിൽ നിന്നോ വാങ്ങുക',
    'home.claim.s2.body':
      '₹1,00,000 വരെയുള്ള സമ്മാനം ലൈസൻസുള്ള കേരള ഭാഗ്യക്കുറി വിൽപ്പനക്കാരനിൽ നിന്നോ ജില്ലാ ഭാഗ്യക്കുറി ഓഫീസിൽ നിന്നോ പണമാക്കാം. വിൽപ്പനക്കാർ നിശ്ചിത കമ്മീഷൻ കിഴിച്ച് ബാക്കി തുക ഉടൻ നൽകും.',
    'home.claim.s2.note': '14 ജില്ലാ ഭാഗ്യക്കുറി ഓഫീസുകൾ.',
    'home.claim.s3.eyebrow': 'ഘട്ടം 03: ₹1,00,000-ന് മുകളിലുള്ള സമ്മാനങ്ങൾ',
    'home.claim.s3.title': 'ഡയറക്ടറേറ്റിലും ബാങ്കിലും സമർപ്പിക്കുക',
    'home.claim.s3.body':
      'വലിയ സമ്മാനങ്ങൾക്ക് യഥാർത്ഥ വിജയ ടിക്കറ്റ്, പൂരിപ്പിച്ച അപേക്ഷ, സ്വയം സാക്ഷ്യപ്പെടുത്തിയ PAN കാർഡ്, ആധാർ കാർഡ്, രണ്ട് പാസ്പോർട്ട് ഫോട്ടോ, റദ്ദാക്കിയ ബാങ്ക് ചെക്ക് എന്നിവ തിരുവനന്തപുരത്തുള്ള കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റിൽ അല്ലെങ്കിൽ അധികാരമുള്ള ബാങ്ക് വഴി സമർപ്പിക്കണം.',
    'home.claim.s3.note': 'നേരിട്ടുള്ള ബാങ്ക് ട്രാൻസ്ഫർ (NEFT/RTGS) വഴി നൽകുന്നു.',
    'home.claim.s4.eyebrow': 'നിയമം 04: നികുതിയും സമയപരിധിയും',
    'home.claim.s4.title': 'TDS-ഉം ക്ലെയിം കാലയളവും',
    'home.claim.s4.body':
      'സമ്മാന തുകയിൽ നിന്ന് ഉറവിടത്തിൽ നികുതി (TDS) കിഴിക്കും; ഏജന്റ് കമ്മീഷനും തുക ക്രെഡിറ്റ് ചെയ്യുന്നതിന് മുൻപ് കിഴിക്കും. നറുക്കെടുപ്പ് തീയതി മുതൽ നിയമപരമായ കാലയളവിനുള്ളിൽ ക്ലെയിം സമർപ്പിക്കണം; അല്ലാത്തപക്ഷം തുക നഷ്ടമാകും.',
    'home.claim.s4.note': 'നിയമപരമായ സമയപരിധിക്കുള്ളിൽ ക്ലെയിം ചെയ്യുക.',
    'home.claim.legal_before':
      'ക്ലെയിം പരിധികൾ, രേഖകൾ, നികുതി നിരക്കുകൾ എന്നിവ കേരള സർക്കാരും ഇന്ത്യൻ ആദായനികുതി നിയമവും നിശ്ചയിക്കുന്നതാണ്, അവ മാറാം. ക്ലെയിം സമർപ്പിക്കുന്നതിന് മുൻപ് നിലവിലെ നിയമങ്ങൾ ഉറപ്പാക്കാൻ',
    'home.claim.legal_link': 'ഔദ്യോഗിക ക്ലെയിം നിർദ്ദേശങ്ങൾ',
    'home.claim.legal_after': 'പരിശോധിക്കുക.',

    'home.verify.title': 'കേരള ഭാഗ്യക്കുറി ഫലം എങ്ങനെ പരിശോധിക്കാം',
    'home.verify.intro':
      'ഇവിടെ നൽകുന്ന ഫല വിവരങ്ങൾ ഒരു സ്വതന്ത്ര റഫറൻസ് മാത്രമാണ്. ക്ലെയിം തീരുമാനിക്കുന്ന രേഖ ബന്ധപ്പെട്ട ഔദ്യോഗിക ഫല പ്രസിദ്ധീകരണമാണ്; അതിനാൽ ഈ പേജ് വേഗത്തിലുള്ള പരിശോധനയായും ഗസറ്റ് അന്തിമ തീരുമാനമായും കാണുക.',
    'home.verify.step_1': 'ടിക്കറ്റിൽ കാണുന്ന ഭാഗ്യക്കുറിയുടെ പേര് പരിശോധിക്കുക.',
    'home.verify.step_2': 'നറുക്കെടുപ്പ് നമ്പർ സ്ഥിരീകരിക്കുക.',
    'home.verify.step_3': 'നറുക്കെടുപ്പ് തീയതി സ്ഥിരീകരിക്കുക.',
    'home.verify.step_4': 'നിങ്ങളുടെ ടിക്കറ്റ് നമ്പർ പ്രസിദ്ധീകരിച്ച വിജയ നമ്പറുകളുമായി താരതമ്യപ്പെടുത്തുക.',
    'home.verify.step_5': 'നിങ്ങളുടെ ടിക്കറ്റ് ഏത് സമ്മാന വിഭാഗത്തിലാണെന്ന് പരിശോധിക്കുക.',
    'home.verify.step_6': 'ബന്ധപ്പെട്ട ഔദ്യോഗിക ഗസറ്റ് പ്രസിദ്ധീകരണവുമായി ഫലം ഒത്തുനോക്കുക.',
    'home.verify.source':
      'ഔദ്യോഗിക ഫല സ്രോതസ്സ്: കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റ് (കേരള സർക്കാർ ഗസറ്റ്).',
    'home.verify.guides': 'പരിശോധനാ ഗൈഡുകൾ',
    'home.verify.disclaimer': 'അറിയിപ്പും ക്ലെയിം നിയമങ്ങളും',
    'home.verify.archive': 'ഫല ശേഖരം',

    'home.win.title': 'കേരള ഭാഗ്യക്കുറി സമ്മാനം ലഭിച്ചാൽ എന്ത് ചെയ്യണം',
    'home.win.body1':
      'നിങ്ങളുടെ ടിക്കറ്റ് ഒരു വിജയ നമ്പറുമായി ഒത്തുവന്നാൽ ആദ്യം എല്ലാം ഒരിക്കൽ കൂടി പരിശോധിക്കുക: ഭാഗ്യക്കുറിയുടെ പേര്, നറുക്കെടുപ്പ് നമ്പർ, തീയതി, സമ്മാന വിഭാഗം. ഫലം അനുസരിച്ച് പ്രവർത്തിക്കുന്നതിന് മുൻപ് ഇവയെല്ലാം ഔദ്യോഗിക കേരള സർക്കാർ ഗസറ്റ് പ്രസിദ്ധീകരണവുമായി ഒത്തുനോക്കുക.',
    'home.win.body2':
      'യഥാർത്ഥ ടിക്കറ്റ് സുരക്ഷിതമായും കേടുപാടില്ലാതെയും സൂക്ഷിക്കുക — കേടായതോ കീറിയതോ ആയ ടിക്കറ്റ് ക്ലെയിം വൈകിപ്പിക്കുകയോ അസാധുവാക്കുകയോ ചെയ്യാം. ശേഷം നിലവിലെ ക്ലെയിം നിയമങ്ങൾ, ആവശ്യമായ രേഖകൾ, സമർപ്പിക്കേണ്ട സമയപരിധി എന്നിവ ഉറപ്പാക്കുക.',
    'home.win.check': 'മറ്റൊരു ടിക്കറ്റ് പരിശോധിക്കുക',
    'home.win.prizes': 'സമ്മാന തുകകളും തലങ്ങളും',
    'home.win.today': 'ഇന്നത്തെ ഫലം',

    'home.bumpercards.title': 'കേരള ബംപർ ഭാഗ്യക്കുറി',
    'home.bumpercards.body':
      'ഏഴ് പ്രതിവാര നറുക്കെടുപ്പുകൾക്കൊപ്പം കേരള സംസ്ഥാന ഭാഗ്യക്കുറി കോടികളുടെ ജാക്ക്പോട്ടുള്ള സീസണൽ ബംപർ നറുക്കെടുപ്പുകളും നടത്തുന്നു. ബംപർ ടിക്കറ്റുകൾക്ക് പ്രതിവാര ടിക്കറ്റിനേക്കാൾ വിലയും സമ്മാന തുകകളും കൂടുതലാണ്, എന്നാൽ നിയമങ്ങൾ ഒന്നുതന്നെ: നറുക്കെടുപ്പ് തീയതി മുതൽ നിയമപരമായ കാലയളവിനുള്ളിൽ ക്ലെയിം സമർപ്പിക്കണം, സാധാരണ TDS ബാധകമാണ്.',
    'home.bumpercards.note_before':
      'കൃത്യമായ ബംപർ നറുക്കെടുപ്പ് തീയതികൾ ഓരോ വർഷവും അൽപം മാറും — ഈ വർഷത്തെ ഔദ്യോഗിക കലണ്ടർ ഉപയോഗിക്കുക.',
    'home.bumpercards.note_link': 'നറുക്കെടുപ്പ് ഷെഡ്യൂൾ കാണുക',

    'home.about.title': 'KeralaDraws-നെക്കുറിച്ച്',
    'home.about.body1':
      'KeralaDraws കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലങ്ങൾക്കായുള്ള ഒരു സ്വതന്ത്ര വിവര പോർട്ടലാണ്. ദൈനംദിന ഫലങ്ങൾ, പ്രതിവാര നറുക്കെടുപ്പ് ഷെഡ്യൂൾ, സമ്മാന വിഭജനം, ടിക്കറ്റ് പരിശോധനാ ഗൈഡുകൾ എന്നിവ ഇവിടെ പ്രസിദ്ധീകരിക്കുന്നു.',
    'home.about.body2':
      'ഇത് കേരള സർക്കാരുമായോ കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റുമായോ ഏതെങ്കിലും ഔദ്യോഗിക ഭാഗ്യക്കുറി അധികാരിയുമായോ ബന്ധപ്പെട്ടതല്ല. ഇവിടെ നൽകുന്നത് പൊതു റഫറൻസ് വിവരങ്ങളാണ്. വിജയികൾ എപ്പോഴും ടിക്കറ്റുകൾ ഔദ്യോഗിക കേരള സർക്കാർ ഗസറ്റുമായി ഒത്തുനോക്കണം.',
    'home.about.verified_label': 'പരിശോധിച്ചു:',
    'home.about.verified_body':
      '{subject}ഔദ്യോഗിക കേരള സർക്കാർ ഗസറ്റ് PDF-മായി ഒത്തുനോക്കിയിട്ടുണ്ട്.',
    'home.about.latest_result': 'ഏറ്റവും പുതിയ ഫലം ',
    'home.about.updated': ' അവസാനം അപ്ഡേറ്റ് ചെയ്തത് {timestamp}.',
    'home.about.notice_label': 'പ്രധാന അറിയിപ്പ്:',
    'home.about.notice_body':
      'കേരളത്തിൽ ഭാഗ്യക്കുറി ടിക്കറ്റുകളുടെ ഓൺലൈൻ വിൽപ്പനയും വാങ്ങലും നിരോധിച്ചിരിക്കുന്നു. അധികാരമുള്ള ഏജന്റുമാരിൽ നിന്നും വിൽപ്പനക്കാരിൽ നിന്നും വാങ്ങുന്ന ഭൗതിക ടിക്കറ്റുകൾ മാത്രമാണ് സാധുവായത്. ഈ വെബ്സൈറ്റ് ഫലങ്ങൾക്കും വിവരങ്ങൾക്കും മാത്രമുള്ളതാണ് — ഇത് ടിക്കറ്റുകൾ വിൽക്കുന്നില്ല, ഓൺലൈൻ വാങ്ങൽ നടത്തുന്നുമില്ല. സമ്മാനം ക്ലെയിം ചെയ്യുന്നതിന് മുൻപ് ടിക്കറ്റ് ഔദ്യോഗിക ഗസറ്റ് ഫലവുമായി പരിശോധിക്കുക.',
    'home.about.link_about': 'ഞങ്ങളെക്കുറിച്ച്',
    'home.about.link_contact': 'ബന്ധപ്പെടുക',
    'home.about.link_privacy': 'സ്വകാര്യതാ നയം',
    'home.about.link_portal': 'ഔദ്യോഗിക ലോട്ടിസ് പോർട്ടൽ',

    'home.faq.title': 'കേരള ഭാഗ്യക്കുറി ഫലങ്ങളും പരിശോധനയും — പതിവ് ചോദ്യങ്ങൾ',
    'home.faq.intro':
      'ദൈനംദിന 3 മണി നറുക്കെടുപ്പ് സമയം, പ്രതിവാര പദ്ധതികൾ, സമ്മാന ക്ലെയിം ക്രമം, നികുതി, സർക്കാർ ഗസറ്റ് പരിശോധന എന്നിവയെക്കുറിച്ചുള്ള വ്യക്തമായ ഉത്തരങ്ങൾ.',
    'home.faq.count': '{count} ചോദ്യങ്ങൾക്ക് ഉത്തരം',
    'home.faq.topic': 'വിഷയം: {topic}',

    'home.find.title': 'ഏതെങ്കിലും മുൻ ഫലം തിരയുക',
    'home.find.intro':
      'നറുക്കെടുപ്പ് തീയതി തിരഞ്ഞെടുക്കുക, അല്ലെങ്കിൽ ഒരു പദ്ധതിയിലേക്ക് ചുരുക്കുക — ശേഖരിച്ച ഫലം തുറക്കാം.',
    'home.find.previous': 'മുൻ ഫലങ്ങൾ',
    'home.find.archive': 'പൂർണ്ണ ശേഖരം',
    'home.schemes.intro': 'പ്രതിവാര, ബംപർ പദ്ധതികൾ, ടിക്കറ്റ് വിലകൾ, പ്രധാന സമ്മാനങ്ങൾ.',
    'home.schemes.all': 'എല്ലാ പദ്ധതികളും',
    'home.news.intro': 'ഗസറ്റ് പ്രസിദ്ധീകരണങ്ങൾ, ഷെഡ്യൂൾ മാറ്റങ്ങൾ, സമ്മാന പ്രഖ്യാപനങ്ങൾ.',
    'home.news.all': 'എല്ലാ വാർത്തകളും',
    'home.trust.eyebrow': 'സർക്കാർ പരിശോധനയും ഘടനയും',
    'home.trust.badge': '4 ഘട്ട പരിശോധന',
    'home.trust.venue_label': 'നറുക്കെടുപ്പ് വേദി',
    'home.trust.venue': 'ഗോർക്കി ഭവൻ, തിരുവനന്തപുരം',
    'home.trust.source_label': 'പരിശോധനാ സ്രോതസ്സ്',
    'home.trust.source': 'ഔദ്യോഗിക സർക്കാർ ഗസറ്റ്',
    'home.trust.stage': 'ഘട്ടം {n} / 4 പൂർത്തിയായി',

    'home.sidebar.tools_aria': 'ഫല ഉപകരണങ്ങളും നാവിഗേഷനും',
    'home.sidebar.check_title': 'ടിക്കറ്റ് നമ്പർ പരിശോധിക്കുക',
    'home.sidebar.number_aria': 'കേരള ഭാഗ്യക്കുറി ടിക്കറ്റ് നമ്പർ',
    'home.sidebar.placeholder': 'ഉദാ: 1234 അല്ലെങ്കിൽ KN',
    'home.sidebar.search': 'തിരയുക',
    'home.sidebar.scan': 'അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിച്ച് ടിക്കറ്റ് സ്കാൻ ചെയ്യുക',
    'home.sidebar.lotteries': 'കേരള ഭാഗ്യക്കുറികൾ',
    'home.sidebar.all_schemes': 'എല്ലാ പദ്ധതികളും വിലകളും പ്രധാന സമ്മാനങ്ങളും',
    'home.sidebar.recent': 'സമീപകാല ഫല അപ്ഡേറ്റുകൾ',
    'home.sidebar.all_previous': 'എല്ലാ മുൻ ഫലങ്ങളും',
  },

  ta: {
    'home.h1.title': 'இன்றைய கேரளா லாட்டரி முடிவு — மாலை 3 மணிக்கு நேரலை',
    'home.h1.intro':
      'இன்றைய கேரளா லாட்டரி முடிவு: மாலை 3 மணி நேரலை குலுக்கல், முதல் பரிசு, முழு பரிசுப் பட்டியல், குலுக்கல் எண், தேதி, தொடர் குறியீடுகள் மற்றும் முந்தைய முடிவுகள் — அனைத்தும் அதிகாரப்பூர்வ கேரளா அரசு கெசட்டுடன் சரிபார்க்கப்பட்டது.',

    'home.next.eyebrow': 'அடுத்த குலுக்கல்',
    'home.next.publishes_at': '{time} IST-க்கு வெளியிடப்படும்',
    'home.next.published': 'இன்றைய முடிவு வெளியிடப்பட்டது',
    'home.next.checking': 'குலுக்கல் நடைபெறுகிறது — முடிவு வெளியிடப்படுகிறது',
    'home.next.delayed': 'இன்றைய முடிவு இன்னும் வெளியிடப்படவில்லை',
    'home.next.hours': 'மணி',
    'home.next.minutes': 'நிமிடம்',
    'home.next.seconds': 'வினாடி',

    'home.latest.badge_today': 'இன்று வெளியிடப்பட்ட முடிவு',
    'home.latest.badge_latest': 'சமீபத்தில் வெளியிடப்பட்ட முடிவு',
    'home.latest.provisional': 'நேரலை ஆதாரம் · கெசட்டுக்காகக் காத்திருக்கிறது',
    'home.latest.official': 'அதிகாரப்பூர்வ கெசட் சான்றளித்தது',
    'home.latest.heading': '{name} ({draw}) முடிவு',
    'home.latest.meta_draw_number': 'குலுக்கல் எண்',
    'home.latest.meta_draw_date': 'குலுக்கல் தேதி',
    'home.latest.meta_draw_day': 'குலுக்கல் நாள்',
    'home.latest.meta_update_time': 'புதுப்பிப்பு நேரம்',
    'home.latest.view_full': 'முழு முடிவைக் காண்க',
    'home.latest.all_draws': '{date} அன்றைய அனைத்து குலுக்கல்கள்',
    'home.latest.gazette_pdf': 'அதிகாரப்பூர்வ கெசட் PDF',
    'home.latest.permalink': 'நிரந்தர இணைப்பு',
    'home.latest.updated': '{timestamp}-இல் சரிபார்க்கப்பட்டு கடைசியாக புதுப்பிக்கப்பட்டது.',
    'home.latest.series_codes': 'இன்றைய லாட்டரி தொடர் குறியீடுகள்',
    'home.latest.syncing_body':
      'சமீபத்திய குலுக்கல் பெறப்படுகிறது. கேரளா முடிவுகள் தினமும் மாலை 3:00 IST-க்கு வெளியிடப்படும்.',

    'home.tools.title': 'கேரளா லாட்டரி டிக்கெட் ஸ்கேனர் & செக்கர்',
    'home.tools.body':
      'குலுக்கலைத் தேர்ந்தெடுத்து டிக்கெட் எண்ணை உள்ளிடுங்கள், அல்லது கேமராவால் டிக்கெட்டை ஸ்கேன் செய்யுங்கள் — சான்றளிக்கப்பட்ட முடிவுடன் அனைத்து பரிசு நிலைகளையும் சரிபார்க்கலாம்.',
    'home.tools.open': 'டிக்கெட் ஸ்கேனர் பக்கத்தைத் திறக்கவும்',
    'home.tools.gazette_title': 'இந்தப் பக்கத்தின் ஒவ்வொரு எண்ணும் கெசட்டிலிருந்து வருகிறது',
    'home.tools.gazette_body':
      'முடிவுகள், பரிசு நிலைகள், வெற்றி எண்கள் ஆகியவை அதிகாரப்பூர்வ லோட்டிஸ் அறிவிப்புகள் மற்றும் கேரளா அரசு கெசட் PDF-களிலிருந்து சேமிக்கப்பட்டு நிலையான HTML ஆக வெளியிடப்படுகின்றன.',
    'home.tools.browse': 'முடிவுகள் காப்பகத்தைப் பார்க்கவும்',

    'home.chart.heading': '{scheme} பரிசுப் பட்டியல்',
    'home.chart.permalink': 'நிரந்தர இணைப்பு',
    'home.chart.print': 'அச்சிடு',
    'home.chart.empty':
      'இந்தக் குலுக்கலின் பரிசுப் பட்டியல் இன்னும் அதிகாரப்பூர்வ கெசட்டுடன் சரிபார்க்கப்படுகிறது.',
    'home.chart.ending_banner': 'கீழ்க்கண்ட எண்களில் முடியும் டிக்கெட்டுகளுக்கு',
    'home.chart.consolation_note': 'மீதமுள்ள தொடர்களில் இதே எண்',
    'home.chart.provisional':
      'அதிகாரப்பூர்வமற்ற ஆதாரத்திலிருந்து நேரலை எண்கள் — அதிகாரப்பூர்வ கெசட் இன்னும் வெளியிடப்படவில்லை.',
    'home.chart.official':
      'அதிகாரப்பூர்வ முடிவு ஆதாரம்: கேரளா மாநில லாட்டரி இயக்ககம் (கேரளா அரசு கெசட்).',
    'home.chart.gazette_pdf': 'கெசட் PDF',
    'home.chart.structure': 'பரிசு அமைப்பு விளக்கம்',
    'home.chart.ending_note': 'கடைசி {digits} இலக்கங்கள் {count} முறை குலுக்கப்படும்',
    'home.chart.digit_1': 'ஒரு',
    'home.chart.digit_2': 'இரண்டு',
    'home.chart.digit_3': 'மூன்று',
    'home.chart.digit_4': 'நான்கு',
    'home.chart.digit_5': 'ஐந்து',

    'home.schedule.title': 'கேரளா லாட்டரி வாராந்திர அட்டவணை',
    'home.schedule.intro':
      'கேரளாவில் வாரத்திற்கு ஏழு லாட்டரிகள் நடத்தப்படுகின்றன, ஒவ்வொரு நாளுக்கும் ஒன்று. ஒவ்வொன்றுக்கும் தனி குலுக்கல் எண் தொடர் உள்ளது; பரிசு வகைகள் ஒரே மாதிரியானவை என்றாலும் தொகைகள் வேறுபடும். குலுக்கல்கள் திருவனந்தபுரம் கோர்க்கி பவனில் மாலை 3:00 IST-க்கு நடைபெறும்.',
    'home.schedule.today_in': 'இன்று கேரளாவில்:',
    'home.schedule.note':
      'தினசரி அட்டவணை · மாலை 3:00 IST-க்கு குலுக்கல் · லோட்டிஸ் சரிபார்த்த முடிவுகள் 4:00 IST-க்கு வெளியிடப்படும்.',
    'home.schedule.caption':
      'கேரளா மாநில லாட்டரி வாராந்திர அட்டவணை: நாள், திட்டம், குறியீடு, குலுக்கல் நேரம், டிக்கெட் விலை மற்றும் முதல் பரிசு.',
    'home.schedule.col_day': 'குலுக்கல் நாள்',
    'home.schedule.col_scheme': 'லாட்டரி திட்டம்',
    'home.schedule.col_code': 'குறியீடு',
    'home.schedule.col_price': 'டிக்கெட் விலை',
    'home.schedule.col_first_prize': 'முதல் பரிசு',
    'home.schedule.col_action': 'திட்டம்',
    'home.schedule.today_chip': 'இன்று',
    'home.schedule.view': 'பார்',
    'home.schedule.view_aria': '{name} முடிவுகள் மற்றும் அட்டவணையைப் பார்க்கவும்',
    'home.schedule.bumper_note_before':
      'பம்பர் குலுக்கல் தேதிகள் ஒவ்வொரு ஆண்டும் சிறிது மாறும் — இந்த ஆண்டின் நாட்காட்டியை உறுதிசெய்யுங்கள்',
    'home.schedule.bumper_note_link': 'குலுக்கல் அட்டவணை பக்கம்',

    'home.bumper.title': 'கேரளா பம்பர் லாட்டரிகள்',
    'home.bumper.intro': '₹25 கோடி வரை ஜாக்பாட் கொண்ட பருவகால பம்பர் குலுக்கல்கள்.',
    'home.bumper.first_prize': 'முதல் பரிசு',
    'home.bumper.ticket': 'டிக்கெட்',
    'home.bumper.season_thiruvonam': 'செப்டம்பர் (ஓணம்)',
    'home.bumper.season_xmas': 'ஜனவரி (புத்தாண்டு)',
    'home.bumper.season_vishu': 'மே (விஷு)',
    'home.bumper.season_pooja': 'நவம்பர் (பூஜை)',
    'home.bumper.season_monsoon': 'ஜூலை (பருவமழை)',
    'home.bumper.season_summer': 'மார்ச் (கோடை)',

    'home.claim.title': 'கேரளா லாட்டரி பரிசுப் பணத்தை எப்படிப் பெறுவது',
    'home.claim.intro':
      'பரிசுத் தொகை, வரி விலக்கு, டிக்கெட் பாதுகாப்பு ஆகியவற்றுக்கான கேரளா மாநில லாட்டரி இயக்ககத்தின் நடைமுறை. ஏழு வாராந்திர திட்டங்களுக்கும் பம்பர் குலுக்கல்களுக்கும் ஒரே விதிகள் பொருந்தும்.',
    'home.claim.s1.eyebrow': 'படி 01: டிக்கெட்டைப் பாதுகாக்கவும்',
    'home.claim.s1.title': 'அசல் டிக்கெட்டில் கையெழுத்திடுங்கள்',
    'home.claim.s1.body':
      'அசல் டிக்கெட்டின் பின்புறம் உங்கள் முழு சட்டப்பூர்வ பெயர், நிரந்தர முகவரி, கையொப்பம் ஆகியவற்றை எழுதுங்கள். பார்கோடு பகுதியை ஒருபோதும் மாற்றவோ, ஸ்டேபிள் செய்யவோ, மடக்கவோ வேண்டாம்; இரண்டு எழுத்து தொடர் குறியீடு மற்றும் ஆறு இலக்க எண்ணை அதிகாரப்பூர்வ லோட்டிஸ் கெசட்டுடன் சரிபார்க்கவும்.',
    'home.claim.s1.note': 'சேதமில்லாத அசல் டிக்கெட் தேவை.',
    'home.claim.s2.eyebrow': 'படி 02: ₹1,00,000-க்குக் கீழ் பரிசுகள்',
    'home.claim.s2.title': 'விற்பனையாளர் அல்லது மாவட்ட அலுவலகத்தில் பெறுங்கள்',
    'home.claim.s2.body':
      '₹1,00,000 வரையிலான பரிசுகளை உரிமம் பெற்ற கேரளா லாட்டரி விற்பனையாளர் அல்லது மாவட்ட லாட்டரி அலுவலகம் வழியாக பணமாக்கலாம். விற்பனையாளர்கள் சட்டப்பூர்வ கமிஷனைப் பிடித்து மீதித் தொகையை உடனே வழங்குவார்கள்.',
    'home.claim.s2.note': '14 மாவட்ட லாட்டரி அலுவலகங்கள்.',
    'home.claim.s3.eyebrow': 'படி 03: ₹1,00,000-க்கு மேல் பரிசுகள்',
    'home.claim.s3.title': 'இயக்ககம் மற்றும் வங்கியில் சமர்ப்பிக்கவும்',
    'home.claim.s3.body':
      'உயர் பரிசுகளுக்கு அசல் வெற்றி டிக்கெட், பூர்த்தி செய்த விண்ணப்பம், சுய சான்றளித்த PAN அட்டை, ஆதார் அட்டை, இரண்டு பாஸ்போர்ட் புகைப்படங்கள், ரத்து செய்த வங்கிக் காசோலை ஆகியவற்றை திருவனந்தபுரத்தில் உள்ள கேரளா மாநில லாட்டரி இயக்ககத்தில் அல்லது அங்கீகரிக்கப்பட்ட வங்கி வழியாக சமர்ப்பிக்க வேண்டும்.',
    'home.claim.s3.note': 'நேரடி வங்கிப் பரிவர்த்தனை (NEFT/RTGS) மூலம் வழங்கப்படும்.',
    'home.claim.s4.eyebrow': 'விதி 04: வரிகள் மற்றும் காலக்கெடு',
    'home.claim.s4.title': 'TDS மற்றும் உரிமைகோரல் காலம்',
    'home.claim.s4.body':
      'பரிசுத் தொகையிலிருந்து மூலத்தில் வரி (TDS) பிடிக்கப்படும்; ஏஜென்ட் கமிஷனும் தொகை வரவு வைக்கப்படும் முன் பிடிக்கப்படும். குலுக்கல் தேதியிலிருந்து சட்டப்பூர்வ காலத்திற்குள் உரிமைகோரல் சமர்ப்பிக்க வேண்டும்; இல்லையேல் தொகை காலாவதியாகும்.',
    'home.claim.s4.note': 'சட்டப்பூர்வ காலக்கெடுவுக்குள் உரிமைகோரவும்.',
    'home.claim.legal_before':
      'உரிமைகோரல் வரம்புகள், ஆவணங்கள், வரி விகிதங்கள் கேரளா அரசு மற்றும் இந்திய வருமான வரிச் சட்டத்தால் நிர்ணயிக்கப்படுகின்றன, அவை மாறலாம். உரிமைகோரல் சமர்ப்பிக்கும் முன் தற்போதைய விதிகளை உறுதிசெய்ய',
    'home.claim.legal_link': 'அதிகாரப்பூர்வ உரிமைகோரல் வழிமுறைகளைப்',
    'home.claim.legal_after': 'பார்க்கவும்.',

    'home.verify.title': 'கேரளா லாட்டரி முடிவை எப்படிச் சரிபார்ப்பது',
    'home.verify.intro':
      'இங்கு வெளியிடப்படும் முடிவுத் தகவல் ஒரு சுயாதீனக் குறிப்பு மட்டுமே. உரிமைகோரலைத் தீர்மானிக்கும் ஆவணம் அதிகாரப்பூர்வ முடிவு வெளியீடுதான்; எனவே இந்தப் பக்கத்தை விரைவான சரிபார்ப்பாகவும் கெசட்டை இறுதி முடிவாகவும் கருதுங்கள்.',
    'home.verify.step_1': 'உங்கள் டிக்கெட்டில் உள்ள லாட்டரி பெயரைச் சரிபார்க்கவும்.',
    'home.verify.step_2': 'குலுக்கல் எண்ணை உறுதிசெய்யவும்.',
    'home.verify.step_3': 'குலுக்கல் தேதியை உறுதிசெய்யவும்.',
    'home.verify.step_4': 'உங்கள் டிக்கெட் எண்ணை வெளியிடப்பட்ட வெற்றி எண்களுடன் ஒப்பிடுங்கள்.',
    'home.verify.step_5': 'உங்கள் டிக்கெட் எந்தப் பரிசு வகையில் வருகிறது எனப் பார்க்கவும்.',
    'home.verify.step_6': 'தொடர்புடைய அதிகாரப்பூர்வ கெசட் வெளியீட்டுடன் முடிவைச் சரிபார்க்கவும்.',
    'home.verify.source':
      'அதிகாரப்பூர்வ முடிவு ஆதாரம்: கேரளா மாநில லாட்டரி இயக்ககம் (கேரளா அரசு கெசட்).',
    'home.verify.guides': 'சரிபார்ப்பு வழிகாட்டிகள்',
    'home.verify.disclaimer': 'பொறுப்புத் துறப்பு & உரிமைகோரல் விதிகள்',
    'home.verify.archive': 'முடிவுகள் காப்பகம்',

    'home.win.title': 'கேரளா லாட்டரி பரிசு வென்ற பிறகு என்ன செய்வது',
    'home.win.body1':
      'உங்கள் டிக்கெட் வெற்றி எண்ணுடன் பொருந்தினால் முதலில் எல்லாவற்றையும் மீண்டும் சரிபார்க்கவும்: லாட்டரி பெயர், குலுக்கல் எண், தேதி, பரிசு வகை. முடிவின்படி செயல்படும் முன் இவை அனைத்தையும் அதிகாரப்பூர்வ கேரளா அரசு கெசட் வெளியீட்டுடன் ஒப்பிடுங்கள்.',
    'home.win.body2':
      'அசல் டிக்கெட்டை பாதுகாப்பாகவும் சேதமில்லாமலும் வைத்திருங்கள் — சேதமடைந்த அல்லது கிழிந்த டிக்கெட் உரிமைகோரலைத் தாமதப்படுத்தலாம் அல்லது செல்லாததாக்கலாம். பின்னர் தற்போதைய உரிமைகோரல் விதிகள், தேவையான ஆவணங்கள், சமர்ப்பிக்க வேண்டிய காலக்கெடு ஆகியவற்றை உறுதிசெய்யுங்கள்.',
    'home.win.check': 'மற்றொரு டிக்கெட்டைச் சரிபார்க்கவும்',
    'home.win.prizes': 'பரிசுத் தொகைகள் & நிலைகள்',
    'home.win.today': 'இன்றைய முடிவு',

    'home.bumpercards.title': 'கேரளா பம்பர் லாட்டரி',
    'home.bumpercards.body':
      'ஏழு வாராந்திர குலுக்கல்களுடன், கேரளா மாநில லாட்டரி கோடிக் கணக்கில் ஜாக்பாட் கொண்ட பருவகால பம்பர் குலுக்கல்களையும் நடத்துகிறது. பம்பர் டிக்கெட்டுகள் வாராந்திர டிக்கெட்டை விட விலை அதிகம், பரிசுத் தொகைகளும் பெரியவை, ஆனால் விதிகள் ஒன்றே: குலுக்கல் தேதியிலிருந்து சட்டப்பூர்வ காலத்திற்குள் உரிமைகோரல் சமர்ப்பிக்க வேண்டும், வழக்கமான TDS பொருந்தும்.',
    'home.bumpercards.note_before':
      'சரியான பம்பர் குலுக்கல் தேதிகள் ஒவ்வொரு ஆண்டும் சிறிது மாறும் — இந்த ஆண்டின் அதிகாரப்பூர்வ நாட்காட்டியைப் பயன்படுத்துங்கள்.',
    'home.bumpercards.note_link': 'குலுக்கல் அட்டவணையைப் பார்க்கவும்',

    'home.about.title': 'KeralaDraws பற்றி',
    'home.about.body1':
      'KeralaDraws கேரளா மாநில லாட்டரி முடிவுகளுக்கான சுயாதீன தகவல் இணையதளம். தினசரி முடிவுகள், வாராந்திர குலுக்கல் அட்டவணை, பரிசு விவரங்கள், டிக்கெட் சரிபார்ப்பு வழிகாட்டிகள் ஆகியவற்றை வெளியிடுகிறது.',
    'home.about.body2':
      'இது கேரளா அரசு, கேரளா மாநில லாட்டரி இயக்ககம் அல்லது எந்த அதிகாரப்பூர்வ லாட்டரி அமைப்புடனும் தொடர்புடையது அல்ல. இங்கு வெளியிடப்படுவது பொதுவான குறிப்புத் தகவல். வெற்றியாளர்கள் தங்கள் டிக்கெட்டுகளை அதிகாரப்பூர்வ கேரளா அரசு கெசட்டுடன் எப்போதும் சரிபார்க்க வேண்டும்.',
    'home.about.verified_label': 'சரிபார்க்கப்பட்டது:',
    'home.about.verified_body':
      '{subject}அதிகாரப்பூர்வ கேரளா அரசு கெசட் PDF-உடன் சரிபார்க்கப்பட்டுள்ளது.',
    'home.about.latest_result': 'சமீபத்திய முடிவு ',
    'home.about.updated': ' கடைசியாக புதுப்பிக்கப்பட்டது {timestamp}.',
    'home.about.notice_label': 'முக்கிய அறிவிப்பு:',
    'home.about.notice_body':
      'கேரளாவில் லாட்டரி டிக்கெட்டுகளின் ஆன்லைன் விற்பனையும் வாங்குதலும் தடைசெய்யப்பட்டுள்ளது. அங்கீகரிக்கப்பட்ட முகவர்கள் மற்றும் விற்பனையாளர்களிடமிருந்து வாங்கும் உடல் டிக்கெட்டுகள் மட்டுமே செல்லுபடியாகும். இந்த இணையதளம் முடிவுகள் மற்றும் தகவல்களுக்கு மட்டுமே — இது டிக்கெட்டுகளை விற்காது, ஆன்லைன் வாங்குதலை நடத்தாது. பரிசை உரிமைகோரும் முன் டிக்கெட்டை அதிகாரப்பூர்வ கெசட் முடிவுடன் சரிபார்க்கவும்.',
    'home.about.link_about': 'எங்களைப் பற்றி',
    'home.about.link_contact': 'தொடர்பு',
    'home.about.link_privacy': 'தனியுரிமைக் கொள்கை',
    'home.about.link_portal': 'அதிகாரப்பூர்வ லோட்டிஸ் இணையதளம்',

    'home.faq.title': 'கேரளா லாட்டரி முடிவுகள் & சரிபார்ப்பு கேள்விகள்',
    'home.faq.intro':
      'தினசரி மாலை 3 மணி குலுக்கல் நேரம், வாராந்திர திட்டங்கள், பரிசு உரிமைகோரல் நடைமுறை, வரிகள், அரசு கெசட் சரிபார்ப்பு பற்றிய தெளிவான பதில்கள்.',
    'home.faq.count': '{count} கேள்விகளுக்குப் பதில்',
    'home.faq.topic': 'தலைப்பு: {topic}',

    'home.find.title': 'எந்த முந்தைய முடிவையும் தேடுங்கள்',
    'home.find.intro':
      'குலுக்கல் தேதியைத் தேர்ந்தெடுக்கவும், அல்லது ஒரு திட்டத்திற்கு சுருக்கவும் — காப்பகப்படுத்தப்பட்ட முடிவைத் திறக்கலாம்.',
    'home.find.previous': 'முந்தைய முடிவுகள்',
    'home.find.archive': 'முழு காப்பகம்',
    'home.schemes.intro': 'வாராந்திர மற்றும் பம்பர் திட்டங்கள், டிக்கெட் விலைகள், முதன்மை பரிசுகள்.',
    'home.schemes.all': 'அனைத்து திட்டங்களும்',
    'home.news.intro': 'கெசட் வெளியீடுகள், அட்டவணை மாற்றங்கள், பரிசு அறிவிப்புகள்.',
    'home.news.all': 'அனைத்து செய்திகளும்',
    'home.trust.eyebrow': 'அரசு சரிபார்ப்பு & கட்டமைப்பு',
    'home.trust.badge': '4-நிலை சரிபார்ப்பு',
    'home.trust.venue_label': 'குலுக்கல் இடம்',
    'home.trust.venue': 'கோர்க்கி பவன், திருவனந்தபுரம்',
    'home.trust.source_label': 'தணிக்கை ஆதாரம்',
    'home.trust.source': 'அதிகாரப்பூர்வ அரசு கெசட்',
    'home.trust.stage': 'நிலை {n} / 4 முடிந்தது',

    'home.sidebar.tools_aria': 'முடிவு கருவிகள் மற்றும் வழிசெலுத்தல்',
    'home.sidebar.check_title': 'டிக்கெட் எண்ணைச் சரிபார்க்கவும்',
    'home.sidebar.number_aria': 'கேரளா லாட்டரி டிக்கெட் எண்',
    'home.sidebar.placeholder': 'எ.கா. 1234 அல்லது KN',
    'home.sidebar.search': 'தேடு',
    'home.sidebar.scan': 'அல்லது கேமராவால் டிக்கெட்டை ஸ்கேன் செய்யுங்கள்',
    'home.sidebar.lotteries': 'கேரளா லாட்டரிகள்',
    'home.sidebar.all_schemes': 'அனைத்து திட்டங்கள், விலைகள் & முதல் பரிசுகள்',
    'home.sidebar.recent': 'சமீபத்திய முடிவு புதுப்பிப்புகள்',
    'home.sidebar.all_previous': 'அனைத்து முந்தைய முடிவுகள்',
  },

  hi: {
    'home.h1.title': 'आज का केरल लॉटरी परिणाम — शाम 3 बजे लाइव',
    'home.h1.intro':
      'आज का केरल लॉटरी परिणाम: शाम 3 बजे का लाइव ड्रॉ, प्रथम पुरस्कार, पूरी पुरस्कार सूची, ड्रॉ नंबर, तारीख, सीरीज़ कोड और पिछले परिणाम — सब कुछ आधिकारिक केरल सरकार राजपत्र से मिलाकर जाँचा गया।',

    'home.next.eyebrow': 'अगला ड्रॉ',
    'home.next.publishes_at': '{time} IST पर प्रकाशित होगा',
    'home.next.published': 'आज का परिणाम प्रकाशित हो गया',
    'home.next.checking': 'ड्रॉ चल रहा है — परिणाम प्रकाशित किया जा रहा है',
    'home.next.delayed': 'आज का परिणाम अभी प्रकाशित नहीं हुआ',
    'home.next.hours': 'घंटे',
    'home.next.minutes': 'मिनट',
    'home.next.seconds': 'सेकंड',

    'home.latest.badge_today': 'आज प्रकाशित परिणाम',
    'home.latest.badge_latest': 'नवीनतम प्रकाशित परिणाम',
    'home.latest.provisional': 'लाइव स्रोत · राजपत्र की प्रतीक्षा',
    'home.latest.official': 'आधिकारिक राजपत्र प्रमाणित',
    'home.latest.heading': '{name} ({draw}) परिणाम',
    'home.latest.meta_draw_number': 'ड्रॉ नंबर',
    'home.latest.meta_draw_date': 'ड्रॉ तारीख',
    'home.latest.meta_draw_day': 'ड्रॉ दिन',
    'home.latest.meta_update_time': 'अपडेट समय',
    'home.latest.view_full': 'पूरा परिणाम देखें',
    'home.latest.all_draws': '{date} के सभी ड्रॉ',
    'home.latest.gazette_pdf': 'आधिकारिक राजपत्र PDF',
    'home.latest.permalink': 'स्थायी लिंक',
    'home.latest.updated': '{timestamp} पर सत्यापित और अंतिम बार अपडेट किया गया।',
    'home.latest.series_codes': 'आज के लॉटरी सीरीज़ कोड',
    'home.latest.syncing_body':
      'नवीनतम ड्रॉ प्राप्त किया जा रहा है। केरल के परिणाम हर दिन शाम 3:00 IST पर प्रकाशित होते हैं।',

    'home.tools.title': 'केरल लॉटरी टिकट स्कैनर और चेकर',
    'home.tools.body':
      'ड्रॉ चुनें और टिकट नंबर लिखें, या कैमरे से टिकट स्कैन करें — प्रमाणित परिणाम के साथ हर पुरस्कार श्रेणी जाँचें।',
    'home.tools.open': 'टिकट स्कैनर पेज खोलें',
    'home.tools.gazette_title': 'इस पेज का हर नंबर राजपत्र से है',
    'home.tools.gazette_body':
      'परिणाम, पुरस्कार श्रेणियाँ और विजेता नंबर आधिकारिक लोटिस सूचनाओं और केरल सरकार राजपत्र PDF से सहेजकर स्टैटिक HTML के रूप में प्रकाशित किए जाते हैं।',
    'home.tools.browse': 'परिणाम संग्रह देखें',

    'home.chart.heading': '{scheme} पुरस्कार सूची',
    'home.chart.permalink': 'स्थायी लिंक',
    'home.chart.print': 'प्रिंट',
    'home.chart.empty': 'इस ड्रॉ की पुरस्कार सूची अभी आधिकारिक राजपत्र से जाँची जा रही है।',
    'home.chart.ending_banner': 'नीचे दिए नंबरों पर समाप्त होने वाले टिकटों के लिए',
    'home.chart.consolation_note': 'बाकी सीरीज़ में वही नंबर',
    'home.chart.provisional':
      'अनौपचारिक स्रोत से लाइव नंबर — आधिकारिक राजपत्र अभी प्रकाशित नहीं हुआ।',
    'home.chart.official':
      'आधिकारिक परिणाम स्रोत: केरल राज्य लॉटरी निदेशालय (केरल सरकार राजपत्र)।',
    'home.chart.gazette_pdf': 'राजपत्र PDF',
    'home.chart.structure': 'पुरस्कार संरचना समझाई गई',
    'home.chart.ending_note': 'अंतिम {digits} अंक {count} बार निकाले जाएंगे',
    'home.chart.digit_1': 'एक',
    'home.chart.digit_2': 'दो',
    'home.chart.digit_3': 'तीन',
    'home.chart.digit_4': 'चार',
    'home.chart.digit_5': 'पाँच',

    'home.schedule.title': 'केरल लॉटरी साप्ताहिक समय-सारिणी',
    'home.schedule.intro':
      'केरल में हर सप्ताह सात लॉटरी होती हैं, हर दिन के लिए एक। हर एक की अपनी ड्रॉ नंबर श्रृंखला है; पुरस्कार श्रेणियाँ समान हैं पर राशियाँ अलग। ड्रॉ तिरुवनंतपुरम के गोर्की भवन में शाम 3:00 IST पर होते हैं।',
    'home.schedule.today_in': 'आज केरल में:',
    'home.schedule.note':
      'दैनिक समय-सारिणी · शाम 3:00 IST पर ड्रॉ · लोटिस सत्यापित परिणाम 4:00 IST तक प्रकाशित।',
    'home.schedule.caption':
      'केरल राज्य लॉटरी साप्ताहिक ड्रॉ समय-सारिणी: दिन, योजना, कोड, ड्रॉ समय, टिकट मूल्य और प्रथम पुरस्कार।',
    'home.schedule.col_day': 'ड्रॉ दिन',
    'home.schedule.col_scheme': 'लॉटरी योजना',
    'home.schedule.col_code': 'कोड',
    'home.schedule.col_price': 'टिकट मूल्य',
    'home.schedule.col_first_prize': 'प्रथम पुरस्कार',
    'home.schedule.col_action': 'योजना',
    'home.schedule.today_chip': 'आज',
    'home.schedule.view': 'देखें',
    'home.schedule.view_aria': '{name} के परिणाम और समय-सारिणी देखें',
    'home.schedule.bumper_note_before':
      'बंपर ड्रॉ की तारीखें हर साल थोड़ी बदलती हैं — इस वर्ष का कैलेंडर जाँचें',
    'home.schedule.bumper_note_link': 'ड्रॉ समय-सारिणी पेज',

    'home.bumper.title': 'केरल बंपर लॉटरी',
    'home.bumper.intro': '₹25 करोड़ तक जैकपॉट वाले मौसमी बंपर ड्रॉ।',
    'home.bumper.first_prize': 'प्रथम पुरस्कार',
    'home.bumper.ticket': 'टिकट',
    'home.bumper.season_thiruvonam': 'सितंबर (ओणम)',
    'home.bumper.season_xmas': 'जनवरी (नया साल)',
    'home.bumper.season_vishu': 'मई (विषु)',
    'home.bumper.season_pooja': 'नवंबर (पूजा)',
    'home.bumper.season_monsoon': 'जुलाई (मानसून)',
    'home.bumper.season_summer': 'मार्च (गर्मी)',

    'home.claim.title': 'केरल लॉटरी का पुरस्कार पैसा कैसे प्राप्त करें',
    'home.claim.intro':
      'पुरस्कार राशि, कर कटौती और टिकट सुरक्षा के लिए केरल राज्य लॉटरी निदेशालय की प्रक्रिया। सात साप्ताहिक योजनाओं और बंपर ड्रॉ पर समान नियम लागू होते हैं।',
    'home.claim.s1.eyebrow': 'चरण 01: टिकट सुरक्षित रखें',
    'home.claim.s1.title': 'मूल टिकट पर हस्ताक्षर करें',
    'home.claim.s1.body':
      'मूल टिकट के पीछे अपना पूरा कानूनी नाम, स्थायी पता और हस्ताक्षर लिखें। बारकोड वाले हिस्से से छेड़छाड़ न करें, न स्टेपल करें, न मोड़ें, और दो अक्षर का सीरीज़ कोड तथा छह अंकों का नंबर आधिकारिक लोटिस राजपत्र से जाँचें।',
    'home.claim.s1.note': 'बिना क्षति वाला मूल टिकट ज़रूरी है।',
    'home.claim.s2.eyebrow': 'चरण 02: ₹1,00,000 से कम के पुरस्कार',
    'home.claim.s2.title': 'विक्रेता या जिला कार्यालय से प्राप्त करें',
    'home.claim.s2.body':
      '₹1,00,000 तक की पुरस्कार राशि किसी भी लाइसेंस प्राप्त केरल लॉटरी विक्रेता या जिला लॉटरी कार्यालय से भुनाई जा सकती है। विक्रेता अपना कानूनी कमीशन काटकर बाकी राशि तुरंत देते हैं।',
    'home.claim.s2.note': '14 जिला लॉटरी कार्यालय।',
    'home.claim.s3.eyebrow': 'चरण 03: ₹1,00,000 से अधिक के पुरस्कार',
    'home.claim.s3.title': 'निदेशालय और बैंक में जमा करें',
    'home.claim.s3.body':
      'बड़े पुरस्कारों के लिए मूल विजेता टिकट, भरा हुआ दावा आवेदन, स्व-सत्यापित PAN कार्ड, आधार कार्ड, दो पासपोर्ट फोटो और रद्द किया गया बैंक चेक तिरुवनंतपुरम स्थित केरल राज्य लॉटरी निदेशालय में या अधिकृत बैंक के माध्यम से जमा करें।',
    'home.claim.s3.note': 'सीधे बैंक ट्रांसफर (NEFT/RTGS) से भुगतान।',
    'home.claim.s4.eyebrow': 'नियम 04: कर और समय-सीमा',
    'home.claim.s4.title': 'TDS और दावे की अवधि',
    'home.claim.s4.body':
      'पुरस्कार राशि पर स्रोत पर कर (TDS) कटता है, और राशि जमा होने से पहले एजेंट कमीशन भी कटता है। ड्रॉ तारीख से कानूनी अवधि के भीतर दावा जमा करना होगा; अन्यथा राशि समाप्त हो जाती है।',
    'home.claim.s4.note': 'कानूनी समय-सीमा के भीतर दावा करें।',
    'home.claim.legal_before':
      'दावे की सीमाएँ, दस्तावेज़ और कर दरें केरल सरकार तथा भारतीय आयकर कानून तय करते हैं, और वे बदल सकती हैं। दावा जमा करने से पहले वर्तमान नियम',
    'home.claim.legal_link': 'आधिकारिक दावा निर्देशों',
    'home.claim.legal_after': 'से जाँच लें।',

    'home.verify.title': 'केरल लॉटरी परिणाम कैसे सत्यापित करें',
    'home.verify.intro':
      'यहाँ प्रकाशित परिणाम जानकारी एक स्वतंत्र संदर्भ है। दावे का निर्णय संबंधित आधिकारिक परिणाम प्रकाशन से होता है, इसलिए इस पेज को तेज़ जाँच और राजपत्र को अंतिम प्रमाण मानें।',
    'home.verify.step_1': 'अपने टिकट पर लिखी लॉटरी का नाम जाँचें।',
    'home.verify.step_2': 'ड्रॉ नंबर पुष्टि करें।',
    'home.verify.step_3': 'ड्रॉ तारीख पुष्टि करें।',
    'home.verify.step_4': 'अपने टिकट नंबर की तुलना प्रकाशित विजेता नंबरों से करें।',
    'home.verify.step_5': 'देखें आपका टिकट किस पुरस्कार श्रेणी में आता है।',
    'home.verify.step_6': 'परिणाम को संबंधित आधिकारिक राजपत्र प्रकाशन से सत्यापित करें।',
    'home.verify.source':
      'आधिकारिक परिणाम स्रोत: केरल राज्य लॉटरी निदेशालय (केरल सरकार राजपत्र)।',
    'home.verify.guides': 'सत्यापन गाइड',
    'home.verify.disclaimer': 'अस्वीकरण और दावा नियम',
    'home.verify.archive': 'परिणाम संग्रह',

    'home.win.title': 'केरल लॉटरी पुरस्कार जीतने के बाद क्या करें',
    'home.win.body1':
      'अगर आपका टिकट किसी विजेता नंबर से मिलता है तो सबसे पहले सब कुछ दोबारा जाँचें: लॉटरी का नाम, ड्रॉ नंबर, ड्रॉ तारीख और पुरस्कार श्रेणी। परिणाम पर कार्रवाई से पहले इन सबको आधिकारिक केरल सरकार राजपत्र प्रकाशन से मिलाएँ।',
    'home.win.body2':
      'मूल टिकट सुरक्षित और बिना क्षति के रखें — क्षतिग्रस्त या फटा टिकट दावे में देरी कर सकता है या उसे अमान्य कर सकता है। फिर वर्तमान दावा नियम, आवश्यक दस्तावेज़ और राशि के लिए जमा करने की समय-सीमा जाँच लें।',
    'home.win.check': 'दूसरा टिकट जाँचें',
    'home.win.prizes': 'पुरस्कार राशियाँ और श्रेणियाँ',
    'home.win.today': 'आज का परिणाम',

    'home.bumpercards.title': 'केरल बंपर लॉटरी',
    'home.bumpercards.body':
      'सात साप्ताहिक ड्रॉ के साथ केरल राज्य लॉटरी करोड़ों रुपये के जैकपॉट वाले मौसमी बंपर ड्रॉ भी कराती है। बंपर टिकट साप्ताहिक टिकट से महँगे होते हैं और पुरस्कार राशियाँ बड़ी होती हैं, पर नियम वही हैं: ड्रॉ तारीख से कानूनी अवधि में दावा जमा करें और सामान्य TDS लागू होता है।',
    'home.bumpercards.note_before':
      'सटीक बंपर ड्रॉ तारीखें हर साल थोड़ी बदलती हैं — इस वर्ष का आधिकारिक ड्रॉ कैलेंडर देखें।',
    'home.bumpercards.note_link': 'ड्रॉ समय-सारिणी देखें',

    'home.about.title': 'KeralaDraws के बारे में',
    'home.about.body1':
      'KeralaDraws केरल राज्य लॉटरी परिणामों के लिए एक स्वतंत्र सूचना पोर्टल है। यह दैनिक परिणाम, साप्ताहिक ड्रॉ समय-सारिणी, पुरस्कार विवरण और टिकट सत्यापन गाइड प्रकाशित करता है।',
    'home.about.body2':
      'यह केरल सरकार, केरल राज्य लॉटरी निदेशालय या किसी आधिकारिक लॉटरी प्राधिकरण से संबद्ध नहीं है। यहाँ प्रकाशित सब कुछ सामान्य संदर्भ जानकारी है। विजेताओं को अपने टिकट आधिकारिक केरल सरकार राजपत्र से जरूर मिलाने चाहिए।',
    'home.about.verified_label': 'सत्यापित:',
    'home.about.verified_body':
      '{subject}आधिकारिक केरल सरकार राजपत्र PDF से मिलाकर जाँचा गया है।',
    'home.about.latest_result': 'नवीनतम परिणाम ',
    'home.about.updated': ' अंतिम अपडेट {timestamp}।',
    'home.about.notice_label': 'महत्वपूर्ण सूचना:',
    'home.about.notice_body':
      'केरल में लॉटरी टिकटों की ऑनलाइन बिक्री और खरीद पर प्रतिबंध है। केवल अधिकृत एजेंट और विक्रेता से खरीदे गए भौतिक टिकट ही मान्य हैं। यह वेबसाइट केवल परिणाम और जानकारी के लिए है — यह टिकट नहीं बेचती और कोई ऑनलाइन खरीद नहीं करती। पुरस्कार का दावा करने से पहले टिकट को आधिकारिक राजपत्र परिणाम से सत्यापित करें।',
    'home.about.link_about': 'हमारे बारे में',
    'home.about.link_contact': 'संपर्क',
    'home.about.link_privacy': 'गोपनीयता नीति',
    'home.about.link_portal': 'आधिकारिक लोटिस पोर्टल',

    'home.faq.title': 'केरल लॉटरी परिणाम और सत्यापन — सामान्य प्रश्न',
    'home.faq.intro':
      'रोजाना शाम 3 बजे ड्रॉ समय, साप्ताहिक योजनाओं, पुरस्कार दावा प्रक्रिया, कर और सरकारी राजपत्र सत्यापन पर स्पष्ट उत्तर।',
    'home.faq.count': '{count} प्रश्नों के उत्तर',
    'home.faq.topic': 'विषय: {topic}',

    'home.find.title': 'कोई भी पिछला परिणाम खोजें',
    'home.find.intro':
      'ड्रॉ तारीख चुनें, या किसी एक योजना तक सीमित करें, संग्रहीत परिणाम खोलने के लिए।',
    'home.find.previous': 'पिछले परिणाम',
    'home.find.archive': 'पूरा संग्रह',
    'home.schemes.intro': 'साप्ताहिक और बंपर योजनाएँ, टिकट कीमतें और शीर्ष पुरस्कार।',
    'home.schemes.all': 'सभी योजनाएँ',
    'home.news.intro': 'राजपत्र विज्ञप्तियाँ, समय-सारिणी बदलाव और पुरस्कार घोषणाएँ।',
    'home.news.all': 'सभी समाचार',
    'home.trust.eyebrow': 'सरकारी सत्यापन और संरचना',
    'home.trust.badge': '4-चरण सत्यापन',
    'home.trust.venue_label': 'ड्रॉ स्थल',
    'home.trust.venue': 'गोर्की भवन, तिरुवनंतपुरम',
    'home.trust.source_label': 'लेखा परीक्षा स्रोत',
    'home.trust.source': 'आधिकारिक सरकारी राजपत्र',
    'home.trust.stage': 'चरण {n} / 4 पूर्ण',

    'home.sidebar.tools_aria': 'परिणाम उपकरण और नेविगेशन',
    'home.sidebar.check_title': 'टिकट नंबर जाँचें',
    'home.sidebar.number_aria': 'केरल लॉटरी टिकट नंबर',
    'home.sidebar.placeholder': 'जैसे 1234 या KN',
    'home.sidebar.search': 'खोजें',
    'home.sidebar.scan': 'या कैमरे से टिकट स्कैन करें',
    'home.sidebar.lotteries': 'केरल लॉटरी',
    'home.sidebar.all_schemes': 'सभी योजनाएँ, कीमतें और शीर्ष पुरस्कार',
    'home.sidebar.recent': 'हाल के परिणाम अपडेट',
    'home.sidebar.all_previous': 'सभी पिछले परिणाम',
  },
};
