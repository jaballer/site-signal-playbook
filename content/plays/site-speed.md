---
order: 4
title: Fix what makes the site slow
when: Core Web Vitals fail on priority templates in field data, or a template is slow enough that crawlers time out.
effort: M
firstSignal: weeks
owner: technical
timing: The lab number moves the day it ships. Field data is a 28-day rolling window, so the reported figure takes about a month to catch up.
steps:
  - Work from field data, not lab scores, and group failures by template rather than by URL
  - Take the worst template first and name the single biggest contributor to LCP, INP or CLS
  - Fix the usual causes, in order, images without dimensions or the wrong format, render-blocking scripts, third-party tags, and layout that shifts as fonts and embeds load
  - Re-test the template, then hold the line with a budget the client's developers check before release
moves:
  - cwv
  - crawlability
related:
  - unblock-crawling
watchOut: Speed rarely wins rankings on its own, so don't sell it as a ranking play. Sell it where it belongs, as conversion and crawl efficiency, and only when a template is genuinely failing. A site that already passes doesn't need this.
---
