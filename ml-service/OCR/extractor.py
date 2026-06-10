import argparse
import json
import os
import re
import time
import requests
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_MAX_RETRIES = 3


EXPENSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["bills"],
    "properties": {
        "bills": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "restaurant_name",
                    "date",
                    "currency",
                    "items",
                    "confidence",
                ],
                "properties": {
                    "restaurant_name": {"type": ["string", "null"]},
                    "date": {"type": ["string", "null"]},
                    "currency": {"type": ["string", "null"]},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "name",
                                "quantity",
                                "base_amount",
                                "tax_percentage",
                                "taxes_and_charges_allocated",
                                "final_item_amount",
                            ],
                            "properties": {
                                "name": {"type": "string"},
                                "quantity": {"type": ["number", "null"]},
                                "base_amount": {"type": ["number", "null"]},
                                "tax_percentage": {"type": ["number", "null"]},
                                "taxes_and_charges_allocated": {"type": ["number", "null"]},
                                "final_item_amount": {"type": ["number", "null"]},
                            },
                        },
                    },
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                },
            },
        }
    },
}


def money(value):
    if value is None or value == "":
        return ""
    try:
        return str(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    except (InvalidOperation, ValueError):
        return str(value)


def bill_value_signature(value):
    if value in (None, ""):
        return None
    try:
        return str(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    except (InvalidOperation, ValueError):
        return str(value)


def item_signature(item):
    return (
        item.get("name") or "",
        bill_value_signature(item.get("quantity")),
        bill_value_signature(item.get("base_amount")),
        bill_value_signature(item.get("tax_percentage")),
        bill_value_signature(item.get("taxes_and_charges_allocated")),
        bill_value_signature(item.get("final_item_amount")),
    )


def bill_signature(bill):
    return (
        bill.get("date") or "",
        bill.get("currency") or "",
        tuple(item_signature(item) for item in bill.get("items", [])),
    )


def restaurant_name_score(name):
    if not name:
        return 0

    score = 0
    normalized = name.strip().lower()
    legal_entity_terms = {
        "enterprise",
        "enterprises",
        "pvt",
        "private",
        "ltd",
        "limited",
        "llp",
        "company",
        "co",
        "corp",
        "corporation",
        "trading",
        "traders",
        "stores",
        "store",
    }

    if not any(term in normalized for term in legal_entity_terms):
        score += 3

    if name == name.title():
        score += 2
    elif name != name.upper():
        score += 1

    if len(name.split()) <= 4:
        score += 1

    if name.isupper():
        score -= 1

    return score


def choose_preferred_bill(existing_bill, new_bill):
    existing_score = restaurant_name_score(existing_bill.get("restaurant_name") or "")
    new_score = restaurant_name_score(new_bill.get("restaurant_name") or "")

    if new_score > existing_score:
        return new_bill
    return existing_bill


def dedupe_bills(bills):
    deduped = {}
    for bill in bills:
        signature = bill_signature(bill)
        if signature not in deduped:
            deduped[signature] = bill
            continue

        kept_bill = choose_preferred_bill(deduped[signature], bill)

        deduped[signature] = kept_bill

    return list(deduped.values())

def base_amount_calc(bill):
    for item in bill["items"]:
        print(item)
        qty = item.get("quantity") or 1
        final_amount = item.get("final_item_amount")
        item["base_amount"] = round(final_amount / qty, 2)


def normalize_expense_data(data):
    for bill in data.get("bills", []):

        base_amount_calc(bill)

        for item in bill.get("items", []):

            base_amount = item.get("base_amount")
            qty = item.get("quantity") or 1
            if base_amount in (None, ""):
                continue

            try:
                base_amount_decimal = Decimal(str(base_amount))* Decimal(str(qty))
            except (InvalidOperation, ValueError):
                continue

            item_tax_percentage = item.get("tax_percentage")
            if item_tax_percentage in (None, ""):
                allocated_tax = item.get("taxes_and_charges_allocated")
            else:
                try:
                    allocated_tax = (
                        base_amount_decimal
                        * Decimal(str(item_tax_percentage))
                        / Decimal("100")
                    )
                except (InvalidOperation, ValueError, ZeroDivisionError):
                    allocated_tax = item.get("taxes_and_charges_allocated")

            if allocated_tax not in (None, ""):
                item["taxes_and_charges_allocated"] = float(
                    Decimal(str(allocated_tax)).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    )
                )

            final_item_amount = base_amount_decimal
            if item.get("taxes_and_charges_allocated") not in (None, ""):
                try:
                    final_item_amount += Decimal(
                        str(item["taxes_and_charges_allocated"])
                    )
                except (InvalidOperation, ValueError):
                    pass
            item["final_item_amount"] = float(
                final_item_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )

    data["bills"] = dedupe_bills(data.get("bills", []))
    return data


def extract_output_text(response_json):
    if response_json.get("output_text"):
        return response_json["output_text"]

    chunks = []
    for output in response_json.get("output", []):
        for content in output.get("content", []):
            if content.get("type") == "output_text" and "text" in content:
                chunks.append(content["text"])
    return "".join(chunks)


def get_api_error_message(response):
    try:
        error = response.json().get("error", {})
    except ValueError:
        return response.text.strip()

    message = error.get("message") or response.text.strip()
    error_type = error.get("type")
    error_code = error.get("code")

    details = []
    if error_type:
        details.append(f"type={error_type}")
    if error_code:
        details.append(f"code={error_code}")

    if details:
        return f"{message} ({', '.join(details)})"
    return message


def raise_for_api_error(response):
    if response.status_code != 429:
        raise RuntimeError(
            f"OpenAI API error {response.status_code}: {get_api_error_message(response)}"
        )

    message = get_api_error_message(response)
    lower_message = message.lower()
    if "insufficient_quota" in lower_message or "quota" in lower_message:
        raise RuntimeError(
            "OpenAI API quota/billing limit reached. Check your account billing, "
            f"project limits, or try a different API key. API message: {message}"
        )

    raise RuntimeError(
        "OpenAI API rate limit reached after retries. Wait a minute and run again, "
        "or use a smaller input/model. "
        f"API message: {message}"
    )


def retry_delay(response, attempt):
    retry_after = response.headers.get("retry-after")
    if retry_after:
        try:
            return max(1.0, float(retry_after))
        except ValueError:
            pass
    return min(30.0, 2.0**attempt)


def call_openai(extracted_text, model, max_retries):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. In PowerShell, run: "
            "$env:OPENAI_API_KEY='your_api_key_here'"
        )

    instructions = (
        "You extract restaurant expense data from noisy OCR receipt text. "
        "Return only data supported by the OCR. "
        "Fix obvious OCR mistakes when context is clear. "
        "Check each word for missing, swapped, or incorrect letters and autocorrect likely OCR errors when the surrounding context makes the intended word clear. "
        "Correct common OCR confusions such as 0/O, 1/I/l, rn/m, cl/d, and broken characters inside item names or tax labels. "
        "Extract item names, quantities, and monetary values exactly as they appear on the receipt. "
        "When only one monetary value is shown for an item, always treat that value as final_item_amount. "
        "Do not assume that a unit price exists unless two distinct monetary values are explicitly present for the item. "
        "Only set base_amount to a different value when both a unit price and a line total are clearly present on the receipt. "
        "If only one amount is present together with a quantity, set final_item_amount to the printed amount and leave base_amount equal to that same amount. "
        "Do not multiply monetary values by quantity unless the receipt explicitly provides separate unit prices. "
        "Extract the total bill-level tax percentage and store it in tax_percentage for each item. "
        "If multiple taxes are present (for example CGST 9% and SGST 9%), add them together and use the combined percentage (18% in this example). "
        "If a tax percentage is explicitly written on the receipt, use that value. "
        "If only tax amounts are available, calculate the effective tax percentage using subtotal and total tax amount when supported by the receipt. "
        "If these values are not explicitly present on the receipt, return null for them. "
        "Do not modify final_item_amount using taxes. "
        "Do not invent, estimate, or infer monetary values that are not supported by the OCR text. "
        "Do not include any bill-level final amount field."
    )

    payload = {
        "model": model,
        "instructions": instructions,
        "input": extracted_text,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "restaurant_expenses",
                "strict": True,
                "schema": EXPENSE_SCHEMA,
            }
        },
    }

    for attempt in range(max_retries + 1):
        response = requests.post(
            OPENAI_RESPONSES_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=120,
        )

        if response.ok:
            break

        if response.status_code != 429 or attempt == max_retries:
            raise_for_api_error(response)

        delay = retry_delay(response, attempt)
        print(
            f"Rate limited by OpenAI. Retrying in {delay:.0f} seconds "
            f"({attempt + 1}/{max_retries})..."
        )
        time.sleep(delay)

    output_text = extract_output_text(response.json())
    if not output_text:
        raise RuntimeError("The API response did not contain output text.")
    return json.loads(output_text)


def write_json(data, output_json):
    with open(output_json, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def extract(INPUT_FILE, OUTPUT_DIR, OUTPUT_JSON):
    parser = argparse.ArgumentParser(
        description="Use the OpenAI API to convert OCR receipt text into an expense table."
    )
    parser.add_argument("--input", default=str(INPUT_FILE), help="OCR text file to read.")
    parser.add_argument("--json", default=str(OUTPUT_JSON), help="Structured JSON to write.")
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_MODEL", DEFAULT_MODEL),
        help="OpenAI model to use. Defaults to OPENAI_MODEL or gpt-5.4-mini.",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=DEFAULT_MAX_RETRIES,
        help="Number of retries for temporary OpenAI rate limits.",
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as file:
        extracted_text = file.read().strip()

    if not extracted_text:
        raise RuntimeError(f"No OCR text found in {args.input}.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    data = call_openai(extracted_text, args.model, args.max_retries)
    normalize_expense_data(data)
    write_json(data, args.json)

    print(f"Wrote {args.json}")
