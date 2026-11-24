import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("report_figures", exist_ok=True)

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

def create_telegram_flow():
    w, h = 900, 500
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 5.2: TELEGRAM BOT CLOUD ALERTING & SMARTPHONE PUSH TOPOLOGY", fill=WHITE)
    
    # 4 entities
    entities = [
        ("ESP32 IoMT Node", 50, 80, 160, 360, LIGHT_BLUE, NAVY),
        ("Wi-Fi AP / Router", 270, 80, 160, 360, LIGHT_GREEN, GREEN),
        ("Telegram Cloud Server", 490, 80, 170, 360, LIGHT_AMBER, AMBER),
        ("Caregiver Mobile App", 710, 80, 160, 360, LIGHT_RED, RED)
    ]
    
    for title, x, y, bw, bh, bg, border in entities:
        draw.rectangle([x, y, x + bw, y + bh], fill=(248, 250, 252), outline=border, width=2)
        draw.rectangle([x, y, x + bw, y + 36], fill=border)
        draw.text((x + 10, y + 10), title, fill=WHITE)
        
    # Sequence Messages
    seqs = [
        ("1. Validated FSR Press Detected", 50, 140, "ESP32 FSM asserts active request"),
        ("2. WPA2 802.11 b/g/n Frame", 130, 190, 350, 190, NAVY),
        ("3. TLS 1.2 Handshake (Port 443)", 350, 240, 575, 240, GREEN),
        ("4. HTTPS POST JSON /sendMessage", 350, 290, 575, 290, GREEN),
        ("5. HTTP 200 OK {'ok': true}", 575, 340, 350, 340, AMBER),
        ("6. APNs / FCM Push Notification", 575, 380, 790, 380, RED),
        ("7. Instant Audible Chime & Banner", 710, 420, "Caregiver receives 'I need Water!'")
    ]
    
    def draw_msg_arrow(x1, y1, x2, y2, label, col):
        draw.line([x1, y1, x2, y2], fill=col, width=2)
        if x2 > x1:
            draw.polygon([(x2, y2), (x2 - 8, y2 - 5), (x2 - 8, y2 + 5)], fill=col)
        else:
            draw.polygon([(x2, y2), (x2 + 8, y2 - 5), (x2 + 8, y2 + 5)], fill=col)
        draw.text(((x1 + x2)//2 - 80, y1 - 16), label, fill=col)

    draw_msg_arrow(130, 190, 350, 190, "2. 802.11 Packet", NAVY)
    draw_msg_arrow(350, 250, 575, 250, "3. TLS 1.2 Handshake", GREEN)
    draw_msg_arrow(350, 300, 575, 300, "4. POST /sendMessage", GREEN)
    draw_msg_arrow(575, 350, 350, 350, "5. 200 OK ACK", AMBER)
    draw_msg_arrow(575, 400, 790, 400, "6. FCM Cloud Push", RED)

    img.save("report_figures/fig_telegram_flow.png")

def create_lcd_states():
    w, h = 900, 520
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 7.3: 16x2 LCD DISPLAY OPERATIONAL SCREENSHOT EMULATION", fill=WHITE)
    
    screens = [
        ("STATE 0: SYSTEM READY (BASELINE)", "  IoT MedTech   ", "Advancing Health", 50, 80, GREEN),
        ("STATE 1: FOOD REQUEST (LEVEL 2)", "  IoT MedTech   ", "      Food      ", 480, 80, AMBER),
        ("STATE 2: WATER REQUEST (LEVEL 3)", "  IoT MedTech   ", "     Water      ", 50, 290, NAVY),
        ("STATE 3: MEDICINE REQUEST (L4)", "  IoT MedTech   ", "    Medicine    ", 480, 290, RED)
    ]
    
    for title, line1, line2, x, y, col in screens:
        draw.text((x, y), title, fill=DARK)
        # LCD Bezel
        draw.rectangle([x, y + 24, x + 370, y + 170], fill=(22, 101, 52), outline=DARK, width=3)
        # LCD Screen Backlight (Yellow-Green HD44780)
        draw.rectangle([x + 20, y + 44, x + 350, y + 150], fill=(163, 230, 53), outline=(20, 83, 45), width=2)
        # Text
        draw.text((x + 70, y + 65), line1, fill=(20, 83, 45))
        draw.text((x + 70, y + 105), line2, fill=(20, 83, 45))
        
    img.save("report_figures/fig_lcd_states.png")

create_telegram_flow()
create_lcd_states()
print("Telegram sequence and LCD emulation figures created successfully!")
