---
order: 4
title: Pages dropped out of the index
inTheField: A release changes a template's canonical tags, or a staging noindex setting ships to production. Over a few weeks a whole section moves to excluded in Search Console, and traffic erodes slowly enough that nobody connects it to the release.
steps:
  - title: Find the reason in Search Console
    detail: Indexing → Pages, looking at which exclusion reasons grew. The reason names the investigation.
  - title: Inspect a sample of affected URLs
    detail: "URL Inspection: live test against the indexed version, declared versus Google-selected canonical, crawl allowed, page fetch."
  - title: Match it to a template and a release
    detail: Exclusions clustered on one template almost always trace to a release that changed it.
  - title: Check the usual causes
    detail: Noindex tags, canonicals pointing elsewhere, robots.txt rules, redirects, soft 404s, rendering failures. If the main reason is "Crawled – currently not indexed" or a duplicate-canonical reason, the fix is usually consolidation or better content, not a technical switch.
  - title: Fix at the template, then validate
    detail: Use Validate fix in the Indexing report, and request indexing on priority URLs.
  - title: Add a release check
    detail: Put a pre-launch crawl of changed templates into the client's release process so it doesn't happen again.
---
