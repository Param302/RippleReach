from connectors.email_monitor import EmailMonitor
from config import Config


if __name__ == "__main__":
    monitor = EmailMonitor(Config.SENDER_CONFIGS[0])
    monitor.check_replies()