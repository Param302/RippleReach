from config import Config
from flask_cors import CORS
from utils.helper import get_description
from constants import EmailStatus, SheetColumns
from utils.email_integration import send_round_robin_email
from flask import Flask, render_template, jsonify, request
from utils.formatter import format_email_content, format_keys
from connectors.gsheet import get_leads_data, get_agency_data, update_sheet_row, get_lead_by_email
from openai_llm import generate_1st_cold_email_content, generate_company_description, generate_standard_response

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])


@app.route("/")
def dashboard():
    leads = get_leads_data()
    total_leads = len(leads)
    outeach = 0
    conversations = 0

    for i in leads:
        if i[SheetColumns.EMAIL_STATUS.value] == EmailStatus.SENT.value:
            outeach += 1
        if i[SheetColumns.EMAIL_STATUS.value] in (EmailStatus.REPLIED.value, EmailStatus.ACTIVE.value):
            conversations += 1

    # return render_template('dashboard.html', total_leads=total_leads, outeach=outeach, conversations=conversations)
    return jsonify({'total_leads': total_leads, 'outreach': outeach, 'conversations': conversations})

@app.route("/api/send_emails")
def send_emails():
    leads = format_keys(get_leads_data())
    for lead in leads:
        if not lead["email_status"]:
            lead["email_status"] = EmailStatus.NEW.value
        
    # return render_template('send_emails.html', leads=leads)
    return jsonify(leads)


@app.route("/api/lead/<lead_email>/generate-email", methods=['POST'])
def generate_cold_email(lead_email):
    leads = get_leads_data()
    lead = next((lead for lead in leads if lead['Email'] == lead_email), None)
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404

    agency_info = get_agency_data()

    if not (company_description := lead[SheetColumns.COMPANY_BACKGROUND.value]):
        description_result = get_description(lead_email)
        if not description_result['success']:
            return jsonify({'error': description_result['error']}), 400
        
        company_description = description_result['description']
    email_content = generate_1st_cold_email_content(lead, agency_info, company_description)
    formatted_content = format_email_content(email_content, lead, agency_info)

    return jsonify(formatted_content)


@app.route("/api/lead/<lead_email>/details")
def get_lead_details(lead_email):
    lead = get_lead_by_email(lead_email)
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404

    if lead.get(SheetColumns.COMPANY_BACKGROUND.value) is None:
        description_result = get_description(lead_email)
        if not description_result['success']:
            return jsonify({'error': description_result['error']}), 400
        
        lead[SheetColumns.COMPANY_BACKGROUND.value] = description_result['description']
    
    lead_details = {
        'basic_info': {
            'email': lead.get(SheetColumns.EMAIL.value, ''),
            'name': lead.get(SheetColumns.NAME.value, ''),
            'role': lead.get(SheetColumns.ROLE.value, ''),
            'headline': lead.get(SheetColumns.HEADLINE.value, ''),
        },
        'company_info': {
            'company_name': lead.get(SheetColumns.COMPANY_NAME.value, ''),
            'company_domain': lead.get(SheetColumns.COMPANY_DOMAIN.value, ''),
            'company_size': lead.get(SheetColumns.COMPANY_SIZE.value, ''),
            'industry': lead.get(SheetColumns.INDUSTRY.value, ''),
            'company_description': lead.get(SheetColumns.COMPANY_BACKGROUND.value, '')
        },
        'email_status': {
            'status': lead.get(SheetColumns.EMAIL_STATUS.value, ''),
            'last_message': lead.get(SheetColumns.LAST_MESSAGE.value, ''),
            'email_subject': lead.get(SheetColumns.COLD_EMAIL_SUBJECT.value, ''),
            'email_content': lead.get(SheetColumns.EMAIL_CONTENT.value, ''),
            'sender_email': lead.get(SheetColumns.SENDER_EMAIL.value, '')
        }
    }
    
    return jsonify(lead_details)


@app.route("/api/lead/<lead_email>/send-email", methods=['POST'])
def send_cold_email(lead_email):
    data = request.json
    lead = get_lead_by_email(lead_email)
    context = {
        'paragraphs': data['email'].split('\n\n'),
        'calendar_link': Config.CALENDAR_LINK,
        'sender_position': Config.AGENCY_INFO['sender']['position'],
        'agency_name': Config.AGENCY_INFO['name'],
        'agency_website': Config.AGENCY_INFO['website'],
    }
    html_content = render_template('emails/email_template.html', **context)
    
    response = send_round_robin_email(lead[SheetColumns.EMAIL.value], 
                            data['subject'], html_content)

    update_sheet_row(
        lead[SheetColumns.EMAIL.value],
        {
            SheetColumns.EMAIL_STATUS.value: EmailStatus.SENT.value,
            SheetColumns.COLD_EMAIL_SUBJECT.value: data['subject'],
            SheetColumns.EMAIL_CONTENT.value: data['email'],
            SheetColumns.SENDER_EMAIL.value: response['details']['from']
        }
    )
        
    return jsonify({'success': True, 'message': 'Email sent successfully', 'details': response})


@app.route("/send_email", methods=["POST"])
def send_email():
    """Send an email to a single recipient"""
    ...

@app.route("/api/sender-configs")
def get_sender_configs():
    return jsonify(Config.SENDER_CONFIGS)

if __name__ == '__main__':
    app.run(debug=True)


