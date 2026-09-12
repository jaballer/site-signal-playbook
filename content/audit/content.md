---
order: 2
title: Content & topical authority
question: Does the site have the best page for each priority topic at each buyer stage?
signals:
  - topic-coverage
  - cannibalization
  - content-decay
  - content-quality
  - extractability
  - internal-links
checks:
  - check: Topic coverage
    how: Map priority topics by buyer stage to existing pages
    fail: No page for comparison, alternatives, pricing or integration topics
  - check: Cannibalization
    how: Search Console queries with more than one ranking URL
    fail: Two or more pages trading positions on priority terms
  - check: Content decay
    how: Clicks per page against the same period last year
    fail: Priority pages losing a large share of clicks, with no refresh planned
  - check: Experience and expertise
    how: Score priority pages for named expert authors, original data or examples, sources and update dates
    fail: Anonymous, generic pages on topics where competitors publish original data
  - check: Answer-first structure
    how: Read the first screen of each priority page as a buyer asking the target question
    fail: The answer is buried under marketing copy, or sits in tabs or images
  - check: Internal links
    how: Crawl for internal links into priority pages
    fail: Money pages linked only from the navigation
---
