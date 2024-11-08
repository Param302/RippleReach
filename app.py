from config import Config
from connectors.gsheet import get_leads_data, get_agency_data, update_sheet_row, get_lead_by_email
from flask import Flask, render_template, jsonify, request
from openai_llm import generate_1st_cold_email_content, generate_company_description, generate_standard_response
from utils.email_integration import send_round_robin_email
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
    
    # Get current email status from sheet, default to NEW if not set
    current_status = lead.get(SheetColumns.EMAIL_STATUS.value)
    if not current_status:
        current_status = EmailStatus.NEW.value
        update_sheet_row(
            lead[SheetColumns.EMAIL.value],
            {SheetColumns.EMAIL_STATUS.value: EmailStatus.NEW.value}
        )
    
    status_info = {
        'status': current_status,
    }
    
    # Expanded lead details including email history
    lead_details = {
        'email': lead.get(SheetColumns.EMAIL.value, ''),
        'company_domain': lead.get(SheetColumns.COMPANY_DOMAIN.value, ''),
        'name': lead.get(SheetColumns.NAME.value, ''),
        'role': lead.get(SheetColumns.ROLE.value, ''),
        'company_name': lead.get(SheetColumns.COMPANY_NAME.value, ''),
        'company_size': lead.get(SheetColumns.COMPANY_SIZE.value, ''),
        'headline': lead.get(SheetColumns.HEADLINE.value, ''),
        'industry': lead.get(SheetColumns.INDUSTRY.value, ''),
        'email_history': {
            'subject': lead.get(SheetColumns.COLD_EMAIL_SUBJECT.value, ''),
            'content': lead.get(SheetColumns.EMAIL_CONTENT.value, ''),
            'sender': lead.get(SheetColumns.SENDER_EMAIL.value, ''),
            'sent_at': lead.get(SheetColumns.LAST_MESSAGE.value, '')
        }
    }
    
    lead['status_info'] = status_info
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
    data = request.json
    sender_email = data.get('sender_email')
    
    # Validate sender email
    sender_config = next((config for config in Config.SENDER_CONFIGS 
                         if config['email'] == sender_email), None)
    if not sender_config:
        return jsonify({'error': 'Invalid sender email'}), 400
    
    lead = get_lead_by_email(lead_email)
    
    context = {
        'paragraphs': data['email_content'].split('\n\n'),
        'calendar_link': Config.CALENDAR_LINK,
        'sender_name': sender_config['display_name'],
        'sender_position': Config.AGENCY_INFO['sender']['position'],
        'agency_name': Config.AGENCY_INFO['name'],
        'agency_website': Config.AGENCY_INFO['website'],
    }
    html_content = render_template('emails/email_template.html', **context)
    
    send_round_robin_email(sender_email, lead[SheetColumns.EMAIL.value], 
                            data['email_subject'], html_content)
    
    update_sheet_row(
        lead[SheetColumns.EMAIL.value],
        {
            SheetColumns.EMAIL_STATUS.value: EmailStatus.SENT.value,
            SheetColumns.COLD_EMAIL_SUBJECT.value: data['email_subject'],
            SheetColumns.EMAIL_CONTENT.value: data['email_content'],
            SheetColumns.SENDER_EMAIL.value: sender_email
        }
    )
        
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

@app.route("/api/sender-configs")
def get_sender_configs():
    return jsonify(Config.SENDER_CONFIGS)

if __name__ == '__main__':
    app.run(debug=True)


