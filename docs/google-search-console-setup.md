# Google Search Console Setup & SEO Indexing Guide — KeralaDraws

This document outlines the complete procedure for onboarding **KeralaDraws** (`https://keraladraws.com`) onto Google Search Console, configuring DNS verification, submitting the XML sitemap, and accelerating indexation of daily lottery results.

---

## 1. Technical SEO Architecture Overview

KeralaDraws is optimized for search engines with server-rendered HTML, clean canonical URL structures, and valid Schema.org structured data:

* **Canonical Base URL**: `https://keraladraws.com`
* **Robots Configuration**: `https://keraladraws.com/robots.txt`
* **Dynamic XML Sitemap**: `https://keraladraws.com/sitemap.xml` (auto-updates with every published draw and news article)
* **Structured Data Formats**:
  * `Organization` & `WebSite` on root layout
  * `BreadcrumbList` on all hierarchical and result pages
  * `NewsArticle` on all news dispatches
  * `FAQPage` on lottery scheme and landing hubs

---

## 2. Step 1: Add Property in Google Search Console

1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** in the top-left dropdown.
3. Select **Domain** (Recommended) or **URL prefix**:
   * **Domain property (Recommended)**: Enter `keraladraws.com` (covers `https://`, `http://`, and all subdomains).
   * **URL prefix property**: Enter `https://keraladraws.com`.

### DNS Verification (Domain Property)
1. Copy the TXT record provided by Google (e.g., `google-site-verification=XXXXXXXXXXXXXXXXXXXXXX`).
2. Log in to your DNS provider (Cloudflare, Namecheap, GoDaddy, Vercel, etc.).
3. Add a new **TXT** DNS record:
   * **Type**: `TXT`
   * **Name / Host**: `@` (or `keraladraws.com`)
   * **Value**: `google-site-verification=XXXXXXXXXXXXXXXXXXXXXX`
   * **TTL**: Automatic or 300s
4. Return to Google Search Console and click **Verify**.

---

## 3. Step 2: Submit the XML Sitemap

Once domain ownership is verified:
1. In Search Console, click **Sitemaps** in the left sidebar under *Indexing*.
2. In the **Add a new sitemap** input, enter:
   ```
   sitemap.xml
   ```
3. Click **Submit**.
4. Verify that the status shows **Success** and the detected URL count matches the total database records (landing pages, all active lottery schemes, historical draws, and news articles).

---

## 4. Step 3: Priority URL Inspection & Indexing

To bootstrap crawling for core pages immediately:
1. Use the **URL Inspection Tool** (top search bar in Search Console).
2. Inspect the following high-priority URLs one by one:
   * `https://keraladraws.com/`
   * `https://keraladraws.com/kerala-lottery-result-today`
   * `https://keraladraws.com/results`
   * `https://keraladraws.com/lotteries`
   * `https://keraladraws.com/results/archive`
   * `https://keraladraws.com/check-ticket`
   * `https://keraladraws.com/lottery-calendar`
   * `https://keraladraws.com/prize-structure`
   * `https://keraladraws.com/news`
   * `https://keraladraws.com/about`
   * `https://keraladraws.com/contact`
   * `https://keraladraws.com/privacy-policy`
   * `https://keraladraws.com/terms`
   * `https://keraladraws.com/disclaimer`
3. Click **Test Live URL** to confirm that Googlebot renders the server content with HTTP status `200 OK`.
4. Click **Request Indexing**.

---

## 5. Step 4: Validate Structured Data & Rich Results

1. Open the [Google Rich Results Test](https://search.google.com/test/rich-results).
2. Enter key URLs to test:
   * `https://keraladraws.com/` (Validates Organization and WebSite schema)
   * `https://keraladraws.com/lotteries/karunya-plus` (Validates BreadcrumbList and FAQPage schema)
   * `https://keraladraws.com/news/thiruvonam-bumper-2026-prize-structure-draw-details` (Validates NewsArticle schema)
3. Ensure 0 errors and 0 warnings are reported.

---

## 6. Daily Operations & Fresh Result Indexing

* **Automated Sync**: The Supabase Cron runs every 15 minutes and automatically publishes new certified draws to the database.
* **Instant Dynamic Sitemap**: `/sitemap.xml` queries live database records with `force-dynamic`, meaning Googlebot is immediately served fresh `lastmod` timestamps whenever a new draw is certified.
* **Internal Linking**: The homepage, results hub (`/results`), lotteries directory (`/lotteries`), and previous/next navigation widgets automatically link to new results as soon as they appear in the database.
