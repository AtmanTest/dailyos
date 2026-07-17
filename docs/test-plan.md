# DailyOS — Test Plan

## Overview

This document covers both **automated tests** (run in CI) and **manual tests**
(performed during development or QA).

---

## Automated Tests

### pytest (`scripts/test_scripts.py`)

Run via CI workflow. Tests cover:

| Test | What It Verifies |
|------|-----------------|
| `test_validate_data_structure` | Data files match expected schema |
| `test_demo_data_loads` | `data/demo/` files are valid JSON |
| `test_seed_sql_is_valid` | `seed_demo.sql` can be parsed |
| `test_env_example_format` | `.env.example` contains all required keys |
| `test_workflow_yaml_valid` | GitHub Action YAML files are valid |
| `test_doc_links_resolve` | Internal doc links reference existing files |
| `test_mermaid_syntax` | Mermaid diagrams have valid syntax |

### validation (`scripts/validate_data.py`)

A standalone validation script that checks:

1. **Demo data**: All JSON files in `data/demo/` match the raw_entries schema
2. **Schema integrity**: No missing required fields
3. **Seed SQL**: Can be parsed by `sqlparse` for basic validity
4. **Docs completeness**: All expected doc files exist
5. **Workflow consistency**: All referenced scripts exist in `scripts/`

### Running Locally

```bash
# Install test dependencies
pip install -r scripts/requirements.txt

# Run pytest
pytest scripts/test_scripts.py -v

# Run validation
python3 scripts/validate_data.py
```

---

## Manual Test Checklist

### Core Functionality

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | **Capture entry** | Open frontend, type a note, submit | Entry appears in the feed immediately |
| 2 | **View today's entries** | Click "Today" or load page | Only today's entries shown, newest first |
| 3 | **View yesterday's entries** | Navigate to yesterday | Correct date range displayed |
| 4 | **Edit entry** | Click edit on an entry, change content | Entry updated, timestamp shows "edited" |
| 5 | **Delete entry** | Click delete, confirm | Entry removed, feed updates |
| 6 | **Filter by type** | Select filter: "ideas" only | Only entries with type=idea shown |
| 7 | **Filter by tag** | Click a tag on an entry | Feed filtered to show entries with that tag |
| 8 | **Search content** | Type in search box | Entries matching query displayed |

### Ideas

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 9 | **Create idea** | Submit an entry with type=idea | Appears in ideas list |
| 10 | **Change idea status** | Click status, select "exploring" | Status updates, idea moves to correct section |
| 11 | **Rate idea potential** | Set potential slider to 8 | Value displayed, can be used for sorting |
| 12 | **Set next action** | Add a next action text | Action displayed on idea card |

### Reminders

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 13 | **Create reminder** | Submit with type=task | Reminder appears in agenda |
| 14 | **Mark reminder done** | Click checkbox on reminder | Reminder moves to done section |
| 15 | **Snooze reminder** | Click snooze, select 1 hour | Reminder disappears, reappears after 1h |
| 16 | **Filter reminders** | Select "active" filter | Only active reminders shown |
| 17 | **Sort by priority** | Click priority column header | High priority items sorted to top |

### Insights & Summaries

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 18 | **View daily summary** | Click on a date with summary | Summary displays headline, mood, highlights |
| 19 | **Check mood trend** | View last 7 days chart | Trend line shows mood/energy changes |
| 20 | **Weekly review** | Navigate to weekly review section | Wins, frictions, goals displayed |
| 21 | **Monthly review** | Navigate to monthly review section | Broader patterns and insights displayed |

### UI & UX

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 22 | **Toggle theme** | Click theme toggle (dark/light) | UI switches to dark/light mode smoothly |
| 23 | **Responsive: 320px** | Resize browser to 320px width | No horizontal scroll, all content accessible |
| 24 | **Responsive: 375px** | Resize to 375px (iPhone SE) | Layout adapts, touch targets ≥ 44px |
| 25 | **Responsive: 768px** | Resize to 768px (iPad) | Tablet layout with split panes if applicable |
| 26 | **Responsive: 1024px** | Resize to 1024px | Desktop layout activates |
| 27 | **Responsive: 1440px** | Resize to 1440px | Full desktop, no wasted space |
| 28 | **Keyboard navigation** | Tab through all interactive elements | Focus outline visible, logical order |
| 29 | **Tab through entries** | Press Tab on entry card | Edit/delete buttons receive focus |

### Empty States

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 30 | **No entries yet** | Fresh account, no data | Friendly "No entries yet" message with CTA |
| 31 | **No reminders** | All reminders done | "All caught up!" message |
| 32 | **No ideas** | Ideas list empty | "What are you thinking about?" prompt |
| 33 | **No search results** | Search for non-existent text | "No results found" with suggestion |
| 34 | **No insights yet** | First day of use | "Start capturing to see insights" message |

### Error States

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 35 | **Network offline** | Disconnect network, try to submit entry | Error banner: "Could not save. Retry?" |
| 36 | **API returns 401** | Expired/invalid JWT | Redirect to login or show "Session expired" |
| 37 | **API returns 429** | Hit rate limit | "Too many requests, slow down" with retry-after |
| 38 | **Submit empty content** | Click submit with empty text | Inline validation: "Content required" |
| 39 | **Submit very long text** | Paste 10001 characters | Character limit error shown |
| 40 | **Invalid type** | Send invalid type via API | 400 error with validation message |

---

## QA Workflow

For systematic QA, follow this process:

1. **Run automated tests**: `pytest scripts/test_scripts.py -v`
2. **Validate data**: `python3 scripts/validate_data.py`
3. **Manual smoke test**: Core flow (tests 1, 2, 6, 9, 14, 18, 22)
4. **Regression**: After any change, re-run tests 1-29
5. **Edge cases**: Tests 30-40
6. **Cross-browser**: Chrome, Firefox, Safari, Edge
7. **Mobile**: iOS Safari, Android Chrome

A QA workflow skill can be configured to run these checks automatically
on pull requests.
