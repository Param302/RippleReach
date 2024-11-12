from connectors.email_monitor import EmailMonitor
from config import Config
from connectors.gsheet import get_leads_data
from constants import SheetColumns, EmailStatus
from app import get_active_replied_leads


if __name__ == "__main__":
    leads = get_active_replied_leads()
    monitor = EmailMonitor(Config.SENDER_CONFIGS[0])
    monitor.check_replies(leads)
    print("DONE")
