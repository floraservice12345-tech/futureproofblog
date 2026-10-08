"""Add real link annotations to the shareable portrait poster."""

from pathlib import Path

from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
IMAGE = ROOT / "media" / "futureproof-services-share-portrait.png"
OUTPUT = ROOT / "output" / "pdf" / "futureproof-services-clickable-poster.pdf"

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
scale = 0.5
page_width, page_height = 1080 * scale, 1350 * scale

pdf = canvas.Canvas(str(OUTPUT), pagesize=(page_width, page_height), pageCompression=1)
pdf.setTitle("FutureProof Blog services - clickable poster")
pdf.setAuthor("FutureProof Blog")
pdf.setSubject("Online services, contact and BharatBiz Content Studio")
pdf.drawImage(str(IMAGE), 0, 0, width=page_width, height=page_height)


def link_box(x1, y1, x2, y2, url):
    # Coordinates are in portrait-image pixels, measured from the upper left.
    pdf.linkURL(
        url,
        (x1 * scale, (1350 - y2) * scale, x2 * scale, (1350 - y1) * scale),
        relative=0,
        thickness=0,
    )


link_box(64, 62, 390, 124, "https://futureproofblog.in/")
link_box(62, 526, 528, 684, "https://futureproofblog.in/resume")
link_box(550, 526, 1016, 684, "https://futureproofblog.in/hire-me#order")
link_box(62, 704, 528, 862, "https://futureproofblog.in/hire-me#order")
link_box(550, 704, 1016, 862, "https://futureproofblog.in/hire-me#order")
link_box(93, 987, 780, 1037, "https://futureproofblog.in/content-studio")
link_box(90, 1137, 810, 1195, "https://futureproofblog.in/start")
link_box(90, 1192, 810, 1246, "mailto:contact@futureproofblog.in")
link_box(90, 1246, 710, 1292, "tel:+919540528064")
link_box(62, 1298, 1012, 1341, "https://www.google.com/maps/search/?api=1&query=35%2C%20B%20Block%2C%20Pramod%20Mahajan%20Marg%2C%20Saket%2C%20New%20Delhi%20110017")

pdf.showPage()
pdf.save()
print(OUTPUT)
