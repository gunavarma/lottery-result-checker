# Search Query Intent Mapping & Cannibalization Prevention — KeralaDraws

This guide specifies the definitive search-intent-to-URL architecture for **KeralaDraws** (`KeralaDraws.com`), ensuring high organic search relevance and zero keyword cannibalization across all 6 core content categories.

---

## 1. Core Query Intent Mapping Matrix

| Search Intent Category | Sample User Search Queries | Canonical Target URL | Schema.org Structured Data |
| :--- | :--- | :--- | :--- |
| **Today's Results** | `kerala lottery result today`, `kerala lottery result today live`, `today kerala lottery winning numbers` | `/kerala-lottery-result-today` | `Article`, `BreadcrumbList`, `FAQPage` |
| **Ticket Verification** | `kerala lottery ticket checker`, `check kerala lottery ticket`, `verify kerala lottery number` | `/check-ticket` | `BreadcrumbList`, `FAQPage` |
| **Draw Timetable** | `kerala lottery calendar 2026`, `kerala lottery draw schedule`, `kerala lottery draw days` | `/lottery-calendar` | `BreadcrumbList` |
| **Historical Archive** | `kerala lottery results history`, `previous kerala lottery results`, `kerala lottery old results 2026` | `/results/archive` | `BreadcrumbList` |
| **Lottery Schemes Directory** | `kerala lottery schemes`, `kerala state lotteries list`, `kerala lottery ticket prices` | `/lotteries` | `BreadcrumbList` |
| **Scheme Specific Hub** | `karunya plus lottery result`, `suvarna keralam result`, `fifty fifty lottery draw` | `/lotteries/[slug]` (e.g. `/lotteries/karunya-plus`) | `BreadcrumbList`, `FAQPage` |
| **Specific Draw Result** | `karunya plus kn 638 result`, `suvarna keralam sk 67 result` | `/results/[slug]/[drawNumber]` (e.g. `/results/suvarna-keralam/sk-67`) | `BreadcrumbList`, `FAQPage` |
| **Prize Structure** | `kerala lottery prize structure`, `kerala lottery 1st prize amount`, `kerala lottery consolation prize` | `/prize-structure` | `BreadcrumbList` |
| **Ticket Checking Guide** | `how to check kerala lottery ticket`, `how to read kerala lottery number` | `/guides/how-to-check-kerala-lottery-ticket` | `NewsArticle`, `BreadcrumbList`, `FAQPage` |
| **Draw Proceedings Guide** | `how kerala lottery results work`, `gorky bhavan draw procedure` | `/guides/how-kerala-lottery-results-work` | `NewsArticle`, `BreadcrumbList`, `FAQPage` |
| **Prize Claims Guide** | `how to claim kerala lottery prize money`, `kerala lottery claim documents` | `/guides/how-to-claim-kerala-lottery-prize-money` | `NewsArticle`, `BreadcrumbList`, `FAQPage` |
| **Official Gazette Verification** | `how to verify kerala lottery results`, `lotis gazette verification` | `/guides/how-to-verify-kerala-lottery-results` | `NewsArticle`, `BreadcrumbList`, `FAQPage` |
| **Alerts & Watchlist Guide** | `kerala lottery result alerts`, `how keraladraws notifications work` | `/guides/keraladraws-alerts-and-notifications-guide` | `NewsArticle`, `BreadcrumbList`, `FAQPage` |
| **Seasonal Bumper News** | `thiruvonam bumper 2026 announcement`, `onam bumper prize structure` | `/news/[slug]` | `NewsArticle`, `BreadcrumbList` |

---

## 2. Cannibalization Prevention Rules

1. **One Primary Intent, One Primary URL**:
   * Do NOT create separate pages for minor keyword synonyms (e.g. `kerala-lottery-results-today` vs `kerala-lottery-result-today-live` vs `kerala-lottery-today-result`). All today-oriented intent is consolidated into `/kerala-lottery-result-today`.
2. **Permanent Draw URLs**:
   * Every certified draw has exactly one canonical URL: `/results/[slug]/[drawNumber]`.
   * Any legacy date/slug queries (`/result/[date]/[slug]`) automatically 301-redirect to the permanent draw URL.
3. **No Thin Location Doorway Pages**:
   * Never create artificial city landing pages (e.g. `/kerala-lottery-result-ernakulam`, `/kerala-lottery-result-kozhikode`). The results are statewide and centralized at Thiruvananthapuram.
4. **Internal Search & Admin Directives**:
   * All internal search queries (`/search`) and administrative tools are strictly set to `noindex, nofollow` to prevent crawler trap bloat.

---

## 3. Natural Internal Linking Anchor Standards

* **Descriptive & Topic-Specific Anchors**:
  * Good: `"Check Suvarna Keralam ticket numbers"`, `"View complete 2026 lottery draw timetable"`, `"Read the guide to claiming prize money"`.
  * Avoid: `"Click here"`, `"Read more"`, or repetitive keyword stuffing.
* **Topic Cluster Triangulation**:
  * Every Individual Result page links to its Lottery Scheme Hub, Ticket Checker, and Previous/Next draws.
  * Every Lottery Scheme Hub links to its Latest Draw, Archive, Ticket Checker, and Related News/Guides.
  * Every Guide links to the relevant Scheme Hubs and the Ticket Checker tool.
