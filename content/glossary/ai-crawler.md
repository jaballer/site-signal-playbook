---
term: AI crawler
aliases:
  - Retrieval bot
definition: A bot that fetches pages for an AI system. Some build the index a model searches, some fetch a page live to answer the question in front of them, and some collect training data. They are named separately in robots.txt, so they can be allowed or blocked apart.
signals:
  - ai-crawler-access
questions:
  - crawler-readiness
  - ai-traffic
related:
  - robots-txt
  - llms-txt
  - geo
---

Blocking the training crawlers while allowing the ones that retrieve pages to answer questions is a coherent position, and a common one. Blocking all of them by accident, usually through a CDN rule nobody reviewed, is how a brand disappears from AI answers.
