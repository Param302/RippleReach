from constants import SheetColumns


def format_keys(data: list[dict]) -> list[dict]:
    return [{k.lower().replace(' ', '_'): v for k, v in lead.items()} for lead in data]


def format_email_content(email_content: dict, lead: dict, agency_info: dict) -> dict:
    """Format email content by replacing placeholders with actual values."""
    
    email_body = email_content['email']
    email_subject = email_content['subject']

    # Extract agency info
    agency_name = agency_info['Agency Name']
    sender_name = agency_info['Sender Name']
    sender_position = agency_info['Sender Position']
    agency_description = agency_info['Agency Info']
    agency_website = agency_info['Agency Website']
    
    return {
        'subject': email_subject.format(
            role=lead[SheetColumns.ROLE.value],
            company=lead[SheetColumns.COMPANY_NAME.value],
        ),
        'email': email_body.format(
            recipient_name=lead[SheetColumns.NAME.value],
            role=lead[SheetColumns.ROLE.value],
            company=lead[SheetColumns.COMPANY_NAME.value],
            agency_name=agency_name,
            agency_info=agency_description,
            sender_name=sender_name,
            sender_position=sender_position,
            agency_website=agency_website,
            company_description=lead.get(SheetColumns.COMPANY_BACKGROUND.value, '')
        )
    }

