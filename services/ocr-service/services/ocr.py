import re
import pytesseract


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def clean_ocr_text(text):

    # Z499, %499, $499 → INR 499
    text = re.sub(
        r'(?<!\w)[Z%$£€](?=\d)',
        'INR ',
        text
    )

    # 2499 → INR 499 (only for 4+ digit amounts)
    text = re.sub(
        r'(?<!\d)2(\d{3,})(?!\d)',
        r'INR \1',
        text
    )

    return text


def extract_text(img):
    """
    OCR a single image and return text.
    """

    config = (
        '--oem 3 '
        '--psm 4 '
        '-c tessedit_char_whitelist='
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        'abcdefghijklmnopqrstuvwxyz'
        '0123456789'
        '.,:/%-#()% '
    )
    text = pytesseract.image_to_string(
        img,
        config=config
    )

    text = clean_ocr_text(text)
    
    text = re.sub(r'[-_=]{3,}', '', text)

    text = re.sub(r'\n\s*\n+', '\n\n', text)

    return text


def ocr(img):
    """
    OCR a single image and save extracted text.
    """
    result = extract_text(img)

    return result

