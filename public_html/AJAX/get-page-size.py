import sys
from PyPDF2 import PdfReader

reader = PdfReader(sys.argv[1])
for page_number, page in enumerate(reader.pages, start=1):
    box = page.mediabox
    width = float(box.right) - float(box.left)
    height = float(box.top) - float(box.bottom)
    print(f"{width} {height}")
