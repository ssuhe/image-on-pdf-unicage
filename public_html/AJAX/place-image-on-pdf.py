import sys
import re
import os
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
from reportlab.pdfgen import canvas
import shutil

def get_page_size(page) -> tuple[float, float]:
    """
    Get width and height of a PDF page in points.
    """
    box = page.mediabox
    width = float(box.right) - float(box.left)
    height = float(box.top) - float(box.bottom)
    return width, height


widgetNamePattern = r"^page-\d+$"
main_path=sys.argv[1]
pageCount=int(sys.argv[2])

pageCountDigit=len(sys.argv[2])

pdf_path=f"{main_path}/PDF"
widgets_path=f"{main_path}/WIDGETS/"

widget_added_pages=[]
folderList = os.listdir(widgets_path)
print("get widget list")

for widgetName in folderList:
    print("get target pages: ",widgetName)
    if re.match(widgetNamePattern, widgetName):
        pageNo=widgetName.split("-")[-1]
        widget_added_pages.append(pageNo)


for pageNo in range(1,pageCount+1):
    if str(pageNo) in widget_added_pages:
        print(f"reading pages pdf: {pageNo}")
        pagePdfPath=f"{main_path}/PDF.{pageNo}"
        reader = PdfReader(pagePdfPath)
        writer = PdfWriter()
        for page_number, page in enumerate(reader.pages, start=1):
            page_width, page_height = get_page_size(page)
            print(f"loop by page: pageNo={pageNo}; insidePage={page_number}; w={page_width}; h={page_height}")

            widgetCount = 0
            widgetContent = []
            with open(f"{main_path}/WIDGETS/page-{pageNo}/WIDGETS-POSITION", "r", encoding="utf-8") as file:
                for line in file:
                    widgetCount = widgetCount + 1
                    fields = line.strip().split(" ")
                    widgetContent.append(fields)

            print(f"Widget count: {widgetCount}")

            for widget in widgetContent:
                print(f"loop by widget: pageNo={pageNo}; insidePage={page_number}; {widget}")

                widgetId = widget[0]
                widgetX = float(widget[1])
                widgetY = float(widget[2])
                widgetW = float(widget[3])
                widgetH = float(widget[4])
                
                pngImagePath = f"{main_path}/WIDGETS/page-{pageNo}/{widgetId}.png"

                packet = BytesIO()
                can = canvas.Canvas(packet, pagesize=(page_width, page_height))
                can.drawImage(
                    pngImagePath,
                    x=widgetX,
                    y=page_height - widgetH - widgetY,
                    width=widgetW,
                    height=widgetH,
                    mask="auto",  # keep transparent background
                )
                can.save()

                packet.seek(0)
                overlay_pdf = PdfReader(packet)
                page.merge_page(overlay_pdf.pages[0])

        writer.add_page(page)
        with open(f"{sys.argv[3]}-{str(pageNo).zfill(pageCountDigit)}.pdf", "wb") as f:
            writer.write(f)
    else:
        shutil.copy(f"{main_path}/PDF.{pageNo}", f"{sys.argv[3]}-{str(pageNo).zfill(pageCountDigit)}.pdf")