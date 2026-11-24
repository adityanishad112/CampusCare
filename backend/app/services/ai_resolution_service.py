import os
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

DOMAIN_RESOLUTION_TEMPLATES = {
    "IT and Wi-Fi": {
        "technical_notes": "Inspected network hardware and physical CAT6 line. Re-terminated RJ45 connector, flushed DHCP lease table, and verified RF channel bandwidth at 5 GHz with signal strength at -52 dBm. Validated 100 Mbps uplink throughput.",
        "student_remarks": "The network connection and Wi-Fi access point in your area have been inspected and fully restored. Connection stability and speed tests have been verified successfully.",
        "preventive_measure": "Scheduled routine monthly access point firmware health audits."
    },
    "Electrical": {
        "technical_notes": "Isolated the branch circuit at the sub-distribution panel. Replaced faulty circuit breaker/switch component with standard 16A ISI-rated unit, tightened terminal screws, and verified insulation resistance (>2 Megaohms) and line voltage at 230V.",
        "student_remarks": "The electrical fixture has been safely repaired and verified. Power has been restored and circuit safety tested.",
        "preventive_measure": "Recommended routine thermal scanning of distribution panels to detect loose terminals early."
    },
    "Plumbing": {
        "technical_notes": "Inspected water line and shutoff valve. Replaced worn rubber gasket and teflon tape seal on the threaded union. Tested line under full hydrostatic pressure for 15 minutes with zero seepage.",
        "student_remarks": "The water leak has been resolved and the fixture components replaced. Water flow has been verified with no further leakage.",
        "preventive_measure": "Advised housekeeping to report initial drippage during morning rounds."
    },
    "Hostel maintenance": {
        "technical_notes": "Conducted on-site inspection of room civil fittings and hardware. Realigned hinges, replaced damaged latch mechanism with heavy-duty brass fitting, and lubricated moving joints.",
        "student_remarks": "The room maintenance work has been completed and all fixtures have been securely refitted and tested.",
        "preventive_measure": "Recorded fixture serial for standard semester inventory audit."
    },
    "Classroom and laboratory equipment": {
        "technical_notes": "Checked video/audio signaling path and interface ports. Replaced damaged HDMI patch cable, updated projector lamp timer calibration, and verified EDID handshake with test laptop at 1080p 60Hz.",
        "student_remarks": "The classroom multimedia apparatus has been tested and repaired. Projection and audio are working clearly.",
        "preventive_measure": "Placed protective cable sleeve to prevent physical pinching."
    },
    "Sanitation": {
        "technical_notes": "Dispatched sanitation rapid crew. Conducted thorough deep cleaning, wet vacuuming, and hospital-grade sanitization using diluted sodium hypochlorite disinfectant. Refilled soap and hygiene dispensers.",
        "student_remarks": "The area has been thoroughly cleaned and sanitized by the housekeeping team.",
        "preventive_measure": "Added spot to the daily twice-a-day custodial inspection checklist."
    },
    "Other": {
        "technical_notes": "Inspected the reported location, assessed physical condition, and executed necessary remedial adjustments in coordination with facility supervisor. Verified issue resolution.",
        "student_remarks": "The reported issue has been addressed by the facilities team. Please feel free to reach out if you notice any further discrepancies.",
        "preventive_measure": "Documented in monthly campus facilities maintenance log."
    }
}

def generate_resolution_draft(
    title: str,
    category: str,
    description: str,
    location: Optional[str] = "",
    action_taken: Optional[str] = ""
) -> Dict[str, Any]:
    """
    Generates smart professional technical resolution documentation
    and student-friendly status remarks.
    """
    # 1. Check if Gemini is enabled for zero-shot customized synthesis
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            import httpx
            prompt = (
                f"You are a campus facility engineer resolving a university ticket:\n"
                f"Ticket Title: {title}\n"
                f"Category: {category}\n"
                f"Description: {description}\n"
                f"Location: {location}\n"
                f"Action Taken: {action_taken or 'Fixed and tested'}\n\n"
                f"Respond in format:\n"
                f"TECHNICAL_NOTES: (Concise, professional engineering summary of repair, 2-3 sentences)\n"
                f"STUDENT_REMARKS: (Friendly, clear notice to student that issue is resolved, 1-2 sentences)\n"
                f"PREVENTIVE_MEASURE: (1 sentence recommendation to prevent recurrence)"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
            with httpx.Client(timeout=5.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json().get("candidates", [])[0]["content"]["parts"][0]["text"]
                    tech_match = re.search(r"TECHNICAL_NOTES:\s*(.*?)(?=STUDENT_REMARKS:|$)", text, re.DOTALL | re.IGNORECASE)
                    rem_match = re.search(r"STUDENT_REMARKS:\s*(.*?)(?=PREVENTIVE_MEASURE:|$)", text, re.DOTALL | re.IGNORECASE)
                    prev_match = re.search(r"PREVENTIVE_MEASURE:\s*(.*?)$", text, re.DOTALL | re.IGNORECASE)

                    if tech_match and rem_match:
                        return {
                            "technical_notes": tech_match.group(1).strip(),
                            "student_remarks": rem_match.group(1).strip(),
                            "preventive_measure": prev_match.group(1).strip() if prev_match else "Ongoing periodic audits.",
                            "model_used": "gemini-1.5-flash"
                        }
        except Exception as e:
            logger.debug("Gemini resolution generation fallback: %s", e)

    # 2. Template-based intelligent generator
    template = DOMAIN_RESOLUTION_TEMPLATES.get(category, DOMAIN_RESOLUTION_TEMPLATES["Other"])
    tech = template["technical_notes"]
    remarks = template["student_remarks"]
    prev = template["preventive_measure"]

    if action_taken:
        tech = f"{action_taken.strip()}. {tech}"

    if location:
        tech = f"At {location}: {tech}"

    return {
        "technical_notes": tech,
        "student_remarks": remarks,
        "preventive_measure": prev,
        "model_used": "v1.0-domain-template-generator"
    }
