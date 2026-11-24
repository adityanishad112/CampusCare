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

def create_block_diagram():
    w, h = 1000, 520
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    # Title banner
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 1.1: END-TO-END IOT MEDTECH ARCHITECTURAL WORKFLOW", fill=WHITE)
    
    # Blocks
    blocks = [
        ("PATIENT INTERFACE", "Paralyzed Patient Finger\nGentle Pressure Input\n(0.1N - 20N Force)", 30, 80, 200, 160, LIGHT_BLUE, NAVY),
        ("SENSING MATRIX", "4x Force Sensing Resistors\nPiezoresistive Film\nDynamic Resistive Divider", 260, 80, 200, 160, LIGHT_BLUE, NAVY),
        ("ESP32 MICROCONTROLLER", "Tensilica Dual-Core 240MHz\n12-bit ADC Noise Filtering\nGesture Pattern Matching\nWiFi 802.11 b/g/n Core", 490, 80, 220, 160, LIGHT_GREEN, GREEN),
        ("LOCAL INTERACTION", "16x2 HD44780 LCD (I2C)\n5-Stage Status LED Array\nAudible Buzzer Feedback", 740, 80, 230, 160, LIGHT_AMBER, AMBER),
        ("CLOUD INFRASTRUCTURE", "Encrypted HTTPS Client\nTelegram Bot Cloud API\nReal-time Message Dispatch", 370, 310, 240, 150, LIGHT_BLUE, NAVY),
        ("CAREGIVER RECEPTION", "Telegram Mobile App\nAudible Alert & Log\nInstant Assistance Dispatch", 670, 310, 240, 150, LIGHT_RED, RED),
    ]
    
    for title, desc, x, y, bw, bh, bg, border in blocks:
        draw.rectangle([x, y, x + bw, y + bh], fill=bg, outline=border, width=2)
        draw.rectangle([x, y, x + bw, y + 32], fill=border)
        draw.text((x + 10, y + 8), title, fill=WHITE)
        draw.text((x + 10, y + 42), desc, fill=DARK)
        
    # Arrows
    def draw_arrow(x1, y1, x2, y2, color=NAVY):
        draw.line([x1, y1, x2, y2], fill=color, width=3)
        if x2 > x1:
            draw.polygon([(x2, y2), (x2 - 10, y2 - 6), (x2 - 10, y2 + 6)], fill=color)
        elif y2 > y1:
            draw.polygon([(x2, y2), (x2 - 6, y2 - 10), (x2 + 6, y2 - 10)], fill=color)
        elif x2 < x1:
            draw.polygon([(x2, y2), (x2 + 10, y2 - 6), (x2 + 10, y2 + 6)], fill=color)
            
    draw_arrow(230, 160, 260, 160)
    draw_arrow(460, 160, 490, 160)
    draw_arrow(710, 160, 740, 160)
    
    # Down arrow to cloud
    draw.line([600, 240, 600, 310], fill=NAVY, width=3)
    draw.polygon([(600, 310), (594, 300), (606, 300)], fill=NAVY)
    
    # Cloud to caregiver
    draw_arrow(610, 385, 670, 385, color=RED)
    
    img.save("report_figures/fig_arch_block.png")

def create_schematic_wiring():
    w, h = 1000, 560
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 4.2: ESP32 DEVKIT V1 DETAILED PINOUT & CIRCUIT SCHEMATIC", fill=WHITE)
    
    # Central ESP32 Box
    cx, cy, cw, ch = 380, 80, 240, 420
    draw.rectangle([cx, cy, cx + cw, cy + ch], fill=(241, 245, 249), outline=NAVY, width=3)
    draw.rectangle([cx, cy, cx + cw, cy + 40], fill=NAVY)
    draw.text((cx + 35, cy + 12), "ESP32 DevKit V1", fill=WHITE)
    
    # Left Pins (Inputs)
    left_pins = [
        ("3V3 / 5V (Power)", 140),
        ("GND (Ground)", 180),
        ("GPIO 34 (ADC1_CH6) <- FSR 1", 230),
        ("GPIO 35 (ADC1_CH7) <- FSR 2", 280),
        ("GPIO 32 (ADC1_CH4) <- FSR 3", 330),
        ("GPIO 33 (ADC1_CH5) <- FSR 4", 380),
        ("EN / Reset", 430),
    ]
    for label, py in left_pins:
        draw.rectangle([cx - 10, py - 8, cx, py + 8], fill=NAVY)
        draw.text((cx + 10, py - 7), label, fill=DARK)
        
    # Right Pins (Outputs)
    right_pins = [
        ("GPIO 21 (I2C SDA) -> LCD", 140),
        ("GPIO 22 (I2C SCL) -> LCD", 180),
        ("GPIO 13 -> LED 1 (Level 1)", 240),
        ("GPIO 12 -> LED 2 (Food)", 280),
        ("GPIO 14 -> LED 3 (Water)", 320),
        ("GPIO 27 -> LED 4 (Medicine)", 360),
        ("GPIO 26 -> LED 5 (Emergency)", 400),
        ("GPIO 25 -> Active Buzzer", 440),
    ]
    for label, py in right_pins:
        draw.rectangle([cx + cw, py - 8, cx + cw + 10, py + 8], fill=NAVY)
        draw.text((cx + cw - 200, py - 7), label, fill=DARK)
        
    # FSR block on left
    draw.rectangle([40, 210, 240, 410], fill=LIGHT_BLUE, outline=NAVY, width=2)
    draw.text((50, 220), "4x FSR Force Array\n+ 10k Pull-down\nVoltage Divider\nNetwork", fill=DARK)
    for py in [230, 280, 330, 380]:
        draw.line([240, py, cx - 10, py], fill=NAVY, width=2)
        
    # LCD block on top right
    draw.rectangle([750, 120, 960, 210], fill=LIGHT_AMBER, outline=AMBER, width=2)
    draw.text((760, 130), "16x2 HD44780 LCD\nPCF8574 I2C Expander\nAddr: 0x27 / 0x3F", fill=DARK)
    draw.line([cx + cw + 10, 140, 750, 140], fill=AMBER, width=2)
    draw.line([cx + cw + 10, 180, 750, 180], fill=AMBER, width=2)
    
    # LED block on bottom right
    draw.rectangle([750, 240, 960, 460], fill=LIGHT_GREEN, outline=GREEN, width=2)
    draw.text((760, 250), "Discrete LED Indicators\n+ 330 Ohm Resistors\nVisual Feedback Array", fill=DARK)
    for py in [240, 280, 320, 360, 400]:
        draw.line([cx + cw + 10, py, 750, py], fill=GREEN, width=2)
        
    img.save("report_figures/fig_schematic_wiring.png")

def create_fsm_flowchart():
    w, h = 800, 680
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 5.1: FIRMWARE LOGIC & FINITE STATE MACHINE (FSM)", fill=WHITE)
    
    nodes = [
        ("STATE 0: INITIALIZATION", "System Boot, GPIO Setup, LCD Init, Connect Wi-Fi", 250, 70, 300, 50, LIGHT_BLUE),
        ("STATE 1: SENSOR ACQUISITION", "Read 12-bit ADC (GPIO 34-35), Apply Kalman Filter", 250, 150, 300, 50, LIGHT_BLUE),
        ("STATE 2: FORCE LEVEL THRESHOLDING", "Map ADC (0-4095) into 5 discrete pressure bins", 250, 230, 300, 50, LIGHT_BLUE),
        ("DECISION: ACTIVE GESTURE DETECTED?", "Is Force > Noise Floor (>200 ADC)?", 250, 310, 300, 50, LIGHT_AMBER),
        ("STATE 3: PATTERN MATCHING", "Map Active Pattern to Preset Request\n(Food, Water, Medicine, Emergency)", 250, 390, 300, 55, LIGHT_GREEN),
        ("STATE 4: LOCAL FEEDBACK", "Update 16x2 LCD Display & Light Matching LED", 250, 475, 300, 50, LIGHT_GREEN),
        ("STATE 5: CLOUD TELEGRAM DISPATCH", "Construct HTTPS POST JSON, Fire Telegram Alert", 250, 555, 300, 50, LIGHT_RED),
        ("STATE 6: DEBOUNCE & COOLDOWN", "Hold Lockout Timer (3 sec) to avoid spam", 250, 625, 300, 45, LIGHT_BLUE),
    ]
    
    for title, desc, x, y, bw, bh, bg in nodes:
        draw.rectangle([x, y, x + bw, y + bh], fill=bg, outline=NAVY, width=2)
        draw.text((x + 10, y + 6), title, fill=NAVY)
        draw.text((x + 10, y + 24), desc, fill=DARK)
        
    for i in range(len(nodes) - 1):
        x = 400
        y1 = nodes[i][3] + nodes[i][5]
        y2 = nodes[i+1][3]
        draw.line([x, y1, x, y2], fill=NAVY, width=2)
        draw.polygon([(x, y2), (x - 4, y2 - 6), (x + 4, y2 - 6)], fill=NAVY)
        
    # No branch on decision
    draw.line([550, 335, 620, 335], fill=AMBER, width=2)
    draw.line([620, 335, 620, 175], fill=AMBER, width=2)
    draw.line([620, 175, 550, 175], fill=AMBER, width=2)
    draw.polygon([(550, 175), (556, 171), (556, 179)], fill=AMBER)
    draw.text((630, 250), "NO: Below Noise Floor", fill=AMBER)
    
    img.save("report_figures/fig_fsm_flowchart.png")

def create_calibration_curve():
    w, h = 800, 480
    img = Image.new("RGB", (w, h), WHITE)
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([0, 0, w, 50], fill=NAVY)
    draw.text((20, 14), "FIG 6.1: FSR TRANSDUCTION CURVE (FORCE VS ADC OUTPUT VOLTAGE)", fill=WHITE)
    
    # Axes
    ox, oy = 100, 400
    draw.line([ox, oy, ox + 620, oy], fill=DARK, width=2) # X axis
    draw.line([ox, oy, ox, 80], fill=DARK, width=2)      # Y axis
    
    draw.text((ox + 250, oy + 25), "Applied Force on Sensor (Newtons)", fill=DARK)
    draw.text((20, 200), "ADC Count\n(0-4095)", fill=DARK)
    
    # Draw curve
    points = [
        (ox, oy),
        (ox + 50, oy - 30),
        (ox + 100, oy - 120),
        (ox + 180, oy - 210),
        (ox + 300, oy - 270),
        (ox + 450, oy - 300),
        (ox + 600, oy - 315)
    ]
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=NAVY, width=3)
        
    # Draw thresholds
    thresholds = [
        (oy - 50, "Level 1: Resting / Advancing Health (< 200 ADC)", LIGHT_BLUE),
        (oy - 120, "Level 2: Food Request (200 - 400 ADC)", LIGHT_GREEN),
        (oy - 200, "Level 3: Water Request (400 - 600 ADC)", LIGHT_GREEN),
        (oy - 270, "Level 4: Medicine Request (600 - 800 ADC)", LIGHT_AMBER),
        (oy - 315, "Level 5: Emergency Alert (> 800 ADC)", LIGHT_RED),
    ]
    for y_val, lbl, color in thresholds:
        draw.line([ox, y_val, ox + 620, y_val], fill=GRAY, width=1)
        draw.text((ox + 20, y_val - 16), lbl, fill=DARK)
        
    img.save("report_figures/fig_calibration_curves.png")

create_block_diagram()
create_schematic_wiring()
create_fsm_flowchart()
create_calibration_curve()
print("All 4 core figure diagrams successfully generated!")
