---
order: 1
title: Technical & crawl access
question: Can Google and AI crawlers reach, render and index the pages that matter?
signals:
  - index-coverage
  - crawlability
  - js-rendering
  - ai-crawler-access
  - cwv
  - migration-risk
checks:
  - check: Priority pages indexed
    how: URL Inspection on each priority page; Indexing → Pages for exclusion reasons
    fail: A priority page not indexed, or 'Crawled – currently not indexed' on money pages
    plays:
      - unblock-crawling
  - check: Content in raw HTML
    how: Compare view-source with the rendered page for each template, or crawl with JavaScript off
    fail: Body copy, links or schema appear only after JavaScript runs
    plays:
      - unblock-crawling
  - check: AI crawlers allowed
    how: Read robots.txt for AI user agents, ask about CDN or firewall bot rules, and check logs for hits
    fail: Search or retrieval bots blocked, or no AI crawler hits on priority pages in 30 days
    plays:
      - ai-crawler-policy
      - unblock-crawling
  - check: Crawl health
    how: "Full crawl: status codes, redirect chains, canonicals, orphan pages, crawl depth"
    fail: Priority pages more than three clicks deep, redirect chains, or canonicals pointing elsewhere
    plays:
      - unblock-crawling
      - internal-linking
  - check: Sitemaps
    how: Compare sitemap URLs with the crawl and with indexed pages
    fail: Sitemap lists redirected, noindexed or missing pages
    plays:
      - unblock-crawling
  - check: Core Web Vitals
    how: Search Console [Core Web Vitals](term:core-web-vitals) and PageSpeed Insights field data on money-page templates
    fail: Money-page templates failing on mobile
    plays:
      - site-speed
  - check: Migration history
    how: Ask about redesigns and URL changes in the last two years; test old URLs
    fail: Old URLs return 404 or redirect to the homepage
    plays:
      - protect-migration
      - unblock-crawling
---
