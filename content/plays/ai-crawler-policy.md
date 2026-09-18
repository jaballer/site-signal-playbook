---
order: 3
title: Set the AI crawler policy
when: Nobody has decided which AI crawlers may read the site, or a blanket block is keeping the brand out of AI answers.
effort: S
firstSignal: days
owner: technical
timing: Days to weeks for access changes to show in logs, then weeks before answers change.
steps:
  - List the crawlers reaching the site from server or CDN logs, and separate the ones that index for search from the ones that retrieve a page to answer a live question
  - Agree a written policy with the client on which to allow, and get it approved by whoever owns their content terms
  - Set robots.txt, CDN and firewall rules to match the policy, and stop rate limiting the ones that are allowed
  - Publish an llms.txt listing the pages worth reading, and keep it current with the sitemap
  - Re-check the logs a month later to confirm the allowed crawlers arrive and the blocked ones don't
moves:
  - ai-crawler-access
  - crawlability
dependsOn:
  - unblock-crawling
related:
  - correct-ai-answers
watchOut: Blocking training crawlers while allowing retrieval crawlers is a legitimate position, but it has to be the client's decision, in writing. llms.txt is an emerging convention, not a standard every engine honours, so treat it as cheap insurance rather than a fix.
---
