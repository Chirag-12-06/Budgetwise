import cv2

def resize_receipt(img):
    return cv2.resize(
        img,
        None,
        fx=2,
        fy=2,
        interpolation=cv2.INTER_CUBIC
    )

def enhance_receipt(img):

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Remove lighting variations
    blur = cv2.GaussianBlur(gray, (51, 51), 0)

    normalized = cv2.divide(
        gray,
        blur,
        scale=255
    )

    return normalized


def image_cleaning(img):

    # Step 1
    resized = resize_receipt(img)

    # Step 2
    enhanced = enhance_receipt(resized)

    # Step 3
    thresh = cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        15
    )

    return thresh


