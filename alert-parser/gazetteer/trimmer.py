'''
trimmer.py

Simply reads the raw data file and trims it to only hold the data we want,
then outputs that into a new file

TODO: allow command line input to override defaults (e.g. filenames)
'''

# Imports
import csv

# Constants
INPUT_FILENAME: str  = "NYS_Streets_2993811876885790115.csv"
OUTPUT_FILENAME: str = "streets.csv"

with open(INPUT_FILENAME, mode='r', newline='', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        # Each row is a list of strings
        print(row["CompleteStreetName"])