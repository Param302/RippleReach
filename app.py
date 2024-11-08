from config import Config
from connectors.gsheet import get_leads_data, get_agency_data, update_sheet_row, get_lead_by_email
from flask import Flask, render_template, jsonify, request
from openai_llm import generate_1st_cold_email_content, generate_company_description, generate_standard_response
from utils.formatter import format_email_content, format_keys
from constants import EmailStatus, SheetColumns

app = Flask(__name__)

@app.route("/")
def dashboard():
    leads = format_keys(get_leads_data())
    return render_template('dashboard.html', leads=leads)

@app.route("/api/lead/<lead_email>")
def get_lead(lead_email):
    lead = get_lead_by_email(lead_email)
    
    email_status = lead.get(SheetColumns.EMAIL_STATUS.value) or EmailStatus.NEW.value

    status_info = {
        'status': email_status,
        'is_new': email_status == EmailStatus.NEW.value,
        'is_active': email_status == EmailStatus.SENT.value,
        'is_failed': email_status == EmailStatus.FAILED.value
    }
    
    lead['status_info'] = status_info
    
    lead_details = {
        'email': lead.get(SheetColumns.EMAIL.value, ''),
        'company_domain': lead.get(SheetColumns.COMPANY_DOMAIN.value, ''),
        'name': lead.get(SheetColumns.NAME.value, ''),
        'role': lead.get(SheetColumns.ROLE.value, ''),
        'company_name': lead.get(SheetColumns.COMPANY_NAME.value, '')
    }
    lead.update(lead_details)
    return jsonify(lead)

@app.route("/api/lead/<lead_email>/generate-email", methods=['POST'])
def generate_cold_email(lead_email):
    leads = get_leads_data()
    lead = next((lead for lead in leads if lead['Email'] == lead_email), None)
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404

    agency_info = get_agency_data()
    company_description = generate_company_description(lead[SheetColumns.COMPANY_DOMAIN.value])

    lead[SheetColumns.COMPANY_BACKGROUND.value] = company_description
    update_sheet_row(
        lead[SheetColumns.EMAIL.value],
        {SheetColumns.COMPANY_BACKGROUND.value: company_description}
    )
    
    email_content = generate_1st_cold_email_content(lead, agency_info, company_description)
    formatted_content = format_email_content(email_content, lead, agency_info)

    return jsonify(formatted_content)

@app.route("/api/lead/<lead_email>/send-email", methods=['POST'])
def send_cold_email(lead_email):
    lead = get_lead_by_email(lead_email)
    data = request.json
    email_content = data.get('email_content')
    subject = data.get('email_subject')

    lead[SheetColumns.COLD_EMAIL_SUBJECT.value] = subject
    lead[SheetColumns.EMAIL_CONTENT.value] = email_content
    # update the sheet for Cold Email Subject and Email Content
    update_sheet_row(
        lead[SheetColumns.EMAIL.value],
        {SheetColumns.COLD_EMAIL_SUBJECT.value: subject}
    )
    update_sheet_row(
        lead[SheetColumns.EMAIL.value],
        {SheetColumns.EMAIL_CONTENT.value: email_content}
    )
    
    # Implement your email sending logic here
    # Update lead status to SENT after successful sending
    
    return jsonify({'success': True, 'message': 'Email sent successfully'})

@app.route("/send_emails", methods=["POST"])
def send_emails():
    """Process leads and send emails where needed"""
    # Retrieves leads and agency info, processes each lead, and updates sheets
    ...


@app.route("/send_email", methods=["POST"])
def send_email():
    """Send an email to a single recipient"""
    ...


if __name__ == '__main__':
    app.run(debug=True)


