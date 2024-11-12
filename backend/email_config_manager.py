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
    
    def update_email_details(self, email: str, display_name: str, password: str, api_key: str) -> bool:
        """Update or add email configuration"""            
        if email not in self.config.sections():
            self.config.add_section(email)
            
        self.config[email] = {
            'display_name': display_name,
            'password': password,
            'api_key': api_key
        }
        
        try:
            with open(self.config_file, 'w') as f:
                self.config.write(f)
            return True
        except Exception:
            return False
    
    def add_email(self, details: dict[str, str]) -> bool:
        """Add email configuration"""
        return self.update_email_details(details['email'], details['display_name'], details['password'], details['api_key'])

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