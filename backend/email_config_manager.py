import os
import configparser

class EmailConfigManager:
    def __init__(self, config_file: str):
        self.config_file = config_file
        self.config = configparser.ConfigParser()
        self.load_config()
    
    def load_config(self) -> None:
        """Load the configuration file"""
        self.config.read(self.config_file)

    
    def get_all_emails(self) -> dict[str, dict[str, str]]:
        """Get all email configurations"""
        return {
            section: dict(self.config[section])
            for section in self.config.sections()
        }
    
    def get_email_details(self, email: str) -> dict[str, str] | None:
        """Get configuration for specific email"""
        return dict(self.config[email]) if email in self.config.sections() else None
    
    def update_email_details(self, email: str, password: str, api_key: str) -> bool:
        """Update or add email configuration"""            
        if email not in self.config.sections():
            self.config.add_section(email)
            
        self.config[email] = {
            'password': password,
            'api_key': api_key
        }
        
        try:
            with open(self.config_file, 'w') as f:
                self.config.write(f)
            return True
        except Exception:
            return False
    
    def delete_email(self, email: str) -> bool:
        """Delete email configuration"""
        if email not in self.config.sections():
            return False
            
        self.config.remove_section(email)
        try:
            with open(self.config_file, 'w') as f:
                self.config.write(f)
            return True
        except Exception:
            return False 