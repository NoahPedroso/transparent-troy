'''
parser_poc.py

A proof of concept script to show parsing these emails is feasible.
Perhaps it will showcase different methods
The final script will be cleaner and deal with a different data source probably
'''

# Imports
from sys    import exit   # Error handling
import re                 # regex parsing
from pprint import pprint # DEBUGGING: Just to make dicts look nice

# Constants
DELIMITER: str = "-------------------------"
TOTAL_NUM_EMAILS: int = 52

def parse_email(email: str) -> dict:
    parsed_email: dict[str, str] = {}
    flags: re.RegexFlag = re.MULTILINE | re.DOTALL | re.IGNORECASE

    parsed_email["subject"]   = re.search(r"^Subject: (.*?)\n", email, flags = flags)
    parsed_email["date"]      = re.search(r"^Alert Sent On: (\d{2}/\d{2}/\d{4}) \d{2}:\d{2}:\d{2} [A|P]M E[S|D]T\n", email, flags = flags)
    parsed_email["time"]      = re.search(r"^Alert Sent On: \d{2}/\d{2}/\d{4} (\d{2}:\d{2}:\d{2} [A|P]M E[S|D]T)\n", email, flags = flags)
    parsed_email["full_text"] = re.search(r"^Alert Sent On: \d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2} [A|P]M E[S|D]T\n\n(.*?)\n\nThis message was sent by Troy, NY\n", email, flags = flags)

    # These are the shaky ones
    parsed_email["closed_st"] = re.search(
        r"(\b[a-z0-9]+\s+(?:ave|avenue|street|st|blvd|boulevard|way|rd|road)) (?:closed|between)",
        email, flags = re.MULTILINE | re.IGNORECASE)
    parsed_email["from_st"]   = re.search(r"^Subject: (.*?)\n", email, flags = flags)
    parsed_email["to_st"]     = re.search(r"^Subject: (.*?)\n", email, flags = flags)
    parsed_email["reason"]    = re.search(r"^Subject: (.*?)\n", email, flags = flags)


    return parsed_email

# Read the entire file into a string. It is small enough (~1K lines).
with open("./alerts/alerts.txt", "r") as file:
    # Ignore empty newlines at the end of the file, split each email into new entry
    emails: list = list(filter(None, file.read().rstrip().split(DELIMITER)))
    num_emails: int = len(emails)
    split_success: bool = num_emails == TOTAL_NUM_EMAILS
    print("Properly split emails:", split_success)
    print("Expected:", TOTAL_NUM_EMAILS, "Got:", num_emails)

    if not split_success:
        exit("ERROR: FAILED TO SPLIT EMAILS, EXITING")


    bad_emails = []
    good_emails = []
    for email in emails:
        parsed_email: dict = parse_email(email)

        is_well_formed: bool = None not in parsed_email.values()
        if is_well_formed:
            good_emails.append(email)
            # Interested in the actual string matches.
            # Doing it here instead of on each call to catch None easily (no optional chaining in Python)
            pprint({k: v.group(1) for k, v in parsed_email.items()})
        else:
            bad_emails.append(email)

    print(f"Failed to match {len(bad_emails)} emails")


    # Write classified email examples to files for inspection
    with open('./alerts/good.txt', 'w') as file:
        for item in good_emails:
            file.write(f'{item}\n--------------------\n')

    with open('./alerts/bad.txt', 'w') as file:
        for item in bad_emails:
            file.write(f'{item}\n--------------------\n')