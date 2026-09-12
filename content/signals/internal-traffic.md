---
title: Internal traffic exclusion
layer: integrity
phases:
  - baseline
question: Are we counting ourselves?
definition: Whether the GA4 internal-traffic filter is active and covers the client team, the agency and contractors.
source: GA4 data filters
capture: Set the filter to Active, and give testers a QA cookie or a staging property.
read: No internal sessions in reported numbers
---

IP-based exclusion misses remote teams and anyone testing on a phone. Check it; don't assume it.
