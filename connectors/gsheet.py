import json
import gspread
from config import Config
from oauth2client.service_account import ServiceAccountCredentials

def connect_to_gsheet() -> gspread.Client:
    scopes = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    cloud_creds = json.load(open("service_account.json"))
    creds = ServiceAccountCredentials.from_json_keyfile_dict(cloud_creds, scopes)

    client = gspread.authorize(creds)
    return client

def get_sheet(sheet_ID: str) -> gspread.Spreadsheet:
    client = connect_to_gsheet()
    return client.open_by_key(sheet_ID)

def get_leads_data() -> list[dict]:
    sheet = get_sheet(Config.SPREADSHEET_ID).worksheet("Leads")

    data = sheet.get_all_records()
    return data if data else []

def get_agency_data() -> dict[str, str]:
    sheet = get_sheet(Config.SPREADSHEET_ID).worksheet("Agency Info")
    data = sheet.get_all_records()
    return data

def update_leads_sheet(row_index: int, data: dict):
    sheet = get_sheet(Config.SPREADSHEET_ID).worksheet("Leads")

    header_row = sheet.row_values(1)
    updates_with_indices = {}
    
    for col_name, value in data.items():
        col_index = header_row.index(col_name) + 1
        updates_with_indices[col_index] = value
    
    for col_index, value in updates_with_indices.items():
        sheet.update_cell(row_index, col_index, value)
