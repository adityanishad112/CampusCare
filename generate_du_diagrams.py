import os
from PIL import Image, ImageDraw

os.makedirs("report_figures_du", exist_ok=True)

NAVY = (30, 58, 138)
LIGHT_BLUE = (219, 234, 254)
DARK = (15, 23, 42)
GRAY = (100, 116, 139)
BORDER = (148, 163, 184)
WHITE = (255, 255, 255)
GREEN = (22, 101, 52)
LIGHT_GREEN = (220, 252, 231)
AMBER = (180, 83, 9)
LIGHT_AMBER = (254, 243, 199)
RED = (185, 28, 28)
LIGHT_RED = (254, 226, 226)

def create_du_architecture():
    w, h = 1000, 560
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 3.1: DIGITAL UDHAR - THREE-TIER SYSTEM ARCHITECTURE", fill=WHITE)
    
    # 3 Layers
    # Client Tier
    draw.rectangle([40, 80, 300, 480], fill=LIGHT_BLUE, outline=NAVY, width=2)
    draw.rectangle([40, 80, 300, 120], fill=NAVY)
    draw.text((60, 92), "CLIENT TIER (React 18 / TS)", fill=WHITE)
    draw.text((55, 140), "• Customer Portal (Mobile/Web)\n• Merchant & Staff Console\n• Admin Audit Dashboard\n• QR Code Scanner Module\n• Tailwind CSS & Zustand Store\n• TanStack Query Server Cache\n• Axios REST Client", fill=DARK)

    # Application Tier
    draw.rectangle([360, 80, 640, 480], fill=LIGHT_GREEN, outline=GREEN, width=2)
    draw.rectangle([360, 80, 640, 120], fill=GREEN)
    draw.text((380, 92), "BACKEND API (Node / Express)", fill=WHITE)
    draw.text((375, 140), "• JWT / OTP Auth Middleware\n• RBAC & Ownership Guards\n• Input Validation (Zod)\n• Credit Lifecycle Service\n• Ledger Posting Engine (Paise)\n• HMAC-SHA256 Webhook Verifier\n• AES-256-GCM Data Cipher\n• Event Replay Detection", fill=DARK)

    # Data & Gateway Tier
    draw.rectangle([700, 80, 960, 480], fill=LIGHT_AMBER, outline=AMBER, width=2)
    draw.rectangle([700, 80, 960, 120], fill=AMBER)
    draw.text((715, 92), "DATA & SERVICES TIER", fill=WHITE)
    draw.text((715, 140), "• PGlite / PostgreSQL DB\n• Drizzle ORM Type-Safe\n• Immutable Ledger Journal\n• Audit Event Log Store\n• Payment Gateway Adapter\n  (Mock / Razorpay / UPI)\n• Webhook Dispatcher\n• Signature Event Store", fill=DARK)

    # Arrows
    def draw_arr(x1, y1, x2, y2, col=NAVY):
        draw.line([x1, y1, x2, y2], fill=col, width=3)
        if x2 > x1:
            draw.polygon([(x2, y2), (x2 - 10, y2 - 6), (x2 - 10, y2 + 6)], fill=col)
        elif x2 < x1:
            draw.polygon([(x2, y2), (x2 + 10, y2 - 6), (x2 + 10, y2 + 6)], fill=col)

    draw_arr(300, 240, 360, 240, NAVY)
    draw_arr(360, 300, 300, 300, NAVY)
    draw_arr(640, 240, 700, 240, GREEN)
    draw_arr(700, 300, 640, 300, GREEN)

    img.save("report_figures_du/fig_du_arch.png")

def create_du_credit_flow():
    w, h = 900, 520
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 3.2: CREDIT REQUEST & MERCHANT APPROVAL WORKFLOW", fill=WHITE)
    
    boxes = [
        ("1. Scan Merchant QR", "Customer scans store QR code;\nresolves merchant identifier", 50, 90, 220, 70, LIGHT_BLUE),
        ("2. Enter Credit Amount", "Input amount (converted to paise)\nand optional item notes", 340, 90, 220, 70, LIGHT_BLUE),
        ("3. Validation & Rules", "Backend checks customer credit\nlimits and account state", 630, 90, 220, 70, LIGHT_BLUE),
        ("4. Save REQUESTED", "Obligation stored in database\nwith status = REQUESTED", 630, 230, 220, 70, LIGHT_AMBER),
        ("DECISION: Merchant?", "Merchant reviews request\nand decides to approve/reject", 340, 230, 220, 70, LIGHT_AMBER),
        ("REJECTED: No Entry", "Status set to REJECTED;\nZero changes to ledger", 50, 230, 220, 70, LIGHT_RED),
        ("5. Post Ledger Entry", "Create +ve credit transaction;\nUpdate balance B(a) atomically", 340, 370, 220, 70, LIGHT_GREEN),
        ("6. Obligation ACTIVE", "Set obligation state = ACTIVE;\nNotify customer and merchant", 630, 370, 220, 70, LIGHT_GREEN)
    ]
    
    for title, desc, x, y, bw, bh, bg in boxes:
        draw.rectangle([x, y, x + bw, y + bh], fill=bg, outline=NAVY, width=2)
        draw.text((x + 10, y + 8), title, fill=NAVY)
        draw.text((x + 10, y + 28), desc, fill=DARK)

    def draw_a(x1, y1, x2, y2, col=NAVY):
        draw.line([x1, y1, x2, y2], fill=col, width=2)
        if x2 > x1:
            draw.polygon([(x2, y2), (x2 - 8, y2 - 5), (x2 - 8, y2 + 5)], fill=col)
        elif y2 > y1:
            draw.polygon([(x2, y2), (x2 - 5, y2 - 8), (x2 + 5, y2 - 8)], fill=col)
        elif x2 < x1:
            draw.polygon([(x2, y2), (x2 + 8, y2 - 5), (x2 + 8, y2 + 5)], fill=col)

    draw_a(270, 125, 340, 125)
    draw_a(560, 125, 630, 125)
    draw_a(740, 160, 740, 230)
    draw_a(630, 265, 560, 265)
    draw_a(340, 265, 270, 265, RED) # Rejection
    draw_a(450, 300, 450, 370, GREEN) # Approved
    draw_a(560, 405, 630, 405, GREEN)

    img.save("report_figures_du/fig_du_credit_flow.png")

def create_du_repayment():
    w, h = 900, 500
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 3.3: REPAYMENT & HMAC-SHA256 WEBHOOK VERIFICATION", fill=WHITE)
    
    steps = [
        ("Step 1: Initiate Payment", "Customer selects obligation and\nsubmits repayment amount", 50, 90, 240, 65, LIGHT_BLUE),
        ("Step 2: Create Gateway Order", "Backend generates order ID\nvia Payment Provider API", 330, 90, 240, 65, LIGHT_BLUE),
        ("Step 3: Customer Payment", "Payment executed via UPI / Card;\nProvider issues signed webhook", 610, 90, 240, 65, LIGHT_BLUE),
        ("Step 4: Signature Verification", "Backend computes HMAC-SHA256;\nValidates against x-signature header", 610, 230, 240, 65, LIGHT_AMBER),
        ("Step 5: Idempotency Check", "Verify payment_event_id has not\nbeen previously recorded", 330, 230, 240, 65, LIGHT_AMBER),
        ("Step 6: Atomic Ledger Posting", "Post -ve credit entry; reduce balance\nB(a) atomically in single DB tx", 50, 230, 240, 65, LIGHT_GREEN),
        ("Step 7: Clear Obligation", "If balance == 0, state = CLEARED;\nOtherwise state remains ACTIVE", 50, 370, 240, 65, LIGHT_GREEN),
        ("Step 8: Digital Receipt", "Generate cryptographically verifiable\nreceipt with audit log trace", 330, 370, 240, 65, LIGHT_GREEN)
    ]
    
    for title, desc, x, y, bw, bh, bg in steps:
        draw.rectangle([x, y, x + bw, y + bh], fill=bg, outline=NAVY, width=2)
        draw.text((x + 10, y + 8), title, fill=NAVY)
        draw.text((x + 10, y + 26), desc, fill=DARK)

    def draw_l(x1, y1, x2, y2, col=NAVY):
        draw.line([x1, y1, x2, y2], fill=col, width=2)
        if x2 > x1:
            draw.polygon([(x2, y2), (x2 - 8, y2 - 5), (x2 - 8, y2 + 5)], fill=col)
        elif y2 > y1:
            draw.polygon([(x2, y2), (x2 - 5, y2 - 8), (x2 + 5, y2 - 8)], fill=col)
        elif x2 < x1:
            draw.polygon([(x2, y2), (x2 + 8, y2 - 5), (x2 + 8, y2 + 5)], fill=col)

    draw_l(290, 122, 330, 122)
    draw_l(570, 122, 610, 122)
    draw_l(730, 155, 730, 230)
    draw_l(610, 262, 570, 262)
    draw_l(330, 262, 290, 262)
    draw_l(170, 295, 170, 370)
    draw_l(290, 402, 330, 402)

    img.save("report_figures_du/fig_du_repayment.png")

create_du_architecture()
create_du_credit_flow()
create_du_repayment()
print("Digital Udhar diagram figures successfully generated!")
