---
order: 2
title: Stand up measurement foundations
when: The trust check fails, or the AI channel, brand split or CRM source fields are missing.
effort: S
firstSignal: immediate
owner: analytics
steps:
  - Create the AI assistants channel
  - Mark real conversions as key events
  - Write and version the brand-term list
  - Set content groups by buyer stage
  - Link Search Console and GA4, and confirm CRM original-source fields
  - Sign off the keyword and prompt sets as the fixed denominators
  - Turn on the internal-traffic filter and check conversion pages fire each tag once
  - Open the change log, and mirror it as GA4 annotations
moves:
  - key-events
  - brand-list
  - ai-referrals
  - search-pipeline
  - prompt-set
  - buyer-stage
  - change-log
  - duplicate-tags
  - internal-traffic
watchOut: Key events and custom dimensions don't backfill, though channel groups do. Every week of delay is lost history.
---
