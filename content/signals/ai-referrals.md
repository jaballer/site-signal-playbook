---
title: AI assistant referrals
layer: traffic
phases:
  - baseline
  - report
question: Do AI assistants send visitors, and do they convert?
definition: Sessions from AI assistants, with landing pages, engagement and key event rate.
source: GA4 custom channel group
capture: An AI assistants channel matching known assistant sources, placed above Referral.
read: Judge on conversion rate against organic; volume is usually small
---

Some AI apps strip the referrer, so part of this traffic lands in Direct. Treat the number as a floor.
