---
order: 1
title: Unblock crawling and indexing
when: Priority pages aren't indexed, AI crawlers are blocked, or content only renders with JavaScript.
effort: M
firstSignal: days
owner: technical
timing: Days to weeks. Effort is S for access rules and redirects, L when rendering has to change.
steps:
  - Fix robots.txt and CDN rules so search and retrieval bots reach priority pages
  - Server-render or pre-render primary content, links and schema
  - Fix canonicals, redirects and the sitemap
  - Request indexing for priority pages and confirm the recrawl
moves:
  - index-coverage
  - ai-crawler-access
  - js-rendering
  - crawlability
related:
  - ai-crawler-policy
  - site-speed
watchOut: Rendering changes need developer time. Get them into the client's sprint before promising dates.
---
