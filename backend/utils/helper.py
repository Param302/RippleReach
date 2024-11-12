import re
import json
from constants import SheetColumns
from openai_llm import generate_company_description
from connectors.gsheet import get_lead_by_email, update_sheet_row


def update_description(email: str, description: str) -> bool:
    """Update company description in the sheet"""
    return update_sheet_row(
        email,
        {SheetColumns.COMPANY_BACKGROUND.value: description}
    )


def get_description(email: str) -> dict:
    """Get or generate company description"""
    lead = get_lead_by_email(email)
    if not lead:
        return {"success": False, "error": "Lead not found"}

    existing_description = lead.get(SheetColumns.COMPANY_BACKGROUND.value)
    if existing_description:
        return {"success": True, "description": existing_description}

    company_domain = lead.get(SheetColumns.COMPANY_DOMAIN.value)
    if not company_domain:
        return {"success": False, "error": "Company domain not found"}

    new_description = generate_company_description(company_domain)
    
    return {"success": True, "description": new_description} if update_description(email, new_description) else {"success": False, "error": "Failed to update description"}


def clean_json_string(s: str) -> str:
    return re.sub(r"'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'", r'"\1"', s).encode('utf-8').decode('unicode_escape').replace('\r', '').replace('\n', '{newline}').replace('\t', '{tab}')

def parse_conversation_history(conversation: dict) -> str:
    return json.dumps(conversation, indent=-1)