import type { Language } from '@/lib/translations';

/**
 * Shared chrome strings that were missing from the extended dictionary: the
 * footer's link labels, the language bar and the ticket-scanner CTA.
 *
 * Kept as its own table because both the footer and the navbar read from it, and
 * neither is a "page content" module. Merged into `TRANSLATIONS` at load.
 */
export const CHROME_COPY: Record<Language, Record<string, string>> = {
  en: {
    'chrome.language': 'Language',
    'chrome.scan_ticket': 'Scan Ticket',
    'chrome.lotis_sync_short': 'LOTIS Synchronized',
    'chrome.footer_previous_results': 'Previous Results',
    'chrome.footer_timetable': 'Draw Timetable 2026',
    'chrome.footer_prize_breakdown': 'Prize Breakdown',
    'chrome.footer_disclaimer_claims': 'Disclaimer & Claims',
    'chrome.footer_terms': 'Terms',
    'chrome.footer_disclaimer': 'Disclaimer',
    'chrome.footer_language_label': 'Read this page in another language',
    'chrome.featured_report': 'Featured Report',
    'chrome.published': 'Published',
  },

  ml: {
    'chrome.language': 'ഭാഷ',
    'chrome.scan_ticket': 'ടിക്കറ്റ് സ്കാൻ ചെയ്യുക',
    'chrome.lotis_sync_short': 'ലോട്ടിസ് സമന്വയിപ്പിച്ചു',
    'chrome.footer_previous_results': 'മുൻ ഫലങ്ങൾ',
    'chrome.footer_timetable': '2026 നറുക്കെടുപ്പ് ഷെഡ്യൂൾ',
    'chrome.footer_prize_breakdown': 'സമ്മാന വിഭജനം',
    'chrome.footer_disclaimer_claims': 'അറിയിപ്പും ക്ലെയിമുകളും',
    'chrome.footer_terms': 'നിബന്ധനകൾ',
    'chrome.footer_disclaimer': 'അറിയിപ്പ്',
    'chrome.footer_language_label': 'ഈ പേജ് മറ്റൊരു ഭാഷയിൽ വായിക്കുക',
    'chrome.featured_report': 'പ്രധാന റിപ്പോർട്ട്',
    'chrome.published': 'പ്രസിദ്ധീകരിച്ചത്',
  },

  ta: {
    'chrome.language': 'மொழி',
    'chrome.scan_ticket': 'டிக்கெட்டை ஸ்கேன் செய்',
    'chrome.lotis_sync_short': 'லோட்டிஸ் ஒத்திசைக்கப்பட்டது',
    'chrome.footer_previous_results': 'முந்தைய முடிவுகள்',
    'chrome.footer_timetable': '2026 குலுக்கல் அட்டவணை',
    'chrome.footer_prize_breakdown': 'பரிசு விவரம்',
    'chrome.footer_disclaimer_claims': 'பொறுப்புத் துறப்பு & உரிமைகோரல்கள்',
    'chrome.footer_terms': 'விதிமுறைகள்',
    'chrome.footer_disclaimer': 'பொறுப்புத் துறப்பு',
    'chrome.footer_language_label': 'இந்தப் பக்கத்தை வேறு மொழியில் படிக்கவும்',
    'chrome.featured_report': 'சிறப்பு அறிக்கை',
    'chrome.published': 'வெளியிடப்பட்டது',
  },

  hi: {
    'chrome.language': 'भाषा',
    'chrome.scan_ticket': 'टिकट स्कैन करें',
    'chrome.lotis_sync_short': 'लोटिस सिंक',
    'chrome.footer_previous_results': 'पिछले परिणाम',
    'chrome.footer_timetable': '2026 ड्रॉ समय-सारिणी',
    'chrome.footer_prize_breakdown': 'पुरस्कार विवरण',
    'chrome.footer_disclaimer_claims': 'अस्वीकरण और दावे',
    'chrome.footer_terms': 'शर्तें',
    'chrome.footer_disclaimer': 'अस्वीकरण',
    'chrome.footer_language_label': 'इस पेज को दूसरी भाषा में पढ़ें',
    'chrome.featured_report': 'विशेष रिपोर्ट',
    'chrome.published': 'प्रकाशित',
  },
};
