import os
import pandas as pd
from sklearn.model_selection import train_test_split

SYNTHETIC_SAMPLES = [
    # IT and Wi-Fi
    ("Wi-Fi disconnected frequently in Hostel 4 Wing B", "The Wi-Fi router on the 3rd floor keeps dropping signal every 5 minutes.", "IT and Wi-Fi"),
    ("Campus student portal gives 504 gateway timeout", "Unable to register for semester electives due to gateway timeout on the portal.", "IT and Wi-Fi"),
    ("Ethernet port dead at desk 14 in computer lab 2", "RJ45 wall socket has no link light and does not assign IP address.", "IT and Wi-Fi"),
    ("Eduroam authentication failing with university credentials", "Cannot log into Eduroam network despite password reset on central LDAP.", "IT and Wi-Fi"),
    ("Slow internet speed in central library digital section", "Download and upload speeds are below 500 kbps, unable to access IEEE journals.", "IT and Wi-Fi"),
    ("Hostel 2 block C router blinking red", "The corridor wireless access point shows red error light and has no SSID broadcast.", "IT and Wi-Fi"),
    ("Printer server offline in CSE department lab", "Network printer 10.10.4.55 is unresponsive to print jobs submitted over LAN.", "IT and Wi-Fi"),
    ("Smart card attendance scanner not connecting to server", "Biometric terminal in Main Seminar Hall gives network connection timeout error.", "IT and Wi-Fi"),
    ("DNS resolution failure on campus intranet", "Unable to open internal faculty portal and Moodle LMS on campus network.", "IT and Wi-Fi"),
    ("VPN access denied for off-campus research access", "Remote research lab VPN gateway gives invalid certificate or handshake failure.", "IT and Wi-Fi"),
    ("Hostel 5 Wi-Fi signal extremely weak inside rooms", "Signal is only available in the open balcony, zero reception inside dormitory rooms.", "IT and Wi-Fi"),
    ("Firewall blocking academic Git repositories", "Git clone from github and gitlab is hanging with connection refused on campus proxy.", "IT and Wi-Fi"),
    ("Computer lab 1 desktop PCs cannot obtain DHCP IP", "All 30 machines in Lab 1 show unidentified network and self-assigned IP.", "IT and Wi-Fi"),
    ("Campus webmail service not receiving incoming verification emails", "Students are not receiving external emails from conference and submission portals.", "IT and Wi-Fi"),

    # Electrical
    ("Sparking observed in main distribution board in Block A", "Heard crackling sound and noticed burning smell near electrical switchboard on floor 2.", "Electrical"),
    ("Tube lights flickering in Lecture Hall 203", "Two tube lights near the front podium are flickering continuously causing eye strain.", "Electrical"),
    ("Ceiling fan regulator broken in Room 108", "The fan knob has popped out and the fan is stuck at maximum speed.", "Electrical"),
    ("Power outage in Mechanical workshop section B", "All 3-phase power sockets for lathe machines are completely dead since morning.", "Electrical"),
    ("Exposed wires hanging from false ceiling in corridor", "Open electrical wires with stripped insulation near elevator on 4th floor.", "Electrical"),
    ("Streetlight not working near hostel walkway", "The path between Girls Hostel and Cafeteria is pitch dark at night due to broken light pole.", "Electrical"),
    ("Air conditioner tripping circuit breaker in Seminar Hall", "As soon as AC unit 2 is turned on, the MCB trips for the entire hall.", "Electrical"),
    ("Socket burnt in Chemistry research lab", "Three-pin 16A socket showed smoke when heating mantle was plugged in.", "Electrical"),
    ("Emergency backup generator not kicking in during outage", "Main computer centre had sudden shutdown when grid power failed; UPS alarm beeping.", "Electrical"),
    ("Exhaust fan stopped working in chemistry laboratory", "Fume exhaust motor is not turning on, making the chemical storage room hazardous.", "Electrical"),
    ("Switch plate loose and wobbling in Room 405", "Plastic cover came off exposing live terminals behind the light switches.", "Electrical"),
    ("High voltage fluctuation noticed in Physics lab", "Voltage meters showing fluctuations between 180V and 260V damaging sensitive sensors.", "Electrical"),
    ("Corridor lights not turning on in Academic Complex", "Switches on the panel do not operate the overhead lights on the west wing.", "Electrical"),
    ("Main transformer buzzing loudly with heat", "Transformer unit behind sports complex is humming excessively loud with ozone odor.", "Electrical"),

    # Plumbing
    ("Severe water leakage in 2nd floor washroom", "Pipes beneath the central washbasin burst and water is flooding into the corridor.", "Plumbing"),
    ("Tap broken and continuously running in Hostel 3 mess", "Handwash tap valve is sheared off and water is being wasted continuously.", "Plumbing"),
    ("Low water pressure in 4th floor hostel showers", "Water barely trickles out of shower heads in Hostel Block D top floor bathrooms.", "Plumbing"),
    ("Drain clogged and dirty water backing up in canteen", "Kitchen sink drain is jammed with grease and water is stagnating on the floor.", "Plumbing"),
    ("Flush tank not refilling in Ground Floor Restroom", "Cistern valve is stuck and will not draw water in the admin block restroom.", "Plumbing"),
    ("Drinking water cooler leaking onto hallway floor", "Water purifier outlet pipe is cracked near Library 1st floor water dispenser.", "Plumbing"),
    ("Sewage odor emerging from bathroom floor drain", "Trap water has dried out or sewer line is blocked behind Girls Hostel 2.", "Plumbing"),
    ("Overhead water tank overflowing onto roof", "Float sensor failure has caused continuous overflow from main storage tank on Tower B.", "Plumbing"),
    ("No water supply in Chemical Engineering department", "All taps and eyewash safety stations have zero water supply since 8 AM.", "Plumbing"),
    ("Rust colored water coming out of hostel taps", "Water has reddish brown sediment and metallic smell in Hostel 1 Wing A.", "Plumbing"),
    ("Urinal auto-flush sensor leaking continuously", "Sensor actuated valve is stuck open wasting constant streams of water.", "Plumbing"),
    ("Underground supply line seepage near basketball court", "Water pooling on the pavement indicates broken main distribution line.", "Plumbing"),
    ("Lab sink trap cracked and dripping under cabinet", "Acidic waste drip has corroded the drain trap under bench 4 in Bio lab.", "Plumbing"),

    # Hostel maintenance
    ("Window glass shattered in Room 304 due to storm", "Outer window pane cracked and loose shards may fall into courtyard below.", "Hostel maintenance"),
    ("Room door lock cylinder jammed in Hostel 6", "Key cannot be turned in lock; student currently unable to secure room when leaving.", "Hostel maintenance"),
    ("Wooden wardrobe door hinge detached", "Almirah door is hanging by one hinge and might fall off if opened.", "Hostel maintenance"),
    ("Study table drawer broken and falling out", "Runner track is bent and drawer cannot be slid in or out in Room 118.", "Hostel maintenance"),
    ("Mosquito net mesh torn on balcony door", "Large hole in protective netting allowing mosquitoes and insects inside room.", "Hostel maintenance"),
    ("Curtain rod fell off wall bracket in Room 215", "Drywall screws pulled out when closing curtains, bracket hanging loose.", "Hostel maintenance"),
    ("Mattress provided is severely damaged and sagging", "Springs are protruding through fabric posing a safety issue for occupant.", "Hostel maintenance"),
    ("Dampness and paint peeling off ceiling in Room 410", "Water seepage from upper terrace has caused plaster to fall on study desk.", "Hostel maintenance"),
    ("Balcony railing loose and shaking in Block C", "Metal weld on 3rd floor balcony railing has snapped, causing fall hazard.", "Hostel maintenance"),
    ("Geyser water heater in bathroom not heating", "Water remains ice cold even after 30 minutes of geyser being powered on.", "Hostel maintenance"),
    ("Room door latch misaligned will not latch shut", "Wood has expanded with humidity and door bolt does not enter strike plate.", "Hostel maintenance"),
    ("Bed frame wooden plank cracked in Room 502", "Support slat under cot has split down the center.", "Hostel maintenance"),

    # Classroom and laboratory equipment
    ("Projector HDMI display flickering in Audi 1", "Projector drops image every minute and displays no signal detected intermittently.", "Classroom and laboratory equipment"),
    ("Digital podium microphone dead in Lecture Hall 101", "Gooseneck podium microphone has no audio output through hall speakers.", "Classroom and laboratory equipment"),
    ("Oscilloscope channel 2 faulty in Electronics lab", "Tektronix DSO channel 2 produces distorted waveform with high offset error.", "Classroom and laboratory equipment"),
    ("Chemical fume hood airflow velocity too low", "Safety monitor indicates face velocity below 0.3 m/s in organic synthesis lab.", "Classroom and laboratory equipment"),
    ("Centrifuge vibrating violently in Biotechnology lab", "Benchtop centrifuge makes loud rattling noise above 2000 RPM, rotor unaligned.", "Classroom and laboratory equipment"),
    ("Smart interactive whiteboard touch calibration lost", "Stylus inputs register 5 inches away from contact point on smartboard in LH 302.", "Classroom and laboratory equipment"),
    ("Spectrophotometer lamp burned out in Bioengineering lab", "UV-Vis spectrophotometer fails self-test on deuterium lamp initialization.", "Classroom and laboratory equipment"),
    ("Motorized projection screen stuck halfway down", "Electric screen remote does not respond and screen is jammed crooked in LH 4.", "Classroom and laboratory equipment"),
    ("Microscope mechanical stage stuck in Pathology lab", "Fine focus knob slips and stage cannot traverse along the Y-axis.", "Classroom and laboratory equipment"),
    ("Universal Testing Machine hydraulic pressure leak", "UTM in Civil Structures lab leaking hydraulic fluid around main piston.", "Classroom and laboratory equipment"),
    ("Audio system emitting loud 50Hz ground hum in Conference Room", "PA amplifier has severe grounding buzz through all ceiling speakers.", "Classroom and laboratory equipment"),
    ("Muffle furnace thermostat not regulating temperature", "Furnace in Materials lab keeps heating past setpoint temperature without cutoff.", "Classroom and laboratory equipment"),

    # Sanitation
    ("Garbage dumpster overflowing near Hostel Canteen", "Trash bags piled up outside bins attracting stray dogs and flies.", "Sanitation"),
    ("Corridor floor dirty and unmopped in Academic Block B", "Muddy footprints and spilled coffee left uncleaned since yesterday afternoon.", "Sanitation"),
    ("Restroom lacks soap and paper towels in Main Building", "Handwash liquid dispensers are empty in all 1st floor lavatories.", "Sanitation"),
    ("Stagnant water breeding mosquitoes near sports ground", "Puddle of untreated rainwater behind gym pavilion has mosquito larvae.", "Sanitation"),
    ("Sanitary napkin disposal bin full in Ladies Restroom", "Disposal container in 3rd floor women's washroom requires urgent emptying.", "Sanitation"),
    ("Dust and cobwebs on classroom desks in Hall 105", "Benches are coated in thick dust and windows haven't been wiped in weeks.", "Sanitation"),
    ("Foul odor from chemical residue trash in lab corridor", "Open disposal bags containing reagent bottles left in public hallway.", "Sanitation"),
    ("Pest and cockroach infestation in hostel pantry area", "Cockroaches observed around microwaves and water dispenser counter.", "Sanitation"),
    ("Leaves and debris clogging rooftop drainage gutters", "Rooftop drains choked with dead leaves leading to rainwater accumulation.", "Sanitation"),
    ("Animal waste found near entrance staircase of Block D", "Dog droppings on the main entry stairs of academic block need removal.", "Sanitation"),
    ("Food scraps left rotting in study room trash bin", "Disposed lunch boxes emitting severe stench in 24-hour reading room.", "Sanitation"),

    # Other
    ("Lost student identity card near cafeteria garden", "Found or lost blue RFID smart ID card belonging to CSE Department student.", "Other"),
    ("Excessive noise from lawn mowers during final examinations", "Landscaping maintenance scheduled directly outside Exam Hall 201 during test.", "Other"),
    ("Stray dogs wandering inside academic building foyer", "Pack of aggressive dogs entered building through open emergency doors.", "Other"),
    ("Unauthorized vehicle parked blocking handicap accessibility ramp", "White sedan parked directly in front of wheelchair ramp at library entry.", "Other"),
    ("Bicycle lock key snapped off in parking rack", "Key broke inside U-lock at Department bicycle stand, cycle cannot be unlocked.", "Other"),
    ("Campus shuttle bus schedule not adhered to", "Morning shuttle at 8:15 AM did not arrive causing students to miss morning class.", "Other"),
    ("Tree branch fell and obstructing pathway near Gate 2", "Large bough snapped during winds and is blocking student pedestrian walkway.", "Other"),
    ("Notice board glass broken and posters defaced", "Department official announcement board glass vandalized in lobby.", "Other"),
    ("Inquiry regarding lost umbrella left in Audi 2", "Left black folding umbrella in Auditorium after guest lecture yesterday.", "Other"),
    ("Construction materials left unattended in parking lot", "Bags of cement and metal gravel blocking student scooter parking stalls.", "Other"),
]

def generate_splits():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(base_dir, exist_ok=True)
    
    rows = []
    # Expand dataset with realistic linguistic variations
    for title, desc, cat in SYNTHETIC_SAMPLES:
        rows.append({"title": title, "description": desc, "category": cat})
        # Add slight variation
        rows.append({
            "title": f"Urgent: {title}",
            "description": f"Reporting issue: {desc} Please send someone to inspect.",
            "category": cat
        })
        rows.append({
            "title": f"Issue with {title.lower()}",
            "description": f"Attention maintenance team: {desc}",
            "category": cat
        })

    df = pd.DataFrame(rows)
    # 80-20 train-test split
    train_df, test_df = train_test_split(df, test_size=0.20, random_state=42, stratify=df["category"])
    
    csv_path = os.path.join(base_dir, "synthetic_complaints_full.csv")
    train_path = os.path.join(base_dir, "train_complaints.csv")
    test_path = os.path.join(base_dir, "test_complaints.csv")
    
    df.to_csv(csv_path, index=False)
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    print(f"Generated {len(df)} total samples: {len(train_df)} train, {len(test_df)} test.")

if __name__ == "__main__":
    generate_splits()
