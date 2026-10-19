import type { Language } from '@/lib/translations';

/**
 * Results hub (`/results`, `/ml/results` …) copy, per locale.
 *
 * Same contract as `page-copy-home.ts`: every key exists in all four languages,
 * `{placeholders}` are filled by `tf()`, and scheme names and ₹ amounts are not
 * translated because they are what the ticket and the gazette print.
 */
export const RESULTS_COPY: Record<Language, Record<string, string>> = {
  en: {
    'results.home': 'Home',
    'results.breadcrumb_results': 'Kerala Lottery Results',
    'results.h1': 'Kerala State Lottery Results',
    'results.nav_title': 'Quick Date Navigator (Last 7 Days)',
    'results.nav_today': 'Today',
    'results.nav_calendar': 'View Full Calendar Timetable',
    'results.filter_label': 'Filter by Lottery Scheme',
    'results.filter_all': 'All Active Schemes',
    'results.stream_eyebrow': 'Published Gazette Stream',
    'results.stream_title': 'Latest Certified Results',
    'results.stream_count': 'Showing {count} Certified Records',
    'results.empty_title': 'No lottery results found.',
    'results.empty_body': 'Certified results are synchronizing with the official LOTIS database.',
    'results.weekly_draw': 'Weekly Draw',
    'results.first_prize': '1st Prize',
    'results.certified': 'Certified',
    'results.full_result': 'Full Result',
    'results.full_aria': 'View full {name} {draw} results',
    'results.verified_note':
      'All results verified against Kerala Government LOTIS Directorate gazettes.',
    'results.browse_archive': 'Browse the complete results archive',
  },

  ml: {
    'results.home': 'ഹോം',
    'results.breadcrumb_results': 'കേരള ഭാഗ്യക്കുറി ഫലങ്ങൾ',
    'results.h1': 'കേരള സംസ്ഥാന ഭാഗ്യക്കുറി ഫലങ്ങൾ',
    'results.nav_title': 'വേഗത്തിലുള്ള തീയതി നാവിഗേറ്റർ (കഴിഞ്ഞ 7 ദിവസം)',
    'results.nav_today': 'ഇന്ന്',
    'results.nav_calendar': 'പൂർണ്ണ കലണ്ടർ ഷെഡ്യൂൾ കാണുക',
    'results.filter_label': 'ഭാഗ്യക്കുറി പദ്ധതി അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക',
    'results.filter_all': 'എല്ലാ സജീവ പദ്ധതികളും',
    'results.stream_eyebrow': 'പ്രസിദ്ധീകരിച്ച ഗസറ്റ് പ്രവാഹം',
    'results.stream_title': 'ഏറ്റവും പുതിയ സാക്ഷ്യപ്പെടുത്തിയ ഫലങ്ങൾ',
    'results.stream_count': '{count} സാക്ഷ്യപ്പെടുത്തിയ രേഖകൾ കാണിക്കുന്നു',
    'results.empty_title': 'ഭാഗ്യക്കുറി ഫലങ്ങൾ കണ്ടെത്തിയില്ല.',
    'results.empty_body':
      'സാക്ഷ്യപ്പെടുത്തിയ ഫലങ്ങൾ ഔദ്യോഗിക ലോട്ടിസ് ഡാറ്റാബേസുമായി സമന്വയിക്കുന്നു.',
    'results.weekly_draw': 'പ്രതിവാര നറുക്കെടുപ്പ്',
    'results.first_prize': 'ഒന്നാം സമ്മാനം',
    'results.certified': 'സാക്ഷ്യപ്പെടുത്തിയത്',
    'results.full_result': 'പൂർണ്ണ ഫലം',
    'results.full_aria': '{name} {draw} ന്റെ പൂർണ്ണ ഫലം കാണുക',
    'results.verified_note':
      'എല്ലാ ഫലങ്ങളും കേരള സർക്കാർ ലോട്ടിസ് ഡയറക്ടറേറ്റ് ഗസറ്റുകളുമായി പരിശോധിച്ചതാണ്.',
    'results.browse_archive': 'പൂർണ്ണ ഫല ശേഖരം കാണുക',
  },

  ta: {
    'results.home': 'முகப்பு',
    'results.breadcrumb_results': 'கேரளா லாட்டரி முடிவுகள்',
    'results.h1': 'கேரளா மாநில லாட்டரி முடிவுகள்',
    'results.nav_title': 'விரைவு தேதி வழிசெலுத்தி (கடந்த 7 நாட்கள்)',
    'results.nav_today': 'இன்று',
    'results.nav_calendar': 'முழு நாட்காட்டி அட்டவணையைப் பார்க்கவும்',
    'results.filter_label': 'லாட்டரி திட்டத்தின் அடிப்படையில் வடிகட்டவும்',
    'results.filter_all': 'அனைத்து இயங்கும் திட்டங்கள்',
    'results.stream_eyebrow': 'வெளியிடப்பட்ட கெசட் ஓட்டம்',
    'results.stream_title': 'சமீபத்திய சான்றளிக்கப்பட்ட முடிவுகள்',
    'results.stream_count': '{count} சான்றளிக்கப்பட்ட பதிவுகள் காட்டப்படுகின்றன',
    'results.empty_title': 'லாட்டரி முடிவுகள் எதுவும் கிடைக்கவில்லை.',
    'results.empty_body':
      'சான்றளிக்கப்பட்ட முடிவுகள் அதிகாரப்பூர்வ லோட்டிஸ் தரவுத்தளத்துடன் ஒத்திசைக்கப்படுகின்றன.',
    'results.weekly_draw': 'வாராந்திர குலுக்கல்',
    'results.first_prize': 'முதல் பரிசு',
    'results.certified': 'சான்றளிக்கப்பட்டது',
    'results.full_result': 'முழு முடிவு',
    'results.full_aria': '{name} {draw} முழு முடிவுகளைப் பார்க்கவும்',
    'results.verified_note':
      'அனைத்து முடிவுகளும் கேரளா அரசு லோட்டிஸ் இயக்கக கெசட்களுடன் சரிபார்க்கப்பட்டவை.',
    'results.browse_archive': 'முழு முடிவுகள் காப்பகத்தைப் பார்க்கவும்',
  },

  hi: {
    'results.home': 'होम',
    'results.breadcrumb_results': 'केरल लॉटरी परिणाम',
    'results.h1': 'केरल राज्य लॉटरी परिणाम',
    'results.nav_title': 'त्वरित तिथि नेविगेटर (पिछले 7 दिन)',
    'results.nav_today': 'आज',
    'results.nav_calendar': 'पूरा कैलेंडर समय-सारिणी देखें',
    'results.filter_label': 'लॉटरी योजना के अनुसार फ़िल्टर करें',
    'results.filter_all': 'सभी सक्रिय योजनाएँ',
    'results.stream_eyebrow': 'प्रकाशित राजपत्र प्रवाह',
    'results.stream_title': 'नवीनतम प्रमाणित परिणाम',
    'results.stream_count': '{count} प्रमाणित रिकॉर्ड दिखाए जा रहे हैं',
    'results.empty_title': 'कोई लॉटरी परिणाम नहीं मिला।',
    'results.empty_body': 'प्रमाणित परिणाम आधिकारिक लोटिस डेटाबेस के साथ सिंक हो रहे हैं।',
    'results.weekly_draw': 'साप्ताहिक ड्रॉ',
    'results.first_prize': 'प्रथम पुरस्कार',
    'results.certified': 'प्रमाणित',
    'results.full_result': 'पूरा परिणाम',
    'results.full_aria': '{name} {draw} के पूरे परिणाम देखें',
    'results.verified_note':
      'सभी परिणाम केरल सरकार लोटिस निदेशालय के राजपत्रों से सत्यापित हैं।',
    'results.browse_archive': 'पूरा परिणाम संग्रह देखें',
  },
};
