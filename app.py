from config import Config
from connectors.gsheet import get_leads_data, get_agency_data
from flask import Flask, render_template, jsonify, request
from openai_llm import generate_1st_cold_email_content, generate_company_description, generate_standard_response
from utils.formatter import format_keys
from constants import EmailStatus, SheetColumns

app = Flask(__name__)

@app.route("/")
def dashboard():
    leads = format_keys(get_leads_data())
    print(leads)
    return render_template('dashboard.html', leads=leads)

@app.route("/api/lead/<lead_email>")
def get_lead(lead_email):
    leads = get_leads_data()
    lead = next((lead for lead in leads if lead['Email'] == lead_email), None)
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404
    
    # Add status info for frontend
    status_info = {
        'status': lead.get('email_status', EmailStatus.NEW),
        'is_new': lead.get('email_status') == EmailStatus.NEW,
        'is_active': lead.get('email_status') == EmailStatus.SENT,
        'is_failed': lead.get('email_status') == EmailStatus.FAILED
    }
    
    lead['status_info'] = status_info
    # Add basic lead details
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
    lead = next((lead for lead in leads if lead['email'] == lead_email), None)
    if not lead:
        return jsonify({'error': 'Lead not found'}), 404

    agency_info = get_agency_info()  # You'll need to implement this
    company_description = generate_company_description(lead['company_domain'])
    
    email_content = generate_1st_cold_email_content(lead, agency_info, company_description)
    return jsonify(email_content)

@app.route("/api/lead/<lead_email>/send-email", methods=['POST'])
def send_cold_email(lead_email):
    data = request.json
    email_content = data.get('email_content')
    subject = data.get('subject')
    
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

# print(get_leads_data())



if __name__ == '__main__':
    app.run(debug=True)


