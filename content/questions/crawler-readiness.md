---
order: 8
question: Can Google and AI crawlers read our site?
askedBy: A CMO after a developer or another agency raised it, or anyone planning a redesign.
timebox: Half a day
expect: Pass or fail on whether priority pages are crawlable, rendered, indexed, fast, and readable by AI crawlers, with the fixes that matter ranked.
steps:
  - In Search Console, open **Indexing → Pages**. Check the exclusion reasons, and inspect each priority URL with **URL Inspection**.
  - Crawl the site (Screaming Frog, Sitebulb or similar). Check status codes, redirects, canonicals, internal links to priority pages, and crawl depth.
  - For each template, compare the page source (view-source) with what you see in the browser. Content, links or schema that appear only after JavaScript runs are at risk.
  - Read robots.txt for AI user agents, ask whoever manages the CDN or firewall about bot rules, and check server logs for AI crawler hits on priority pages.
  - In Search Console's **Core Web Vitals** report, check money-page templates on mobile.
read:
  - Report priority pages separately. One unindexed pricing page matters more than hundreds of excluded tag pages.
  - Many AI crawlers read raw HTML without running JavaScript. A site can rank in Google and still be close to invisible to AI engines.
  - "'Crawled – currently not indexed' on important pages is usually a quality or duplication signal, not a technical switch."
beforeYouStart: Ask about planned redesigns or platform changes in the same meeting. A technical audit is worth most before a migration, not after.
script: "[N] of [N] priority pages are indexed and readable. The blockers are [issue] on [template] and [issue]. AI crawlers are [allowed / blocked by (rule)]. Fixing [issue] first unblocks [X]% of priority pages."
signals:
  - index-coverage
  - crawlability
  - js-rendering
  - ai-crawler-access
  - cwv
  - structured-data
diagnostics:
  - deindexed-pages
  - post-migration-drop
plays:
  - unblock-crawling
  - ai-crawler-policy
  - site-speed
---
