// Type-only import: erased at build time, so `translations.ts` can safely merge
// this module without creating a runtime import cycle.
import type { Language } from '@/lib/translations';

/**
 * Extended UI dictionary: site chrome, homepage sections and tools.
 *
 * Kept separate from the core dictionary in `lib/translations.ts` so the two
 * surfaces can be reviewed independently; `translations.ts` merges these keys
 * into TRANSLATIONS at module load, so `t('home.recent_results')` works exactly
 * like any base key and falls back to English when a value is missing.
 *
 * Long-form editorial copy (news articles, guides) and the statutory text of the
 * legal pages stay in English on purpose — they are content, not chrome.
 */
export const EXTENDED_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': "Home",
    'common.result': "Result",
    'hero.verified_result': "Today's Verified Result",
    'hero.checking_sources': "Checking official sources…",
    'common.loading': 'Loading…',
    'common.read_article': 'Read Article',
    'common.read_full_report': 'Read Full Report',
    'common.open_multi_scanner': 'Open Multi-Scanner',
    'common.details': 'Details',

    'home.stream_eyebrow': 'Chronological Stream',
    'home.recent_results': 'Recent Official Results',
    'home.view_all_results': 'View All Results',
    'home.schemes_eyebrow': 'Weekly & Bumper Schemes',
    'home.active_schemes': 'Active Kerala Lottery Schemes',
    'home.all_schemes': 'All Schemes',
    'home.news_eyebrow': 'Gazette Releases',
    'home.latest_news': 'Latest Lottery News & Reports',
    'home.view_all_news': 'View All News',
    'home.sync_note': 'Results are synchronizing with the official LOTIS gazette database.',

    'hero.eyebrow': "Today's Scheduled Draw",
    'hero.title': 'Kerala State Lottery Result',
    'hero.subtitle':
      'Conducted by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.',
    'hero.awaiting': 'Awaiting Official Publication',
    'hero.not_published': 'Result Not Published Yet',
    'hero.not_published_body':
      "Today's official result has not been published yet. We are checking automatically and will update this page as soon as it becomes available.",
    'hero.check_again': 'Check again now',
    'hero.quick_jump': 'Quick Jump:',
    'hero.today_draw': "Today's Draw",
    'hero.yesterday': 'Yesterday',
    'hero.scheduled': 'Scheduled',
    'hero.show_results': 'Show Results',
    'hero.select_scheme': 'Select Lottery Scheme',
    'hero.all_lotteries': 'All Lotteries',
    'hero.select_date': 'Select Draw Date',

    'ticket.eyebrow': 'Financial Lookup Tool',
    'ticket.heading': 'Check Your Tickets',
    'ticket.subheading':
      'Scan barcodes or enter 6-digit series/4-digit slips to verify against official Kerala LOTIS gazette results.',
    'ticket.scheme_label': 'Lottery Scheme',
    'ticket.number_label': 'Ticket Number / Manual Entry',
    'ticket.scan': 'Scan',
    'ticket.all_schemes': 'All Active Schemes',
    'ticket.note':
      'Checks directly against published official Kerala Government LOTIS results.',
    'ticket.multi_cta': 'Need to check multiple tickets? Open Multi-Scanner',
    'ticket.scan_multi': 'Scan Tickets (Multi-Scan)',
    'ticket.verifying': 'Verifying against official published results…',

    'schedule.eyebrow': 'Draw Schedule Timeline',
    'schedule.heading': 'Upcoming Kerala Lottery Draws',
    'schedule.full_calendar': 'Full 2026 Calendar',
    'schedule.today': 'Today',
    'schedule.tomorrow': 'Tomorrow',

    'trust.eyebrow': 'Verification & Integrity Workflow',
    'trust.heading': 'How Kerala Lottery Results Are Synchronized',
    'trust.subheading':
      'An automated, four-stage verification architecture ensuring transparent, accurate, and rapid delivery of official lottery results.',
    'trust.step1_title': 'Official LOTIS Source',
    'trust.step1_body':
      'Draws are conducted under public scrutiny by the Directorate of Kerala State Lotteries at Gorky Bhavan, Thiruvananthapuram.',
    'trust.step2_title': 'Automated Retrieval',
    'trust.step2_body':
      'Our ingestion service connects directly to the official LOTIS publication feed to capture verified draw records. Winning numbers are also shown live from the public source keralalotteries.net the moment they are announced — always labelled unofficial until verified.',
    'trust.step3_title': 'Data Integrity Audit',
    'trust.step3_body':
      'Winning numbers, series distributions, and prize structures are verified against official Gazette PDF documents. Live (unverified) numbers are replaced by the gazette record and can never overwrite it.',
    'trust.step4_title': 'Instant Publication',
    'trust.step4_body':
      'Validated draw results and ticket search indices are published immediately to ensure speed and accuracy.',

    'notify.eyebrow': 'FCM Browser Notifications',
    'notify.heading': 'Get Kerala Lottery Result Alerts',
    'notify.body':
      'Receive an automatic push notification the moment official results are published by the Directorate of Kerala State Lotteries.',
    'notify.enable': 'Enable Notifications',

    'footer.tagline': 'Results, Checker & Alerts',
    'footer.brand_desc':
      'Independent digital information platform delivering fast, verified Kerala State Lottery results synchronized directly with the official LOTIS government portal.',
    'footer.official_portal': 'Official LOTIS Portal',
    'footer.weekly_schemes': 'Weekly Schemes',
    'footer.seasonal_bumpers': 'Seasonal Bumpers',
    'footer.tools_trust': 'Tools & Trust',
    'footer.today_result': "Today's Result",
    'footer.results_archive': 'Results Archive',
    'footer.ticket_checker': 'Ticket Checker',
    'footer.guides': 'Helpful Guides',
    'footer.gazette_news': 'Gazette News',
    'footer.disclaimer_heading': 'Independent Platform Disclaimer:',
    'footer.disclaimer_body1':
      'KeralaDraws is an independent digital information platform and is NOT affiliated with, endorsed by, authorized by, or operated by the Government of Kerala or the Directorate of Kerala State Lotteries.',
    'footer.disclaimer_body2':
      'All draw records, winning numbers, and prize tier statistics published on this website are synchronized automatically from public official LOTIS notices and Kerala Government Gazettes. Ticket holders and prize winners are advised to verify winning tickets with the official published Gazette and claim prizes within 90 days.',
    'footer.rights': 'All rights reserved.',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms',

    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',
  },

  ml: {
    'nav.home': "ഹോം",
    'common.result': "ഫലം",
    'hero.verified_result': "ഇന്നത്തെ സ്ഥിരീകരിച്ച ഫലം",
    'hero.checking_sources': "ഔദ്യോഗിക സ്രോതസ്സുകൾ പരിശോധിക്കുന്നു…",
    'common.loading': 'ലോഡ് ചെയ്യുന്നു…',
    'common.read_article': 'ലേഖനം വായിക്കുക',
    'common.read_full_report': 'പൂർണ്ണ റിപ്പോർട്ട് വായിക്കുക',
    'common.open_multi_scanner': 'മൾട്ടി-സ്കാനർ തുറക്കുക',
    'common.details': 'വിശദാംശങ്ങൾ',

    'home.stream_eyebrow': 'കാലാനുക്രമ പട്ടിക',
    'home.recent_results': 'സമീപകാല ഔദ്യോഗിക ഫലങ്ങൾ',
    'home.view_all_results': 'എല്ലാ ഫലങ്ങളും കാണുക',
    'home.schemes_eyebrow': 'പ്രതിവാര, ബംപർ പദ്ധതികൾ',
    'home.active_schemes': 'നിലവിലുള്ള കേരള ഭാഗ്യക്കുറി പദ്ധതികൾ',
    'home.all_schemes': 'എല്ലാ പദ്ധതികളും',
    'home.news_eyebrow': 'ഗസറ്റ് പ്രസിദ്ധീകരണങ്ങൾ',
    'home.latest_news': 'ഏറ്റവും പുതിയ ഭാഗ്യക്കുറി വാർത്തകളും റിപ്പോർട്ടുകളും',
    'home.view_all_news': 'എല്ലാ വാർത്തകളും കാണുക',
    'home.sync_note': 'ഔദ്യോഗിക ലോട്ടിസ് ഗസറ്റ് ഡാറ്റാബേസുമായി ഫലങ്ങൾ സമന്വയിക്കുന്നു.',

    'hero.eyebrow': 'ഇന്നത്തെ ഷെഡ്യൂൾ ചെയ്ത നറുക്കെടുപ്പ്',
    'hero.title': 'കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലം',
    'hero.subtitle':
      'തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റ് നടത്തുന്നത്.',
    'hero.awaiting': 'ഔദ്യോഗിക പ്രസിദ്ധീകരണത്തിനായി കാത്തിരിക്കുന്നു',
    'hero.not_published': 'ഫലം ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല',
    'hero.not_published_body':
      'ഇന്നത്തെ ഔദ്യോഗിക ഫലം ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല. ഞങ്ങൾ സ്വയമേവ പരിശോധിച്ചുകൊണ്ടിരിക്കുന്നു; ലഭ്യമാകുന്ന മുറയ്ക്ക് ഈ പേജ് പുതുക്കും.',
    'hero.check_again': 'വീണ്ടും പരിശോധിക്കുക',
    'hero.quick_jump': 'വേഗത്തിൽ പോകുക:',
    'hero.today_draw': 'ഇന്നത്തെ നറുക്കെടുപ്പ്',
    'hero.yesterday': 'ഇന്നലെ',
    'hero.scheduled': 'ഷെഡ്യൂൾ ചെയ്തത്',
    'hero.show_results': 'ഫലങ്ങൾ കാണിക്കുക',
    'hero.select_scheme': 'ഭാഗ്യക്കുറി പദ്ധതി തിരഞ്ഞെടുക്കുക',
    'hero.all_lotteries': 'എല്ലാ ഭാഗ്യക്കുറികളും',
    'hero.select_date': 'നറുക്കെടുപ്പ് തീയതി തിരഞ്ഞെടുക്കുക',

    'ticket.eyebrow': 'സാമ്പത്തിക പരിശോധനാ ഉപകരണം',
    'ticket.heading': 'നിങ്ങളുടെ ടിക്കറ്റുകൾ പരിശോധിക്കുക',
    'ticket.subheading':
      'ഔദ്യോഗിക കേരള ലോട്ടിസ് ഗസറ്റ് ഫലങ്ങളുമായി ഒത്തുനോക്കാൻ ബാർകോഡ് സ്കാൻ ചെയ്യുകയോ 6 അക്ക സീരീസ് / അവസാന 4 അക്കങ്ങളോ നൽകുകയോ ചെയ്യുക.',
    'ticket.scheme_label': 'ഭാഗ്യക്കുറി പദ്ധതി',
    'ticket.number_label': 'ടിക്കറ്റ് നമ്പർ / സ്വമേധയാ നൽകൽ',
    'ticket.scan': 'സ്കാൻ ചെയ്യുക',
    'ticket.all_schemes': 'എല്ലാ സജീവ പദ്ധതികളും',
    'ticket.note':
      'പ്രസിദ്ധീകരിച്ച ഔദ്യോഗിക കേരള സർക്കാർ ലോട്ടിസ് ഫലങ്ങളുമായി നേരിട്ട് പരിശോധിക്കുന്നു.',
    'ticket.multi_cta': 'ഒന്നിലധികം ടിക്കറ്റുകൾ പരിശോധിക്കണോ? മൾട്ടി-സ്കാനർ തുറക്കുക',
    'ticket.scan_multi': 'ടിക്കറ്റുകൾ സ്കാൻ ചെയ്യുക (മൾട്ടി-സ്കാൻ)',
    'ticket.verifying': 'ഔദ്യോഗിക ഫലങ്ങളുമായി ഒത്തുനോക്കുന്നു…',

    'schedule.eyebrow': 'നറുക്കെടുപ്പ് സമയപ്പട്ടിക',
    'schedule.heading': 'വരാനിരിക്കുന്ന കേരള ഭാഗ്യക്കുറി നറുക്കെടുപ്പുകൾ',
    'schedule.full_calendar': 'പൂർണ്ണ 2026 കലണ്ടർ',
    'schedule.today': 'ഇന്ന്',
    'schedule.tomorrow': 'നാളെ',

    'trust.eyebrow': 'സ്ഥിരീകരണവും സത്യാവസ്ഥയും',
    'trust.heading': 'കേരള ഭാഗ്യക്കുറി ഫലങ്ങൾ എങ്ങനെ സമന്വയിക്കുന്നു',
    'trust.subheading':
      'സുതാര്യവും കൃത്യവും വേഗതയുള്ളതുമായ ഔദ്യോഗിക ഫല വിതരണം ഉറപ്പാക്കുന്ന നാല് ഘട്ട സ്വയംചാലിത സ്ഥിരീകരണ സംവിധാനം.',
    'trust.step1_title': 'ഔദ്യോഗിക ലോട്ടിസ് സ്രോതസ്സ്',
    'trust.step1_body':
      'തിരുവനന്തപുരം ഗോർക്കി ഭവനിൽ കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റ് പൊതുജന മേൽനോട്ടത്തിൽ നറുക്കെടുപ്പുകൾ നടത്തുന്നു.',
    'trust.step2_title': 'സ്വയംചാലിത ശേഖരണം',
    'trust.step2_body':
      'ഞങ്ങളുടെ ഇൻജെഷൻ സേവനം ഔദ്യോഗിക ലോട്ടിസ് പ്രസിദ്ധീകരണ ഫീഡുമായി നേരിട്ട് ബന്ധിപ്പിച്ച് സ്ഥിരീകരിച്ച നറുക്കെടുപ്പ് രേഖകൾ ശേഖരിക്കുന്നു. പ്രഖ്യാപിക്കുന്ന നിമിഷം തന്നെ കേരള ലോട്ടറീസ്.നെറ്റ് എന്ന പൊതു സ്രോതസ്സിൽ നിന്ന് വിജയ സംഖ്യകൾ തത്സമയം കാണിക്കുന്നു — സ്ഥിരീകരിക്കുന്നതുവരെ അവ അനൗദ്യോഗികമെന്ന് അടയാളപ്പെടുത്തിയിരിക്കും.',
    'trust.step3_title': 'ഡാറ്റ സത്യാവസ്ഥാ ഓഡിറ്റ്',
    'trust.step3_body':
      'വിജയ സംഖ്യകളും സീരീസ് വിതരണവും സമ്മാന ഘടനയും ഔദ്യോഗിക ഗസറ്റ് പിഡിഎഫ് രേഖകളുമായി ഒത്തുനോക്കി പരിശോധിക്കുന്നു. തത്സമയ (സ്ഥിരീകരിക്കാത്ത) സംഖ്യകൾ ഗസറ്റ് രേഖ ഉപയോഗിച്ച് മാറ്റപ്പെടും; അവയ്ക്ക് ഗസറ്റ് രേഖയെ ഒരിക്കലും മറികടക്കാനാവില്ല.',
    'trust.step4_title': 'തൽക്ഷണ പ്രസിദ്ധീകരണം',
    'trust.step4_body':
      'വേഗതയും കൃത്യതയും ഉറപ്പാക്കാൻ സ്ഥിരീകരിച്ച നറുക്കെടുപ്പ് ഫലങ്ങളും ടിക്കറ്റ് തിരയൽ സൂചികകളും ഉടൻ പ്രസിദ്ധീകരിക്കുന്നു.',

    'notify.eyebrow': 'ബ്രൗസർ അറിയിപ്പുകൾ',
    'notify.heading': 'കേരള ഭാഗ്യക്കുറി ഫല അറിയിപ്പുകൾ നേടുക',
    'notify.body':
      'കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റ് ഔദ്യോഗിക ഫലങ്ങൾ പ്രസിദ്ധീകരിക്കുന്ന നിമിഷം സ്വയമേവ ഒരു പുഷ് അറിയിപ്പ് ലഭിക്കും.',
    'notify.enable': 'അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കുക',

    'footer.tagline': 'ഫലങ്ങൾ, പരിശോധന, അറിയിപ്പുകൾ',
    'footer.brand_desc':
      'ഔദ്യോഗിക ലോട്ടിസ് സർക്കാർ പോർട്ടലുമായി നേരിട്ട് സമന്വയിപ്പിച്ച് വേഗത്തിലും സ്ഥിരീകരിച്ചും കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലങ്ങൾ നൽകുന്ന സ്വതന്ത്ര ഡിജിറ്റൽ വിവര പ്ലാറ്റ്ഫോം.',
    'footer.official_portal': 'ഔദ്യോഗിക ലോട്ടിസ് പോർട്ടൽ',
    'footer.weekly_schemes': 'പ്രതിവാര പദ്ധതികൾ',
    'footer.seasonal_bumpers': 'സീസണൽ ബംപറുകൾ',
    'footer.tools_trust': 'ഉപകരണങ്ങളും വിശ്വാസവും',
    'footer.today_result': 'ഇന്നത്തെ ഫലം',
    'footer.results_archive': 'ഫല ശേഖരം',
    'footer.ticket_checker': 'ടിക്കറ്റ് പരിശോധന',
    'footer.guides': 'സഹായക ഗൈഡുകൾ',
    'footer.gazette_news': 'ഗസറ്റ് വാർത്തകൾ',
    'footer.disclaimer_heading': 'സ്വതന്ത്ര പ്ലാറ്റ്ഫോം നിരാകരണം:',
    'footer.disclaimer_body1':
      'KeralaDraws ഒരു സ്വതന്ത്ര ഡിജിറ്റൽ വിവര പ്ലാറ്റ്ഫോമാണ്. കേരള സർക്കാരുമായോ കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഡയറക്ടറേറ്റുമായോ ഇതിന് യാതൊരു ബന്ധവുമില്ല; അവ ഇതിനെ അംഗീകരിക്കുകയോ അധികാരപ്പെടുത്തുകയോ നടത്തുകയോ ചെയ്തിട്ടില്ല.',
    'footer.disclaimer_body2':
      'ഈ വെബ്സൈറ്റിൽ പ്രസിദ്ധീകരിക്കുന്ന എല്ലാ നറുക്കെടുപ്പ് രേഖകളും വിജയ സംഖ്യകളും സമ്മാന വിവരങ്ങളും പൊതു ഔദ്യോഗിക ലോട്ടിസ് അറിയിപ്പുകളിൽ നിന്നും കേരള സർക്കാർ ഗസറ്റുകളിൽ നിന്നും സ്വയമേവ സമന്വയിപ്പിക്കുന്നു. ടിക്കറ്റ് ഉടമകളും വിജയികളും ഔദ്യോഗിക ഗസറ്റിൽ ടിക്കറ്റ് പരിശോധിച്ച് 90 ദിവസത്തിനകം സമ്മാനം ക്ലെയിം ചെയ്യണം.',
    'footer.rights': 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
    'footer.about': 'ഞങ്ങളെക്കുറിച്ച്',
    'footer.contact': 'ബന്ധപ്പെടുക',
    'footer.privacy': 'സ്വകാര്യതാ നയം',
    'footer.terms': 'നിബന്ധനകൾ',

    'day.monday': 'തിങ്കളാഴ്ച',
    'day.tuesday': 'ചൊവ്വാഴ്ച',
    'day.wednesday': 'ബുധനാഴ്ച',
    'day.thursday': 'വ്യാഴാഴ്ച',
    'day.friday': 'വെള്ളിയാഴ്ച',
    'day.saturday': 'ശനിയാഴ്ച',
    'day.sunday': 'ഞായറാഴ്ച',
  },

  ta: {
    'nav.home': "முகப்பு",
    'common.result': "முடிவு",
    'hero.verified_result': "இன்றைய சரிபார்க்கப்பட்ட முடிவு",
    'hero.checking_sources': "அதிகாரப்பூர்வ ஆதாரங்கள் சரிபார்க்கப்படுகின்றன…",
    'common.loading': 'ஏற்றுகிறது…',
    'common.read_article': 'கட்டுரையைப் படிக்க',
    'common.read_full_report': 'முழு அறிக்கையைப் படிக்க',
    'common.open_multi_scanner': 'மல்டி-ஸ்கேனரைத் திறக்க',
    'common.details': 'விவரங்கள்',

    'home.stream_eyebrow': 'காலவரிசைப் பட்டியல்',
    'home.recent_results': 'சமீபத்திய அதிகாரப்பூர்வ முடிவுகள்',
    'home.view_all_results': 'அனைத்து முடிவுகளையும் காண்க',
    'home.schemes_eyebrow': 'வாராந்திர & பம்பர் திட்டங்கள்',
    'home.active_schemes': 'இயங்கும் கேரளா லாட்டரி திட்டங்கள்',
    'home.all_schemes': 'அனைத்து திட்டங்களும்',
    'home.news_eyebrow': 'கெசட் வெளியீடுகள்',
    'home.latest_news': 'சமீபத்திய லாட்டரி செய்திகள் & அறிக்கைகள்',
    'home.view_all_news': 'அனைத்து செய்திகளையும் காண்க',
    'home.sync_note': 'அதிகாரப்பூர்வ லோட்டிஸ் கெசட் தரவுத்தளத்துடன் முடிவுகள் ஒத்திசைக்கப்படுகின்றன.',

    'hero.eyebrow': 'இன்றைய திட்டமிடப்பட்ட குலுக்கல்',
    'hero.title': 'கேரளா மாநில லாட்டரி முடிவு',
    'hero.subtitle':
      'திருவனந்தபுரம் கோர்க்கி பவனில் கேரளா மாநில லாட்டரி இயக்ககத்தால் நடத்தப்படுகிறது.',
    'hero.awaiting': 'அதிகாரப்பூர்வ வெளியீட்டுக்காகக் காத்திருக்கிறது',
    'hero.not_published': 'முடிவு இன்னும் வெளியிடப்படவில்லை',
    'hero.not_published_body':
      'இன்றைய அதிகாரப்பூர்வ முடிவு இன்னும் வெளியிடப்படவில்லை. நாங்கள் தானாகவே சரிபார்த்து வருகிறோம்; கிடைத்தவுடன் இந்தப் பக்கம் புதுப்பிக்கப்படும்.',
    'hero.check_again': 'மீண்டும் சரிபார்க்கவும்',
    'hero.quick_jump': 'விரைவாகச் செல்ல:',
    'hero.today_draw': 'இன்றைய குலுக்கல்',
    'hero.yesterday': 'நேற்று',
    'hero.scheduled': 'திட்டமிடப்பட்டது',
    'hero.show_results': 'முடிவுகளைக் காட்டு',
    'hero.select_scheme': 'லாட்டரி திட்டத்தைத் தேர்ந்தெடுக்கவும்',
    'hero.all_lotteries': 'அனைத்து லாட்டரிகளும்',
    'hero.select_date': 'குலுக்கல் தேதியைத் தேர்ந்தெடுக்கவும்',

    'ticket.eyebrow': 'நிதி சரிபார்ப்புக் கருவி',
    'ticket.heading': 'உங்கள் டிக்கெட்டுகளைச் சரிபார்க்கவும்',
    'ticket.subheading':
      'அதிகாரப்பூர்வ கேரளா லோட்டிஸ் கெசட் முடிவுகளுடன் ஒப்பிட பார்கோடுகளை ஸ்கேன் செய்யவும் அல்லது 6 இலக்கத் தொடர் / கடைசி 4 இலக்கங்களை உள்ளிடவும்.',
    'ticket.scheme_label': 'லாட்டரி திட்டம்',
    'ticket.number_label': 'டிக்கெட் எண் / கைமுறை உள்ளீடு',
    'ticket.scan': 'ஸ்கேன்',
    'ticket.all_schemes': 'அனைத்து இயங்கும் திட்டங்களும்',
    'ticket.note':
      'வெளியிடப்பட்ட அதிகாரப்பூர்வ கேரள அரசு லோட்டிஸ் முடிவுகளுடன் நேரடியாகச் சரிபார்க்கிறது.',
    'ticket.multi_cta': 'பல டிக்கெட்டுகளைச் சரிபார்க்க வேண்டுமா? மல்டி-ஸ்கேனரைத் திறக்கவும்',
    'ticket.scan_multi': 'டிக்கெட்டுகளை ஸ்கேன் செய் (மல்டி-ஸ்கேன்)',
    'ticket.verifying': 'அதிகாரப்பூர்வ முடிவுகளுடன் சரிபார்க்கப்படுகிறது…',

    'schedule.eyebrow': 'குலுக்கல் அட்டவணை',
    'schedule.heading': 'வரவிருக்கும் கேரளா லாட்டரி குலுக்கல்கள்',
    'schedule.full_calendar': 'முழு 2026 நாட்காட்டி',
    'schedule.today': 'இன்று',
    'schedule.tomorrow': 'நாளை',

    'trust.eyebrow': 'சரிபார்ப்பு & நம்பகத்தன்மை செயல்முறை',
    'trust.heading': 'கேரளா லாட்டரி முடிவுகள் எவ்வாறு ஒத்திசைக்கப்படுகின்றன',
    'trust.subheading':
      'வெளிப்படையான, துல்லியமான, விரைவான அதிகாரப்பூர்வ முடிவு வழங்கலை உறுதிப்படுத்தும் தானியங்கி நான்கு-கட்ட சரிபார்ப்பு அமைப்பு.',
    'trust.step1_title': 'அதிகாரப்பூர்வ லோட்டிஸ் ஆதாரம்',
    'trust.step1_body':
      'திருவனந்தபுரம் கோர்க்கி பவனில் கேரளா மாநில லாட்டரி இயக்ககத்தால் பொது மேற்பார்வையில் குலுக்கல்கள் நடத்தப்படுகின்றன.',
    'trust.step2_title': 'தானியங்கி சேகரிப்பு',
    'trust.step2_body':
      'எங்கள் உள்ளீட்டுச் சேவை அதிகாரப்பூர்வ லோட்டிஸ் வெளியீட்டு ஊட்டத்துடன் நேரடியாக இணைந்து சரிபார்க்கப்பட்ட குலுக்கல் பதிவுகளைச் சேகரிக்கிறது. அறிவிக்கப்படும் அந்த நொடியே பொது ஆதாரமான keralalotteries.net இல் இருந்து வெற்றி எண்கள் நேரலையாகக் காட்டப்படும் — சரிபார்க்கப்படும் வரை அவை அதிகாரப்பூர்வமற்றவை எனக் குறிக்கப்படும்.',
    'trust.step3_title': 'தரவு நம்பகத்தன்மை தணிக்கை',
    'trust.step3_body':
      'வெற்றி எண்கள், தொடர் பங்கீடு மற்றும் பரிசு அமைப்பு ஆகியவை அதிகாரப்பூர்வ கெசட் PDF ஆவணங்களுடன் ஒப்பிட்டு சரிபார்க்கப்படுகின்றன. நேரலை (சரிபார்க்கப்படாத) எண்கள் கெசட் பதிவால் மாற்றப்படும்; அவற்றால் கெசட் பதிவை ஒருபோதும் மீற முடியாது.',
    'trust.step4_title': 'உடனடி வெளியீடு',
    'trust.step4_body':
      'வேகத்தையும் துல்லியத்தையும் உறுதிப்படுத்த சரிபார்க்கப்பட்ட குலுக்கல் முடிவுகளும் டிக்கெட் தேடல் குறியீடுகளும் உடனே வெளியிடப்படுகின்றன.',

    'notify.eyebrow': 'உலாவி அறிவிப்புகள்',
    'notify.heading': 'கேரளா லாட்டரி முடிவு அறிவிப்புகளைப் பெறுங்கள்',
    'notify.body':
      'கேரளா மாநில லாட்டரி இயக்ககம் அதிகாரப்பூர்வ முடிவுகளை வெளியிடும் அந்த நொடியே தானியங்கி புஷ் அறிவிப்பு கிடைக்கும்.',
    'notify.enable': 'அறிவிப்புகளை இயக்கு',

    'footer.tagline': 'முடிவுகள், சரிபார்ப்பு & அறிவிப்புகள்',
    'footer.brand_desc':
      'அதிகாரப்பூர்வ லோட்டிஸ் அரசு போர்ட்டலுடன் நேரடியாக ஒத்திசைந்து, விரைவான சரிபார்க்கப்பட்ட கேரளா மாநில லாட்டரி முடிவுகளை வழங்கும் சுயாதீன டிஜிட்டல் தகவல் தளம்.',
    'footer.official_portal': 'அதிகாரப்பூர்வ லோட்டிஸ் போர்ட்டல்',
    'footer.weekly_schemes': 'வாராந்திர திட்டங்கள்',
    'footer.seasonal_bumpers': 'பருவகால பம்பர்கள்',
    'footer.tools_trust': 'கருவிகள் & நம்பிக்கை',
    'footer.today_result': 'இன்றைய முடிவு',
    'footer.results_archive': 'முடிவுகள் காப்பகம்',
    'footer.ticket_checker': 'டிக்கெட் சரிபார்ப்பு',
    'footer.guides': 'உதவிக் கையேடுகள்',
    'footer.gazette_news': 'கெசட் செய்திகள்',
    'footer.disclaimer_heading': 'சுயாதீன தளப் பொறுப்புத் துறப்பு:',
    'footer.disclaimer_body1':
      'KeralaDraws ஒரு சுயாதீன டிஜிட்டல் தகவல் தளம்; கேரள அரசுடனோ கேரளா மாநில லாட்டரி இயக்ககத்துடனோ இதற்கு எந்தத் தொடர்பும் இல்லை; அவை இதை அங்கீகரிக்கவோ அதிகாரம் அளிக்கவோ நடத்தவோ இல்லை.',
    'footer.disclaimer_body2':
      'இந்த இணையதளத்தில் வெளியிடப்படும் அனைத்து குலுக்கல் பதிவுகளும், வெற்றி எண்களும், பரிசு விவரங்களும் பொது அதிகாரப்பூர்வ லோட்டிஸ் அறிவிப்புகள் மற்றும் கேரள அரசு கெசட்களில் இருந்து தானாக ஒத்திசைக்கப்படுகின்றன. டிக்கெட் வைத்திருப்பவர்களும் பரிசு வென்றவர்களும் அதிகாரப்பூர்வ கெசட்டில் சரிபார்த்து 90 நாட்களுக்குள் பரிசைப் பெற வேண்டும்.',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    'footer.about': 'எங்களைப் பற்றி',
    'footer.contact': 'தொடர்பு',
    'footer.privacy': 'தனியுரிமைக் கொள்கை',
    'footer.terms': 'விதிமுறைகள்',

    'day.monday': 'திங்கள்',
    'day.tuesday': 'செவ்வாய்',
    'day.wednesday': 'புதன்',
    'day.thursday': 'வியாழன்',
    'day.friday': 'வெள்ளி',
    'day.saturday': 'சனி',
    'day.sunday': 'ஞாயிறு',
  },

  hi: {
    'nav.home': "मुख्य पृष्ठ",
    'common.result': "परिणाम",
    'hero.verified_result': "आज का सत्यापित परिणाम",
    'hero.checking_sources': "आधिकारिक स्रोत जांचे जा रहे हैं…",
    'common.loading': 'लोड हो रहा है…',
    'common.read_article': 'लेख पढ़ें',
    'common.read_full_report': 'पूरी रिपोर्ट पढ़ें',
    'common.open_multi_scanner': 'मल्टी-स्कैनर खोलें',
    'common.details': 'विवरण',

    'home.stream_eyebrow': 'कालक्रमानुसार सूची',
    'home.recent_results': 'हाल के आधिकारिक परिणाम',
    'home.view_all_results': 'सभी परिणाम देखें',
    'home.schemes_eyebrow': 'साप्ताहिक और बंपर योजनाएं',
    'home.active_schemes': 'सक्रिय केरल लॉटरी योजनाएं',
    'home.all_schemes': 'सभी योजनाएं',
    'home.news_eyebrow': 'राजपत्र विज्ञप्तियां',
    'home.latest_news': 'नवीनतम लॉटरी समाचार और रिपोर्ट',
    'home.view_all_news': 'सभी समाचार देखें',
    'home.sync_note': 'परिणाम आधिकारिक लोटिस राजपत्र डेटाबेस के साथ सिंक हो रहे हैं।',

    'hero.eyebrow': 'आज का निर्धारित ड्रॉ',
    'hero.title': 'केरल राज्य लॉटरी परिणाम',
    'hero.subtitle':
      'तिरुवनंतपुरम के गोर्की भवन में केरल राज्य लॉटरी निदेशालय द्वारा आयोजित।',
    'hero.awaiting': 'आधिकारिक प्रकाशन की प्रतीक्षा में',
    'hero.not_published': 'परिणाम अभी प्रकाशित नहीं हुआ',
    'hero.not_published_body':
      'आज का आधिकारिक परिणाम अभी प्रकाशित नहीं हुआ है। हम स्वतः जांच कर रहे हैं और उपलब्ध होते ही यह पृष्ठ अपडेट कर देंगे।',
    'hero.check_again': 'अभी फिर जांचें',
    'hero.quick_jump': 'तुरंत जाएं:',
    'hero.today_draw': 'आज का ड्रॉ',
    'hero.yesterday': 'कल',
    'hero.scheduled': 'निर्धारित',
    'hero.show_results': 'परिणाम दिखाएं',
    'hero.select_scheme': 'लॉटरी योजना चुनें',
    'hero.all_lotteries': 'सभी लॉटरी',
    'hero.select_date': 'ड्रॉ तिथि चुनें',

    'ticket.eyebrow': 'वित्तीय जांच टूल',
    'ticket.heading': 'अपने टिकट जांचें',
    'ticket.subheading':
      'आधिकारिक केरल लोटिस राजपत्र परिणामों से मिलान के लिए बारकोड स्कैन करें या 6 अंकों की श्रृंखला / अंतिम 4 अंक दर्ज करें।',
    'ticket.scheme_label': 'लॉटरी योजना',
    'ticket.number_label': 'टिकट नंबर / मैन्युअल प्रविष्टि',
    'ticket.scan': 'स्कैन',
    'ticket.all_schemes': 'सभी सक्रिय योजनाएं',
    'ticket.note': 'प्रकाशित आधिकारिक केरल सरकार लोटिस परिणामों से सीधे जांच करता है।',
    'ticket.multi_cta': 'कई टिकट जांचने हैं? मल्टी-स्कैनर खोलें',
    'ticket.scan_multi': 'टिकट स्कैन करें (मल्टी-स्कैन)',
    'ticket.verifying': 'आधिकारिक परिणामों से मिलान किया जा रहा है…',

    'schedule.eyebrow': 'ड्रॉ समय-सारणी',
    'schedule.heading': 'आगामी केरल लॉटरी ड्रॉ',
    'schedule.full_calendar': 'पूरा 2026 कैलेंडर',
    'schedule.today': 'आज',
    'schedule.tomorrow': 'कल',

    'trust.eyebrow': 'सत्यापन और विश्वसनीयता प्रक्रिया',
    'trust.heading': 'केरल लॉटरी परिणाम कैसे सिंक होते हैं',
    'trust.subheading':
      'पारदर्शी, सटीक और तेज़ आधिकारिक परिणाम वितरण सुनिश्चित करने वाला स्वचालित चार-चरणीय सत्यापन ढांचा।',
    'trust.step1_title': 'आधिकारिक लोटिस स्रोत',
    'trust.step1_body':
      'तिरुवनंतपुरम के गोर्की भवन में केरल राज्य लॉटरी निदेशालय द्वारा सार्वजनिक निगरानी में ड्रॉ आयोजित किए जाते हैं।',
    'trust.step2_title': 'स्वचालित संग्रहण',
    'trust.step2_body':
      'हमारी इनजेशन सेवा आधिकारिक लोटिस प्रकाशन फ़ीड से सीधे जुड़कर सत्यापित ड्रॉ रिकॉर्ड एकत्र करती है। घोषणा होते ही सार्वजनिक स्रोत keralalotteries.net से विजेता अंक लाइव भी दिखाए जाते हैं — सत्यापन तक वे अनधिकृत के रूप में चिह्नित रहते हैं।',
    'trust.step3_title': 'डेटा अखंडता ऑडिट',
    'trust.step3_body':
      'विजेता अंक, श्रृंखला वितरण और पुरस्कार संरचना की आधिकारिक राजपत्र PDF दस्तावेजों से मिलान कर सत्यापन किया जाता है। लाइव (असत्यापित) अंक राजपत्र रिकॉर्ड से बदल दिए जाते हैं; वे राजपत्र रिकॉर्ड को कभी ओवरराइड नहीं कर सकते।',
    'trust.step4_title': 'तत्काल प्रकाशन',
    'trust.step4_body':
      'गति और सटीकता सुनिश्चित करने के लिए सत्यापित ड्रॉ परिणाम और टिकट खोज सूचकांक तुरंत प्रकाशित किए जाते हैं।',

    'notify.eyebrow': 'ब्राउज़र सूचनाएं',
    'notify.heading': 'केरल लॉटरी परिणाम अलर्ट पाएं',
    'notify.body':
      'केरल राज्य लॉटरी निदेशालय द्वारा आधिकारिक परिणाम प्रकाशित करते ही स्वचालित पुश सूचना प्राप्त करें।',
    'notify.enable': 'सूचनाएं सक्षम करें',

    'footer.tagline': 'परिणाम, जांच और अलर्ट',
    'footer.brand_desc':
      'आधिकारिक लोटिस सरकारी पोर्टल के साथ सीधे सिंक होकर तेज़, सत्यापित केरल राज्य लॉटरी परिणाम देने वाला स्वतंत्र डिजिटल सूचना मंच।',
    'footer.official_portal': 'आधिकारिक लोटिस पोर्टल',
    'footer.weekly_schemes': 'साप्ताहिक योजनाएं',
    'footer.seasonal_bumpers': 'मौसमी बंपर',
    'footer.tools_trust': 'टूल और भरोसा',
    'footer.today_result': 'आज का परिणाम',
    'footer.results_archive': 'परिणाम संग्रह',
    'footer.ticket_checker': 'टिकट चेकर',
    'footer.guides': 'सहायक गाइड',
    'footer.gazette_news': 'राजपत्र समाचार',
    'footer.disclaimer_heading': 'स्वतंत्र मंच अस्वीकरण:',
    'footer.disclaimer_body1':
      'KeralaDraws एक स्वतंत्र डिजिटल सूचना मंच है और केरल सरकार या केरल राज्य लॉटरी निदेशालय से किसी भी रूप में संबद्ध, अनुमोदित, अधिकृत या संचालित नहीं है।',
    'footer.disclaimer_body2':
      'इस वेबसाइट पर प्रकाशित सभी ड्रॉ रिकॉर्ड, विजेता अंक और पुरस्कार विवरण सार्वजनिक आधिकारिक लोटिस सूचनाओं और केरल सरकार के राजपत्रों से स्वतः सिंक किए जाते हैं। टिकट धारकों और विजेताओं को सलाह है कि वे आधिकारिक प्रकाशित राजपत्र से टिकट सत्यापित कर 90 दिनों के भीतर पुरस्कार प्राप्त करें।',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    'footer.about': 'हमारे बारे में',
    'footer.contact': 'संपर्क',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'शर्तें',

    'day.monday': 'सोमवार',
    'day.tuesday': 'मंगलवार',
    'day.wednesday': 'बुधवार',
    'day.thursday': 'गुरुवार',
    'day.friday': 'शुक्रवार',
    'day.saturday': 'शनिवार',
    'day.sunday': 'रविवार',
  },
};
