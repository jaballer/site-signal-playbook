---
title: Change log against the data
layer: integrity
phases:
  - baseline
  - execute
  - report
question: Is a movement real, or did something ship?
definition: A dated log of releases, content shipped, tag publishes, robots or CDN changes and Google updates, overlaid on the scorecard.
source: Shared log plus GA4 annotations
capture: Log every change the day it ships, and add Google's confirmed updates from the Search Status Dashboard.
read: Any movement within a few days of a change gets investigated before it's reported
---

Spikes that land on tag-publish dates are testing or double-firing, and they inflate the baseline that next quarter's 'decline' is measured against.
