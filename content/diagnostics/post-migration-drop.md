---
order: 8
title: Traffic fell after launch
inTheField: The new site went live two weeks ago. Design is happy, the client is not, and organic traffic is down by a third. The redirect map covered the main navigation and missed the resource library, which was where most of the links and most of the non-branded traffic were.
steps:
  - title: Establish what the site looked like before
    detail: The old crawl, the old sitemap, Search Console's pre-launch top pages and queries, and the old analytics. Without a before, nothing that follows can be measured. If there's no benchmark, reconstruct one from Search Console's sixteen-month history and a third-party crawler's index before doing anything else.
  - title: Crawl the old URL list against the live site
    detail: Every old URL that returns a 404, a soft 404, a 302, a redirect chain, or a redirect to the home page is a finding. Sort by the traffic and referring domains each URL used to have, and fix in that order.
  - title: Check the redirects land on the right page
    detail: Bulk redirects to the home page or to a category index are technically alive and practically the same as a 404. Each should go to the closest equivalent page.
  - title: Check indexing of the new URLs
    detail: Submit the new sitemap, then watch Indexing → Pages for the new set being discovered and the old set being replaced. A large "Discovered – currently not indexed" group on the new site points at crawl budget or internal linking.
  - title: Check what the templates lost
    detail: Compare old and new templates for copy that was cut, headings that became images, content that now loads with JavaScript, schema that wasn't carried over, and internal links that lived in a module the redesign removed.
  - title: Check the technical carry-over
    detail: Canonicals, hreflang, robots.txt, noindex left over from staging, and analytics tags that were reinstalled on some templates but not others.
  - title: Report the recovery curve honestly
    detail: Once the redirects and templates are fixed, recovery takes one to three months and is rarely complete. Say that at the start, with the weekly indicators you'll report against, rather than promising a return to the old numbers.
plays:
  - protect-migration
  - unblock-crawling
  - internal-linking
signals:
  - migration-risk
  - index-coverage
  - crawlability
  - nb-clicks
questions:
  - traffic-drop
  - crawler-readiness
---
