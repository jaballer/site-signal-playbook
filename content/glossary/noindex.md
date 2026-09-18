---
term: Noindex
definition: A tag or header telling search engines to keep a page out of the index. The page can still be crawled and its links followed; it just won't appear in results.
signals:
  - index-coverage
questions:
  - crawler-readiness
related:
  - canonical
  - robots-txt
---

Staging sites are built with it, which is exactly why it ends up on production. Check for it first whenever a template disappears from the index after a launch.
