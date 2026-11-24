import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Inches, Pt, RGBColor

doc = docx.Document()
table = doc.add_table(rows=2, cols=2)
hdr_cell = table.cell(0, 0)
hdr_cell.text = "Header 1"

shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1E3A8A"/>')
hdr_cell._tc.get_or_add_tcPr().append(shading_elm)

doc.save("test_table.docx")
print("Table test passed successfully!")
