from flask import Flask
from config import Config
from connectors.gsheet import get_leads_data, get_agency_data


app = Flask(__name__)

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



# if __name__ == '__main__':
#     app.run(debug=True)


