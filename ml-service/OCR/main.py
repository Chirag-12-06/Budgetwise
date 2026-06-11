from .preprocess import image_cleaning
from .ocr import ocr
from .extractor import extract


def main(image):

    cleaned_image=image_cleaning(image)

    ocr_text=ocr(cleaned_image)

    result=extract(ocr_text)

    return result
