import json
import openai
from config import Config
from constants import SheetColumns
from utils.scraper import get_company_description

openai.api_key = Config.OPENAI_API_KEY

def make_openai_client() -> openai.OpenAI:
    return openai.OpenAI(api_key=Config.OPENAI_API_KEY)

def make_completion_request(messages: list[dict], model: str="gpt-3.5-turbo", temperature: float=0.3, max_tokens: int=None) -> openai.Completion:
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens

    client = make_openai_client()
    return client.chat.completions.create(**kwargs).choices[0].message.content.strip()


def generate_1st_cold_email_content(lead: dict, agency_info: dict, company_description: str) -> str:
    recipient_name = lead.get(SheetColumns.NAME.value, "").split(" ")[0]
    company = lead.get(SheetColumns.COMPANY_NAME.value, "")
    prompt = """You are an expert in writing friendly, casual, and to-the-point cold emails. Your task is to generate a short, casual, personalized cold email using ONLY the following variables - DO NOT CREATE OR INSERT ANY OTHER VARIABLES OR PLACEHOLDERS:

Available Variables (use exactly as shown):
{recipient_name}
{role}
{company}
{agency_name}
{agency_info}
{sender_name}
{sender_position}
{agency_website}

Requirements:
1. Subject line must contain {company} and {role}
2. Email signature must include:
   - {sender_name}
   - {sender_position}
   - {agency_name}
   - {agency_website}

IMPORTANT: 
- Do NOT invent, create, or use any placeholders not listed above
- Use variables exactly as shown - do NOT modify their format
- Do NOT add dynamic content like dates, times, or custom fields

Writing style: conversational, casual, engaging, simple to read, simple linear active voice sentences, informational and insightful.

Use the following formulas to write effective cold emails:

1. AIDA: Start with attention-grabbing subject/opening. Build interest with pain points. Create desire with benefits/social proof. End with specific CTA.
2. BBB: Brief, blunt, basic. Short, direct, simple language.
3. PAS: Problem, Agitate, Solve
4. QVC: Question, Value prop, Call-to-action
5. PPP: Praise, Picture benefits, Push to action
6. SCH: Star (intro), Chain (facts), Hook (CTA)
7. SSS: Star, Story, Solution
8. RDM: Fact-packed, Telegraphic, Specific, Few adjectives, Arouse curiosity

Respond with JSON containing subject and email content only:
{
  "subject": "<subject line>",
  "email": "<email content>"
}"""

    messages = [
        {
            "role": "system",
            "content": prompt
        },
        {
            "role": "user", 
            "content": f"Generate a cold email for {recipient_name} at {company}"
        }
    ]
    
    return json.loads(make_completion_request(messages))

def generate_company_description(company_domain: str) -> str:
    description = get_company_description(company_domain)
    
    prompt = (
            f"Here is some text extracted from the homepage of {company_domain}:\n\n"
            f"{description}\n\n"
            "Provide a brief and professional summary of what this company does."
    )

    response = make_completion_request(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.5
        )
    return response


def generate_standard_response(lead_info, previous_conversation):
    prompt = (
        f"Generate a response email based on the following conversation and lead info:\n\n{previous_conversation}\n\n and Lead INFO: {lead_info}"
        "The response should be polite, engaging, and should focus on building rapport. Do not reference agency info or services."
    )

    response = make_completion_request(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.7
    )

    return response


def extract_email_conversation(email_body: str) -> str:
    prompt = (
        f"Extract the email conversation and format it as a JSON dictionary of dictionaries where:\n"
        "The outer dictionary has keys as the timestamp of the message and values as dictionary with the following keys:\n"
        "- sender: the sender's email address\n"
        "- message: the actual message\n\n"
        "For the key timestamp in outer dictionary, usethe timestamp of the message in ISO format (YYYY-MM-DD HH:MM:SS) with the time zone\n"
        "Remove any duplicate messages\n"
        "Maintain chronological order\n"
        "Maintain new line characters in the message\n"
        "Include the actual conversation content and all replies\n\n"
        f"Email body:\n{email_body}\n\n"
        "Return ONLY a valid JSON dictionary of dictionaries with the conversation.\n"
        "Remember, keys and values must be enclosed in double quotes."
    )
    return dict(json.loads(make_completion_request(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
    )))
