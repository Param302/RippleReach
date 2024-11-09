from constants import SheetColumns
from openai_llm import generate_company_description
from connectors.gsheet import get_lead_by_email, update_sheet_row

def update_description(email: str, description: str) -> bool:
    """Update company description in the sheet"""
    update_sheet_row(
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
    update_description(email, new_description)

    return {"success": True, "description": new_description}