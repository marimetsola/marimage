import os
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


STORAGE_DIR = Path(os.environ["STORAGE_DIR"])
THUMBNAIL_DIR = Path(os.environ["THUMBNAIL_DIR"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES = {
    "image/jpeg": {
        "extension": ".jpg",
        "format": "JPEG",
    },
    "image/png": {
        "extension": ".png",
        "format": "PNG",
    },
    "image/webp": {
        "extension": ".webp",
        "format": "WEBP",
    },
}


def sanitize_and_save_image(source, destination, image_format: str) -> int:
    try:
        with Image.open(source) as image:
            if image.format != image_format:
                raise ValueError(
                    f"File content does not match declared type: "
                    f"expected {image_format}, got {image.format}"
                )

            image = ImageOps.exif_transpose(image)
            image.load()

            save_options = {}

            if image_format == "JPEG":
                if image.mode not in ("RGB", "L"):
                    image = image.convert("RGB")

                save_options["quality"] = 100
                save_options["optimize"] = True

            image.save(
                destination,
                format=image_format,
                **save_options,
            )

    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image") from exc

    return destination.stat().st_size


def create_thumbnail(source, destination) -> None:
    with Image.open(source) as image:
        image.thumbnail(
            (320, 320),
            Image.Resampling.LANCZOS,
        )

        if image.mode == "P":
            image = image.convert("RGBA")

        image.save(
            destination,
            format="WEBP",
            quality=85,
            method=6,
        )
