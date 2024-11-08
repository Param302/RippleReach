def format_keys(data: list[dict]) -> list[dict]:
    return [{k.lower().replace(' ', '_'): v for k, v in lead.items()} for lead in data]

