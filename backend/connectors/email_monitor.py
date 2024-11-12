import email
import imaplib
from bs4 import BeautifulSoup
from connectors.gsheet import update_sheet_row
from openai_llm import extract_email_conversation
from constants import SenderType, SheetColumns, EmailStatus


class EmailMonitor:
    def __init__(self, email_config):
        """Initialize monitor for a single email account

        Args:
            email_config (dict): Configuration containing email, password, imap_server, imap_port
        """
        self.config = {
            "email": email_config["email"],
            "password": email_config["password"],
            "imap_server": "mail.privateemail.com",
            "imap_port": 993
        }

    def check_replies(self, lead_emails):
        """Check replies for this specific email account"""
        print(f"Checking inbox for {self.config['email']}")
        return self._check_single_inbox(lead_emails)

    def _check_single_inbox(self, lead_emails):
        mail = imaplib.IMAP4_SSL(
            self.config['imap_server'], self.config['imap_port'])
        conversations = {}
        processed_threads = set()
        try:
            mail.login(self.config['email'], self.config['password'])
            mail.select('INBOX')
            for lead in lead_emails:
                email_id = lead[SheetColumns.EMAIL.value]
                subject = lead[SheetColumns.COLD_EMAIL_SUBJECT.value]
                search_criteria = f'(SUBJECT "{subject}")'
                print(search_criteria)
                _, messages = mail.search(None, search_criteria)
                message_nums = messages[0].split()
                message_nums.reverse()  # Newest first
                conversations[email_id] = {}
                for num in message_nums:
                    _, msg_data = mail.fetch(num, '(RFC822)')
                    email_message = email.message_from_bytes(msg_data[0][1])
                    participants = self._get_thread_participants(email_message)
                    thread_id = email_message.get(
                    'Message-ID', '') or email_message.get('Thread-Index', '')
                    if thread_id not in processed_threads:
                        processed_threads.add(thread_id)
                        thread_messages = self._get_thread_messages(
                            mail, email_message)
                        latest_message = thread_messages[-1]
                        conv = extract_email_conversation(latest_message)
                        print("CONVERSATION", conv)
                        conversations[email_id] = {**conversations[email_id], **conv}
                        print("ALL CONVERSATIONS", conversations)
        finally:
            mail.close()
            mail.logout()
            for lead_email in conversations:
                if not conversations[lead_email]:
                    continue
                # self._update_lead_in_sheet(lead_email, conversations[lead_email])

    def _get_thread_participants(self, email_message):
        """Extract all email addresses from message headers"""
        participants = set()

        # Check From, To, and Cc fields
        for header in ['From', 'To', 'Cc']:
            addresses = email_message.get(header, '')
            if addresses:
                # Simple email extraction - could be made more robust
                emails = [self._parse_email_address(
                    addr) for addr in addresses.split(',')]
                participants.update(emails)

        return participants

    def _get_thread_messages(self, mail, reference_message):
        """Get all messages in the same thread"""
        thread_messages = []
        references = reference_message.get(
            'References', '') or reference_message.get('In-Reply-To', '')
        message_id = reference_message.get('Message-ID', '')

        # Search for messages in the same thread
        search_criteria = f'(OR HEADER References "{references}" HEADER Message-ID "{message_id}")'
        _, messages = mail.search(None, search_criteria)

        for num in messages[0].split():
            _, msg_data = mail.fetch(num, '(RFC822)')
            thread_messages.append(email.message_from_bytes(msg_data[0][1]))

        # Sort by date
        thread_messages.sort(
            key=lambda m: email.utils.parsedate_to_datetime(m['Date']))
        return thread_messages

    def _parse_email_address(self, from_header):
        """Extract email from "Name <email@domain.com>" format"""
        if '<' in from_header:
            return from_header.split('<')[1].split('>')[0]
        return from_header

    # def _decode_header(self, header):
    #     if header is None:
    #         return ""
    #     decoded_header, encoding = decode_header(header)[0]
    #     if isinstance(decoded_header, bytes):
    #         return decoded_header.decode(encoding or 'utf-8')
    #     return decoded_header

    # def _get_email_body(self, email_message):
    #     if email_message.is_multipart():
    #         for part in email_message.walk():
    #             if part.get_content_type() == "text/plain":
    #                 return part.get_payload(decode=True).decode()
    #     else:
    #         return email_message.get_payload(decode=True).decode()
    #     return ""

    # def _convert_html_to_text(self, html_content: str) -> str:
    #     """Convert HTML content to plain text while preserving structure"""
    #     try:
    #         # First try to parse with BeautifulSoup to clean the HTML
    #         soup = BeautifulSoup(html_content, 'html.parser')

    #         # Initialize html2text
    #         h = html2text.HTML2Text()
    #         h.ignore_links = False
    #         h.body_width = 0  # Don't wrap text
    #         h.protect_links = True  # Keep the full URLs

    #         # Convert to markdown-style text
    #         text = h.handle(str(soup))

    #         # Clean up extra whitespace while preserving structure
    #         lines = [line.strip() for line in text.splitlines()]
    #         text = '\n'.join(line for line in lines if line)

    #         return text
    #     except Exception as e:
    #         return html_content  # Return original content if conversion fails

    def _update_lead_in_sheet(self, lead_email: str, conversation: dict):
        """Update the sheet with reply information"""
        # print("CONVERSATIONNNN", conversation.items())
        update_data = {
            # SheetColumns.THREAD_ID.value: thread_id,
            SheetColumns.EMAIL_STATUS.value: EmailStatus.REPLIED.value,
            SheetColumns.LAST_SENDER.value: SenderType.CLIENT.value,
            SheetColumns.LAST_MESSAGE.value: conversation[0]["message"],
            SheetColumns.CONVERSATION_HISTORY.value: f"{conversation}"
        }

        update_sheet_row(lead_email, update_data)

    def extract_text_from_email_body(self, email_body: str) -> str:
        """Extract text from email body using beautifulsoup"""
        soup = BeautifulSoup(email_body, "html.parser")
        return soup.get_text()


    # def _update_conversation_history(self, lead_email: str, new_message: str) -> str:
    #     """Append new message to conversation history"""
    #     timestamp = datetime.now().timestamp()

    #     # Get existing history
    #     lead = get_lead_by_email(lead_email)
    #     conversation = lead.get(SheetColumns.CONVERSATION_HISTORY.value)
    #     print(f"Lead is {lead_email}")
    #     print(f"Conversation: {conversation}")
    #     print(type(conversation))
    #     if not conversation:
    #         conversation = {}
    #     else:
    #         conversation = json.loads(clean_json_string(conversation))
    #     # Add new message
    #     conversation[timestamp] = new_message
    #     return json.dumps(conversation)