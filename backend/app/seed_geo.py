"""Universal geo + sector seed. Administrative NAMES are real (public knowledge);
coordinates only where confidently known. Everything else: config/DEMO labeled.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from .models import geo as g

# 26 districts of Andhra Pradesh (2022 reorganization) — names only.
AP_DISTRICTS = [
    "Alluri Sitharama Raju", "Anakapalli", "Anantapuramu", "Annamayya",
    "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada",
    "Dr. B.R. Ambedkar Konaseema", "Krishna", "Kurnool", "Nandyal", "NTR",
    "Palnadu", "Parvathipuram Manyam", "Prakasam",
    "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam",
    "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa",
]

# 33 districts of Telangana (2016) — names only.
TG_DISTRICTS = [
    "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad",
    "Jagtial", "Jangaon", "Jayashankar Bhupalapally", "Jogulamba Gadwal",
    "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad",
    "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak",
    "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
    "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
    "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
    "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri",
]

OTHER_STATES = [
    ("IN-AS", "Assam"), ("IN-BR", "Bihar"), ("IN-GJ", "Gujarat"),
    ("IN-KA", "Karnataka"), ("IN-KL", "Kerala"), ("IN-MH", "Maharashtra"),
    ("IN-MN", "Manipur"), ("IN-ML", "Meghalaya"), ("IN-MZ", "Mizoram"),
    ("IN-NL", "Nagaland"), ("IN-OD", "Odisha"), ("IN-PB", "Punjab"),
    ("IN-RJ", "Rajasthan"), ("IN-SK", "Sikkim"), ("IN-TN", "Tamil Nadu"),
    ("IN-TR", "Tripura"), ("IN-UP", "Uttar Pradesh"), ("IN-WB", "West Bengal"),
]

# Showcase cities — coordinates for major cities only (well-known).
CITIES = [
    # code, district, name, kind, lat, lon, coastal
    ("IN-AP-KRI-VJA", "IN-AP-KRI", "Vijayawada", "city", 16.5062, 80.6480, False),
    ("IN-AP-VSP-VSP", "IN-AP-VSP", "Visakhapatnam", "city", 17.6868, 83.2185, True),
    ("IN-AP-GTR-GTR", "IN-AP-GTR", "Guntur", "city", 16.3067, 80.4365, False),
    ("IN-AP-TPT-TPT", "IN-AP-TPT", "Tirupati", "city", 13.6288, 79.4192, False),
    ("IN-AP-KKD-KKD", "IN-AP-KKD", "Kakinada", "city", 16.9891, 82.2475, True),
    ("IN-AP-NLR-NLR", "IN-AP-NLR", "Nellore", "city", 14.4426, 79.9865, True),
    ("IN-AP-KNL-KNL", "IN-AP-KNL", "Kurnool", "city", 15.8281, 78.0373, False),
    ("IN-TG-HYD-HYD", "IN-TG-HYD", "Hyderabad", "city", 17.3850, 78.4867, False),
    ("IN-TG-WGL-WGL", "IN-TG-WGL", "Warangal", "city", 17.9689, 79.5941, False),
    ("IN-TG-NZB-NZB", "IN-TG-NZB", "Nizamabad", "city", 18.6725, 78.0941, False),
    ("IN-TG-KHM-KHM", "IN-TG-KHM", "Khammam", "city", 17.2473, 80.1514, False),
    ("IN-TG-KRM-KRM", "IN-TG-KRM", "Karimnagar", "city", 18.4386, 79.1288, False),
]

SECTORS = [
    ("natural", "Natural disasters", "ప్రకృతి విపత్తులు"),
    ("urban", "Urban emergencies", "పట్టణ అత్యవసరాలు"),
    ("industrial", "Industrial / technological", "పారిశ్రామిక / సాంకేతిక"),
    ("health", "Public health", "ప్రజారోగ్యం"),
    ("agri", "Agriculture / rural", "వ్యవసాయం / గ్రామీణ"),
    ("coastal", "Coastal", "తీరప్రాంతం"),
    ("transport", "Transportation", "రవాణా"),
]

DISASTERS = [
    ("cyclone", "coastal", "Cyclone", "తుఫాను"),
    ("flood", "natural", "Flood", "వరద"),
    ("flash_flood", "natural", "Flash flood", "ఆకస్మిక వరద"),
    ("heavy_rain", "natural", "Heavy rainfall", "భారీ వర్షం"),
    ("landslide", "natural", "Landslide", "కొండచరియలు విరిగిపడటం"),
    ("heatwave", "natural", "Heatwave", "వడగాలులు"),
    ("earthquake", "natural", "Earthquake", "భూకంపం"),
    ("drought", "agri", "Drought", "కరువు"),
    ("fire", "urban", "Major fire", "భారీ అగ్నిప్రమాదం"),
    ("building_collapse", "urban", "Building collapse", "భవనం కూలిపోవడం"),
    ("road_accident", "transport", "Major road accident", "రోడ్డు ప్రమాదం"),
    ("power_failure", "urban", "Power failure", "విద్యుత్ అంతరాయం"),
    ("storm_surge", "coastal", "Storm surge", "తుఫాను ఉప్పెన"),
    ("chemical", "industrial", "Chemical incident", "రసాయన ప్రమాదం"),
    ("health_alert", "health", "Health emergency", "ఆరోగ్య అత్యవసరం"),
]

AGENCIES = [
    ("AP-SDMA", "AP State Disaster Management Authority", "government", "state", ""),
    ("TG-SDMA", "Telangana Disaster Management Authority", "government", "state", ""),
    ("DIST-ADM", "District Administration", "government", "district", ""),
    ("MUNICIPAL", "Municipal Authority", "government", "municipal", ""),
    ("POLICE", "Police", "government", "district", "100"),
    ("FIRE", "Fire & Emergency Services", "government", "district", "101"),
    ("HEALTH", "Health Department / Hospitals", "government", "district", "108"),
    ("SDRF", "State Disaster Response Force", "government", "state", ""),
    ("NGO", "Relief NGOs & Volunteers", "ngo", "local", ""),
]


def _slug(s: str) -> str:
    out = "".join(c.upper() if c.isalnum() else "-" for c in s)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")[:20]


def seed_geo(db: Session) -> dict:
    done: dict = {}
    if db.query(g.Country).count() == 0:
        db.add_all([
            g.Country(code="IN", name="India",
                      bbox="6.5,68.0,37.5,97.5", source="config"),
            g.Country(code="US", name="United States", source="config"),
            g.Country(code="GB", name="United Kingdom", source="config"),
            g.Country(code="AU", name="Australia", source="config"),
            g.Country(code="JP", name="Japan", source="config"),
        ])
        done["countries"] = 5
    if db.query(g.State).count() == 0:
        db.add_all([
            g.State(code="IN-AP", country_code="IN", name="Andhra Pradesh"),
            g.State(code="IN-TG", country_code="IN", name="Telangana"),
        ] + [g.State(code=c, country_code="IN", name=n) for c, n in OTHER_STATES])
        done["states"] = 2 + len(OTHER_STATES)
    if db.query(g.District).count() == 0:
        # district-code aliases used by showcase cities (preferred codes)
        alias = {"Krishna": "IN-AP-KRI", "Visakhapatnam": "IN-AP-VSP",
                 "Guntur": "IN-AP-GTR", "Tirupati": "IN-AP-TPT",
                 "Kakinada": "IN-AP-KKD",
                 "Sri Potti Sriramulu Nellore": "IN-AP-NLR", "Kurnool": "IN-AP-KNL",
                 "Hyderabad": "IN-TG-HYD", "Warangal": "IN-TG-WGL",
                 "Nizamabad": "IN-TG-NZB", "Khammam": "IN-TG-KHM",
                 "Karimnagar": "IN-TG-KRM"}
        rows = [g.District(code=alias.get(n, f"IN-AP-{_slug(n)}"),
                           state_code="IN-AP", name=n) for n in AP_DISTRICTS]
        rows += [g.District(code=alias.get(n, f"IN-TG-{_slug(n)}"),
                            state_code="IN-TG", name=n) for n in TG_DISTRICTS]
        db.add_all(rows)
        done["districts"] = len(rows)
    if db.query(g.City).count() == 0:
        db.add_all([g.City(code=c, district_code=d, name=n, kind=k,
                           lat=la, lon=lo, has_coords=True, coastal=co,
                           source="config-verified")
                    for c, d, n, k, la, lo, co in CITIES])
        done["cities"] = len(CITIES)
    if db.query(g.Sector).count() == 0:
        db.add_all([g.Sector(code=c, name_en=e, name_te=t) for c, e, t in SECTORS])
        done["sectors"] = len(SECTORS)
    if db.query(g.DisasterType).count() == 0:
        db.add_all([g.DisasterType(code=c, sector=s, name_en=e, name_te=t)
                    for c, s, e, t in DISASTERS])
        done["disasters"] = len(DISASTERS)
    if db.query(g.Agency).count() == 0:
        db.add_all([g.Agency(code=c, name=n, kind=k, scope=s, contact=ct)
                    for c, n, k, s, ct in AGENCIES])
        done["agencies"] = len(AGENCIES)
    if db.query(g.Shelter).count() == 0:
        db.add_all([
            g.Shelter(id="SH-VJA-01", name="Vijayawada Relief Shelter (demo)",
                      region_code="IN-AP-KRI-VJA", lat=16.51, lon=80.65,
                      capacity=800, occupancy=120,
                      facilities="water, medical desk, power backup",
                      contact="District control room"),
            g.Shelter(id="SH-HYD-01", name="Hyderabad Relief Shelter (demo)",
                      region_code="IN-TG-HYD-HYD", lat=17.39, lon=78.49,
                      capacity=1200, occupancy=200,
                      facilities="water, medical desk, family zone",
                      contact="GHMC control room"),
        ])
        done["shelters"] = 2
    if db.query(g.Resource).count() == 0:
        db.add_all([
            g.Resource(id="AMB-VJA-01", kind="ambulance", name="Ambulance VJA-01 (demo)",
                       agency_code="HEALTH", region_code="IN-AP-KRI",
                       lat=16.51, lon=80.65, status="available", capacity=2),
            g.Resource(id="FIRE-HYD-01", kind="fire", name="Fire Tender HYD-01 (demo)",
                       agency_code="FIRE", region_code="IN-TG-HYD",
                       lat=17.38, lon=78.48, status="available", capacity=6),
            g.Resource(id="BOAT-KKD-01", kind="boat", name="Rescue Boat KKD-01 (demo)",
                       agency_code="SDRF", region_code="IN-AP-KKD",
                       lat=16.99, lon=82.25, status="available", capacity=12),
        ])
        done["resources"] = 3
    db.commit()
    return {"seeded": done, "note": "Names/config real; coords only where verified."}
