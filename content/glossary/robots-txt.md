---
term: robots.txt
definition: A file at the root of a site that tells crawlers which paths they may request. It controls crawling, not indexing, and it's the usual place AI crawlers are allowed or blocked.
signals:
  - crawlability
  - ai-crawler-access
questions:
  - crawler-readiness
related:
  - noindex
  - ai-crawler
  - llms-txt
---

Blocking a page here doesn't remove it from results; it just stops the engine seeing what's on it. To keep a page out of the index, leave it crawlable and use noindex.
