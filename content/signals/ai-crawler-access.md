---
title: AI crawler access
layer: foundations
phases:
  - audit
  - baseline
question: Are AI crawlers allowed in, and actually fetching key pages?
definition: Rules for AI user agents in robots.txt and in CDN or firewall bot settings, split into search and retrieval bots versus training crawlers, confirmed by log hits.
source: robots.txt, CDN or firewall settings, server logs
capture: "Record each AI agent's status: allowed, blocked by robots.txt, or blocked at the CDN. Confirm with hits on priority pages."
read: Search and retrieval bots reach priority pages; training-crawler policy is a deliberate business decision
---

CDN bot protection can block AI crawlers even when robots.txt allows them, and the marketing team rarely sees those settings.
