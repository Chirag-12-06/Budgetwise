from preprocess import image_cleaning
from ocr import ocr
from extractor import extract
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent

# INPUTS
INPUT_FOLDER = PROJECT_ROOT / "inputs"
RAW_FOLDER = INPUT_FOLDER / "raw"
CLEANED_FOLDER = INPUT_FOLDER / "cleaned"
DEBUG_FOLDER = INPUT_FOLDER / "debug"
OCR_TEXT_FILE = INPUT_FOLDER / "bills_cleaned.txt"

# OUTPUTS
OUTPUT_FOLDER = PROJECT_ROOT / "outputs"
JSON_FILE = OUTPUT_FOLDER / "expenses_table.json"

def main():

    image_cleaning(PROJECT_ROOT, RAW_FOLDER, CLEANED_FOLDER)

    ocr(CLEANED_FOLDER, OCR_TEXT_FILE)

    extract(OCR_TEXT_FILE, OUTPUT_FOLDER, JSON_FILE)

if __name__ == "__main__":
    main()