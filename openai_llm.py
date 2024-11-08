import json
import openai
from config import Config
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
    lead_info = {
        "name": lead.get("name", ""),
        "role": lead.get("role", ""),
        "company": lead.get("company", ""),
        "title": lead.get("title", ""),
        "email": lead.get("email", ""),
    }

    recipient_name = lead_info["name"].split(" ")[0]
    prompt = """You are an expert in writing friendly, casual, and to-the-point cold emails. Your task is to generate a short, casual, personalized cold email based on the following information:

Recipient Information:
- Name: {recipient_name}
- Role: {lead_info['role']} 
- Company: {lead_info['company']}
- Title: {lead_info['title']}

Agency Information:
- Company Name: {agency_info[0]['company_name']}
- Company Description: {company_description}
- Founder Name: {agency_info[0]['founder_name']}
- Founder Title: {agency_info[0]['founder_title']} 
- Founder About: {agency_info[0]['founder_about']}
- Calendar Link: {agency_info[0]['calendar_link']}

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
            "content": f"Generate a cold email for {recipient_name} at {lead_info['company']}"
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
