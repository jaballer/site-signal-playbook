---
title: Crawlability and architecture
layer: foundations
phases:
  - audit
question: Can crawlers reach every important page easily?
definition: Status codes, redirect chains, canonicals, crawl depth, orphan pages and sitemap accuracy.
source: Site crawler (Screaming Frog, Sitebulb or similar)
capture: Full crawl at audit, and before any release that changes templates or URLs.
read: Priority pages within three clicks of the homepage, with no redirect chains or conflicting canonicals
---

Compare the crawl, the sitemap and Search Console. Pages that appear in only one of the three are where problems hide.
