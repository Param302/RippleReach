from flask_apscheduler import APScheduler
from connectors.email_monitor import EmailMonitor
from config import Config
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

scheduler = APScheduler()

def check_single_email(config):
    """Check replies for a single email configuration"""
    email_config = {
        "email": config["email"],
        "password": config["password"],
        "imap_server": "mail.privateemail.com",
        "imap_port": 993
    }
    
    try:
        monitor = EmailMonitor(email_config)
        monitor.check_replies()
        print(f"Successfully checked {config['email']}")
        return True
    except Exception as e:
        print(f"Error checking {config['email']}: {e}")
        return False

def check_email_replies():
    print(f"Starting parallel email checks at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Use ThreadPoolExecutor to run checks in parallel
    with ThreadPoolExecutor(max_workers=len(Config.SENDER_CONFIGS)) as executor:
        # Submit all tasks
        future_to_email = {
            executor.submit(check_single_email, config): config["email"] 
            for config in Config.SENDER_CONFIGS
        }
        
        # Process results as they complete
        for future in as_completed(future_to_email):
            email = future_to_email[future]
            try:
                success = future.result()
                if success:
                    print(f"Completed check for {email}")
                else:
                    print(f"Failed to check {email}")
            except Exception as e:
                print(f"Exception checking {email}: {e}")
    
    print("Completed all parallel email checks")


def x():
    # Configure scheduler
    scheduler = APScheduler(scheduler=BackgroundScheduler(daemon=True))
    scheduler.init_app(app)

    # Add the job to check emails every minute
    scheduler.add_job(
        id='check_email_replies',
        func=check_email_replies,
        trigger='interval',
        minutes=1,
        max_instances=1,  # Only one instance can run at a time
        replace_existing=True  # Replace any existing job with same ID
    )

    # Start the scheduler with the app
    with app.app_context():
        if not scheduler.running:
            scheduler.start()