---
order: 6
title: The numbers look wrong
inTheField: Two reports disagree. GA4 says 180 leads, the CRM says 140, and the client's own dashboard says something else again. Nobody can start the review until this is settled, and every minute spent arguing about the number is a minute not spent on the decision it was meant to support.
steps:
  - title: Stop the report going out
    detail: A report sent with numbers that are later corrected costs more credibility than one sent two days late. Say it's on hold and why.
  - title: Check that the date ranges and time zones match
    detail: The most common cause, and the least interesting. GA4's reporting time zone, the CRM's, and whatever the client's dashboard uses are often three different answers, and month boundaries are where they show.
  - title: Check the definitions match before checking the data
    detail: GA4 counts sessions with a key event; the CRM counts records created. A form that creates two records, a lead that arrives by phone, and a duplicate submission each break the tie legitimately. Write down what each system is actually counting.
  - title: Check for duplicate firing
    detail: Run Tag Assistant on the conversion pages. Two containers, a hard-coded tag alongside a tag manager tag, or a thank-you page that also fires on reload all inflate one side.
  - title: Check the filters, the consent banner and the internal exclusion
    detail: A data filter switched from Testing to Active, a consent-mode change, or a new bot-exclusion rule all move the totals from one day to the next, and none of them appear in the report.
  - title: Overlay the change log
    detail: If the gap opens on a specific date, something shipped that day. That's faster than auditing the whole setup.
  - title: Write the difference down and keep it
    detail: A known, explained gap between two systems is fine. An unexplained one isn't. Record the expected variance in the measurement setup record, name which system is the source of truth for each number in the report, and say so in the integrity notes.
plays:
  - measurement-foundations
signals:
  - key-events
  - duplicate-tags
  - internal-traffic
  - change-log
  - organic-leads
questions:
  - trust-the-numbers
---
