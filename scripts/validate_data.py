"""
Data validation module for DailyOS demo data.
Loads all demo JSON files and validates against Pydantic schemas.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schemas import RawEntry, DailySummary, Idea, Reminder, Insight


def load_json(filepath: str) -> list[dict]:
    """Load a JSON file and return parsed data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def validate_raw_entries(data: list[dict]) -> tuple[int, int, list[str]]:
    """Validate all items against RawEntry schema. Returns (pass, fail, errors)."""
    passed = 0
    failed = 0
    errors = []
    for i, item in enumerate(data):
        try:
            RawEntry(**item)
            passed += 1
        except Exception as e:
            failed += 1
            errors.append(f"  Entry #{i}: {e}")
    return passed, failed, errors


def validate_daily_summaries(data: list[dict]) -> tuple[int, int, list[str]]:
    """Validate all items against DailySummary schema."""
    passed = 0
    failed = 0
    errors = []
    for i, item in enumerate(data):
        try:
            DailySummary(**item)
            passed += 1
        except Exception as e:
            failed += 1
            errors.append(f"  Summary #{i}: {e}")
    return passed, failed, errors


def validate_ideas(data: list[dict]) -> tuple[int, int, list[str]]:
    """Validate all items against Idea schema."""
    passed = 0
    failed = 0
    errors = []
    for i, item in enumerate(data):
        try:
            Idea(**item)
            passed += 1
        except Exception as e:
            failed += 1
            errors.append(f"  Idea #{i}: {e}")
    return passed, failed, errors


def validate_reminders(data: list[dict]) -> tuple[int, int, list[str]]:
    """Validate all items against Reminder schema."""
    passed = 0
    failed = 0
    errors = []
    for i, item in enumerate(data):
        try:
            Reminder(**item)
            passed += 1
        except Exception as e:
            failed += 1
            errors.append(f"  Reminder #{i}: {e}")
    return passed, failed, errors


def validate_insights(data: list[dict]) -> tuple[int, int, list[str]]:
    """Validate all items against Insight schema."""
    passed = 0
    failed = 0
    errors = []
    for i, item in enumerate(data):
        try:
            Insight(**item)
            passed += 1
        except Exception as e:
            failed += 1
            errors.append(f"  Insight #{i}: {e}")
    return passed, failed, errors


def validate_demo_data(demo_dir: str = None) -> dict:
    """
    Load all demo JSON files and validate against schemas.
    Returns a dict with pass/fail/errors for each file.
    """
    if demo_dir is None:
        demo_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'data', 'demo'
        )

    results = {}

    files_to_check = [
        ('raw_entries.json', validate_raw_entries, f"raw_entries.json must exist in {demo_dir}"),
        ('daily_summaries.json', validate_daily_summaries, f"daily_summaries.json must exist in {demo_dir}"),
        ('ideas.json', validate_ideas, f"ideas.json must exist in {demo_dir}"),
        ('reminders.json', validate_reminders, f"reminders.json must exist in {demo_dir}"),
        ('insights.json', validate_insights, f"insights.json must exist in {demo_dir}"),
    ]

    overall_pass = True

    for filename, validator, error_msg in files_to_check:
        filepath = os.path.join(demo_dir, filename)
        if not os.path.exists(filepath):
            results[filename] = {
                'pass': False,
                'errors': [f"File not found: {filepath}"],
                'passed': 0,
                'failed': 0,
                'total': 0
            }
            overall_pass = False
            continue

        try:
            data = load_json(filepath)
            total = len(data)
            passed, failed, errors = validator(data)

            file_pass = failed == 0
            results[filename] = {
                'pass': file_pass,
                'errors': errors,
                'passed': passed,
                'failed': failed,
                'total': total,
            }
            if not file_pass:
                overall_pass = False
        except Exception as e:
            results[filename] = {
                'pass': False,
                'errors': [str(e)],
                'passed': 0,
                'failed': 0,
                'total': 0
            }
            overall_pass = False

    results['overall_pass'] = overall_pass
    return results


def print_validation_results(results: dict):
    """Pretty-print validation results."""
    print("=" * 60)
    print("  DAILYOS DEMO DATA VALIDATION REPORT")
    print("=" * 60)

    for key in sorted(results.keys()):
        if key == 'overall_pass':
            continue
        entry = results[key]
        status = "✅ PASS" if entry['pass'] else "❌ FAIL"
        print(f"\n  {key}: {status}")
        print(f"    Total: {entry['total']}, Passed: {entry['passed']}, Failed: {entry['failed']}")
        for err in entry['errors'][:5]:
            print(f"    {err}")

    print("\n" + "=" * 60)
    overall = results.get('overall_pass', False)
    if overall:
        print("  ✅ OVERALL: ALL VALIDATIONS PASSED")
    else:
        print("  ❌ OVERALL: SOME VALIDATIONS FAILED")
    print("=" * 60)


if __name__ == '__main__':
    results = validate_demo_data()
    print_validation_results(results)
