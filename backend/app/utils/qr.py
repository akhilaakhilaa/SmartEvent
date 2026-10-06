import os
import uuid

import qrcode


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

QR_FOLDER = os.path.join(
    BASE_DIR,
    "app",
    "static",
    "qr"
)


def generate_ticket_qr(ticket_code: str) -> str:
    os.makedirs(QR_FOLDER, exist_ok=True)

    file_name = f"{uuid.uuid4()}.png"
    file_path = os.path.join(QR_FOLDER, file_name)

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(ticket_code)
    qr.make(fit=True)

    qr_image = qr.make_image()
    qr_image.save(file_path)

    return f"/static/qr/{file_name}"