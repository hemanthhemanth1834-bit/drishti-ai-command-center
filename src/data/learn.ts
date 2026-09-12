/** Disaster education content — fully trilingual (EN/TE/HI). Simple, natural language. */

export type LearnLang = 'en' | 'te' | 'hi';
type L3 = Record<LearnLang, string>;
type L3List = Record<LearnLang, string[]>;

export type LearnTopic = {
  id: string;
  emoji: string;
  title: L3;
  before: L3List;
  during: L3List;
  after: L3List;
  emergency: L3List;
  dos: L3List;
  donts: L3List;
};

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: 'flood', emoji: '🌊',
    title: { en: 'Flood', te: 'వరద', hi: 'बाढ़' },
    before: {
      en: ['Know if you live in a low-lying area.', 'Keep documents in a waterproof pouch.', 'Charge phone + power bank.'],
      te: ['మీ ఇల్లు లోతట్టు ప్రాంతంలో ఉందో తెలుసుకోండి.', 'పత్రాలను వాటర్‌ఫ్రూఫ్ కవర్‌లో ఉంచండి.', 'ఫోన్ + పవర్ బ్యాంక్ ఛార్జ్ చేయండి.'],
      hi: ['जानें कि आपका घर निचले इलाके में है या नहीं।', 'दस्तावेज़ वाटरप्रूफ थैली में रखें।', 'फोन + पावर बैंक चार्ज करें।'],
    },
    during: {
      en: ['Move to high ground immediately.', 'Never walk through flowing water.', 'Turn off gas and electricity if told to.'],
      te: ['వెంటనే ఎత్తైన ప్రదేశానికి వెళ్లండి.', 'ప్రవహించే నీటిలో నడవకండి.', 'చెబితే గ్యాస్, కరెంట్ ఆపండి.'],
      hi: ['तुरंत ऊंची जगह जाएं।', 'बहते पानी में न चलें।', 'कहने पर गैस-बिजली बंद करें।'],
    },
    after: {
      en: ['Do not drink tap water until declared safe.', 'Watch for snakes and debris.', 'Photograph damage for claims.'],
      te: ['సురక్షితమని చెప్పేవరకు కుళాయి నీరు తాగకండి.', 'పాములు, శిథిలాల పట్ల జాగ్రత్త.', 'నష్టాన్ని ఫోటో తీయండి.'],
      hi: ['सुरक्षित घोषित होने तक नल का पानी न पिएं।', 'सांपों और मलबे से सावधान रहें।', 'नुकसान की फोटो लें।'],
    },
    emergency: {
      en: ['Call 112 if trapped.', 'Move to the roof and signal for help.'],
      te: ['చిక్కుకుంటే 112కు కాల్ చేయండి.', 'పైకప్పుకు వెళ్లి సహాయం కోసం సంకేతం ఇవ్వండి.'],
      hi: ['फंस जाएं तो 112 पर कॉल करें।', 'छत पर जाएं और मदद के लिए संकेत दें।'],
    },
    dos: {
      en: ['Keep ORS + water ready.', 'Help elders first.'],
      te: ['ORS + నీరు సిద్ధంగా ఉంచండి.', 'ముందు వృద్ధులకు సహాయం చేయండి.'],
      hi: ['ORS + पानी तैयार रखें।', 'पहले बुजुर्गों की मदद करें।'],
    },
    donts: {
      en: ['Do not drive through water.', 'Do not touch live wires.'],
      te: ['నీటిలో వాహనం నడపకండి.', 'కరెంటు తీగలను తాకకండి.'],
      hi: ['पानी में गाड़ी न चलाएं।', 'बिजली के तारों को न छुएं।'],
    },
  },
  {
    id: 'cyclone', emoji: '🌀',
    title: { en: 'Cyclone', te: 'తుఫాను', hi: 'चक्रवात' },
    before: {
      en: ['Trim weak branches; secure loose items.', 'Stock 3 days of food and water.', 'Know your shelter route.'],
      te: ['బలహీన కొమ్మలు కత్తిరించండి; వదులు వస్తువులు కట్టండి.', '3 రోజుల ఆహారం, నీరు నిల్వ చేయండి.', 'శెల్టర్ మార్గం తెలుసుకోండి.'],
      hi: ['कमजोर डालियां काटें; खुला सामान बांधें।', '3 दिन का खाना-पानी रखें।', 'शेल्टर का रास्ता जानें।'],
    },
    during: {
      en: ['Stay indoors away from windows.', 'Do not go out in the calm eye — winds return.', 'Listen to radio advisories.'],
      te: ['కిటికీలకు దూరంగా ఇంట్లోనే ఉండండి.', 'కంటి ప్రశాంతతలో బయటకు వెళ్లకండి — గాలి తిరిగి వస్తుంది.', 'రేడియో సూచనలు వినండి.'],
      hi: ['खिड़कियों से दूर घर के अंदर रहें।', 'आंख की शांति में बाहर न जाएं — हवा लौटती है।', 'रेडियो सलाह सुनें।'],
    },
    after: {
      en: ['Beware fallen power lines.', 'Boil water before drinking.', 'Help clear only with gloves.'],
      te: ['తెగిన కరెంటు తీగల పట్ల జాగ్రత్త.', 'నీరు మరిగించి తాగండి.', 'గ్లౌజులతోనే శుభ్రం చేయండి.'],
      hi: ['टूटी बिजली लाइनों से सावधान रहें।', 'पानी उबालकर पिएं।', 'दस्तानों से ही सफाई करें।'],
    },
    emergency: {
      en: ['Call 101/112 for rescue.', 'Report blocked roads.'],
      te: ['రక్షణ కోసం 101/112కు కాల్ చేయండి.', 'మూసుకుపోయిన రోడ్లను నివేదించండి.'],
      hi: ['बचाव के लिए 101/112 पर कॉल करें।', 'बंद सड़कों की सूचना दें।'],
    },
    dos: {
      en: ['Keep torch + radio on.', 'Stay with family.'],
      te: ['టార్చ్ + రేడియో అందుబాటులో ఉంచండి.', 'కుటుంబంతోనే ఉండండి.'],
      hi: ['टॉर्च + रेडियो पास रखें।', 'परिवार के साथ रहें।'],
    },
    donts: {
      en: ['Do not shelter under weak sheds.', 'Do not spread rumours.'],
      te: ['బలహీన షెడ్ల కింద తలదాచుకోకండి.', 'పుకార్లు వ్యాప్తి చేయకండి.'],
      hi: ['कमजोर शेडों में शरण न लें।', 'अफवाहें न फैलाएं।'],
    },
  },
  {
    id: 'quake', emoji: '🏚️',
    title: { en: 'Earthquake', te: 'భూకంపం', hi: 'भूकंप' },
    before: {
      en: ['Fix heavy furniture to walls.', 'Know safe spots: under sturdy tables.', 'Keep shoes + torch by the bed.'],
      te: ['భారీ ఫర్నిచర్ గోడకు బిగించండి.', 'దృఢమైన టేబుళ్ల కింద సురక్షిత స్థలాలు తెలుసుకోండి.', 'బూట్లు + టార్చ్ పక్కన ఉంచండి.'],
      hi: ['भारी फर्नीचर दीवार से कसें।', 'मजबूत मेज़ों के नीचे सुरक्षित जगह जानें।', 'जूते + टॉर्च पास रखें।'],
    },
    during: {
      en: ['DROP, COVER, HOLD ON.', 'Stay away from glass and facades.', 'If outside, move to open ground.'],
      te: ['వంగండి, కప్పుకోండి, పట్టుకోండి.', 'అద్దాలు, భవన ముఖాలకు దూరంగా ఉండండి.', 'బయట ఉంటే ఖాళీ స్థలానికి వెళ్లండి.'],
      hi: ['झुकें, ढकें, पकड़ें।', 'कांच और इमारतों से दूर रहें।', 'बाहर हों तो खुली जगह जाएं।'],
    },
    after: {
      en: ['Expect aftershocks.', 'Check gas leaks before lighting anything.', 'Use stairs, not lifts.'],
      te: ['ప్రకంపనలు వస్తాయి జాగ్రత్త.', 'వెలిగించే ముందు గ్యాస్ లీక్ తనిఖీ చేయండి.', 'లిఫ్ట్ కాకుండా మెట్లు వాడండి.'],
      hi: ['आफ्टरशॉक आ सकते हैं।', 'जलाने से पहले गैस रिसाव जांचें।', 'लिफ्ट नहीं, सीढ़ियां लें।'],
    },
    emergency: {
      en: ['Call 112 if trapped under debris.', 'Shout and tap pipes at intervals.'],
      te: ['శిథిలాల కింద చిక్కుకుంటే 112కు కాల్ చేయండి.', 'మధ్యమధ్యలో అరిచి పైపులు కొట్టండి.'],
      hi: ['मलबे में फंसे तो 112 पर कॉल करें।', 'बीच-बीच में चिल्लाएं और पाइप बजाएं।'],
    },
    dos: {
      en: ['Keep a whistle in your go-bag.', 'Check on neighbours.'],
      te: ['గో-బ్యాగ్‌లో విజిల్ ఉంచండి.', 'పొరుగువారిని పలకరించండి.'],
      hi: ['गो-बैग में सीटी रखें।', 'पड़ोसियों का हाल लें।'],
    },
    donts: {
      en: ['Do not use lifts.', 'Do not light matches near leaks.'],
      te: ['లిఫ్ట్ వాడకండి.', 'లీకేజీ దగ్గర అగ్గిపుల్ల వెలిగించకండి.'],
      hi: ['लिफ्ट न लें।', 'रिसाव के पास माचिस न जलाएं।'],
    },
  },
  {
    id: 'fire', emoji: '🔥',
    title: { en: 'Fire', te: 'అగ్ని', hi: 'आग' },
    before: {
      en: ['Keep exits clear; test alarms.', 'Store fuel away from heat.', 'Know two exits from every room.'],
      te: ['దారులు ఖాళీగా ఉంచండి; అలారాలు పరీక్షించండి.', 'ఇంధనాన్ని వేడికి దూరంగా నిల్వ చేయండి.', 'ప్రతి గది నుండి రెండు దారులు తెలుసుకోండి.'],
      hi: ['रास्ते साफ रखें; अलार्म जांचें।', 'ईंधन गर्मी से दूर रखें।', 'हर कमरे से दो निकास जानें।'],
    },
    during: {
      en: ['Crawl low under smoke.', 'Feel doors before opening.', 'Call 101, then leave fast.'],
      te: ['పొగలో వంగి నడవండి.', 'తెరిచే ముందు తలుపులు తాకి చూడండి.', '101కు కాల్ చేసి వేగంగా బయటకు వెళ్లండి.'],
      hi: ['धुएं में झुककर चलें।', 'खोलने से पहले दरवाजे छूकर देखें।', '101 पर कॉल कर जल्दी बाहर जाएं।'],
    },
    after: {
      en: ['Do not re-enter until cleared.', 'Cool burns with water, seek care.', 'Ventilate before switching power on.'],
      te: ['అనుమతి లేకుండా లోపలికి వెళ్లకండి.', 'కాలిన గాయాలపై నీరు పోసి వైద్యం తీసుకోండి.', 'కరెంట్ వేసే ముందు గాలి ఆడనివ్వండి.'],
      hi: ['अनुमति बिना अंदर न जाएं।', 'जलन पर पानी डालें, इलाज लें।', 'बिजली देने से पहले हवा आने दें।'],
    },
    emergency: {
      en: ['Call 101 first, then evacuate.', 'Alert neighbours loudly.'],
      te: ['ముందు 101కు కాల్ చేసి తర్వాత ఖాళీ చేయండి.', 'పొరుగువారిని బిగ్గరగా హెచ్చరించండి.'],
      hi: ['पहले 101 पर कॉल करें, फिर खाली करें।', 'पड़ोसियों को ज़ोर से सचेत करें।'],
    },
    dos: {
      en: ['Keep an extinguisher accessible.', 'Meet at your decided point.'],
      te: ['ఆర్పే యంత్రం అందుబాటులో ఉంచండి.', 'నిర్ణయించిన చోట కలవండి.'],
      hi: ['अग्निशामक पास रखें।', 'तय जगह पर मिलें।'],
    },
    donts: {
      en: ['Do not use lifts.', 'Do not re-enter for belongings.'],
      te: ['లిఫ్ట్ వాడకండి.', 'వస్తువుల కోసం తిరిగి వెళ్లకండి.'],
      hi: ['लिफ्ट न लें।', 'सामान के लिए वापस न जाएं।'],
    },
  },
  {
    id: 'lightning', emoji: '⚡',
    title: { en: 'Lightning', te: 'పిడుగు', hi: 'बिजली' },
    before: {
      en: ['Check weather before outdoor work.', 'Unplug sensitive appliances.', 'Shelter plan for open fields.'],
      te: ['బయటి పనికి ముందు వాతావరణం చూడండి.', 'సున్నిత పరికరాలు అన్‌ప్లగ్ చేయండి.', 'మైదానాలకు శెల్టర్ ప్రణాళిక ఉంచండి.'],
      hi: ['बाहर काम से पहले मौसम देखें।', 'संवेदनशील उपकरण अनप्लग करें।', 'मैदानों के लिए शेल्टर योजना रखें।'],
    },
    during: {
      en: ['Go indoors; avoid trees and poles.', 'Stay away from water and metal.', 'Wait 30 min after last thunder.'],
      te: ['లోపలికి వెళ్లండి; చెట్లు, స్తంభాలకు దూరంగా ఉండండి.', 'నీరు, లోహాలకు దూరంగా ఉండండి.', 'చివరి ఉరుము తర్వాత 30 నిమిషాలు ఆగండి.'],
      hi: ['अंदर जाएं; पेड़ों-खंभों से दूर रहें।', 'पानी और धातु से दूर रहें।', 'आखिरी गड़गड़ाहट के 30 मिनट बाद निकलें।'],
    },
    after: {
      en: ['Check for smouldering fires.', 'Seek care for any shock symptoms.', 'Report damaged lines.'],
      te: ['నివురుగప్పిన మంటలను తనిఖీ చేయండి.', 'షాక్ లక్షణాలుంటే వైద్యం తీసుకోండి.', 'దెబ్బతిన్న లైన్లను నివేదించండి.'],
      hi: ['सुलगती आग जांचें।', 'झटके के लक्षणों पर इलाज लें।', 'क्षतिग्रस्त लाइनों की सूचना दें।'],
    },
    emergency: {
      en: ['Call 108 for strike injuries.', 'Begin CPR if trained and needed.'],
      te: ['పిడుగు గాయాలకు 108కు కాల్ చేయండి.', 'శిక్షణ ఉంటే CPR ప్రారంభించండి.'],
      hi: ['बिजली की चोट पर 108 लगाएं।', 'प्रशिक्षित हों तो CPR शुरू करें।'],
    },
    dos: {
      en: ['Crouch low if caught outside.', 'Stay in your vehicle if driving.'],
      te: ['బయట చిక్కుకుంటే వంగి కూర్చోండి.', 'డ్రైవింగ్‌లో ఉంటే వాహనంలోనే ఉండండి.'],
      hi: ['बाहर फंसें तो झुककर बैठें।', 'गाड़ी चला रहे हों तो अंदर ही रहें।'],
    },
    donts: {
      en: ['Do not lie flat on the ground.', 'Do not use wired phones.'],
      te: ['నేలపై బోర్లా పడుకోకండి.', 'వైర్డ్ ఫోన్లు వాడకండి.'],
      hi: ['जमीन पर सीधे न लेटें।', 'तार वाले फोन न चलाएं।'],
    },
  },
  {
    id: 'heat', emoji: '🌡️',
    title: { en: 'Extreme Heat', te: 'తీవ్ర వేడి', hi: 'अत्यधिक गर्मी' },
    before: {
      en: ['Plan outdoor work before 11am.', 'Stock ORS and water.', 'Check on elders daily.'],
      te: ['ఉదయం 11 గంటలలోపు బయటి పని పూర్తి చేయండి.', 'ORS, నీరు నిల్వ చేయండి.', 'వృద్ధులను రోజూ పలకరించండి.'],
      hi: ['सुबह 11 बजे से पहले बाहर का काम करें।', 'ORS और पानी रखें।', 'बुजुर्गों का रोज हाल लें।'],
    },
    during: {
      en: ['Stay in shade; sip water often.', 'Wear light cotton + cap.', 'Move anyone dizzy to cool shade.'],
      te: ['నీడలో ఉండి తరచూ నీరు తాగండి.', 'తేలికపాటి కాటన్ + టోపీ ధరించండి.', 'తలతిరిగినవారిని చల్లని నీడకు తరలించండి.'],
      hi: ['छांव में रहें, थोड़ा-थोड़ा पानी पिएं।', 'हल्के सूती कपड़े + टोपी पहनें।', 'चक्कर वालों को ठंडी छांव में ले जाएं।'],
    },
    after: {
      en: ['Watch for heat-stroke signs (hot dry skin).', 'Cool with wet cloths, call 108.', 'Rest 24 hours after recovery.'],
      te: ['వడదెబ్బ లక్షణాలు (వేడి పొడి చర్మం) గమనించండి.', 'తడి గుడ్డలతో చల్లబరిచి 108కు కాల్ చేయండి.', 'కోలుకున్నాక 24 గంటలు విశ్రాంతి.'],
      hi: ['लू के लक्षण (गर्म सूखी त्वचा) देखें।', 'गीले कपड़े से ठंडा करें, 108 लगाएं।', 'ठीक होकर 24 घंटे आराम करें।'],
    },
    emergency: {
      en: ['Call 108 for heat-stroke.', 'Move the person to AC/shade fast.'],
      te: ['వడదెబ్బకు 108కు కాల్ చేయండి.', 'వ్యక్తిని వేగంగా AC/నీడకు తరలించండి.'],
      hi: ['लू लगने पर 108 लगाएं।', 'व्यक्ति को जल्दी AC/छांव में ले जाएं।'],
    },
    dos: {
      en: ['Drink before feeling thirsty.', 'Eat light, slightly salty food.'],
      te: ['దాహం వేయకముందే నీరు తాగండి.', 'తేలికపాటి, కొద్దిగా ఉప్పటి ఆహారం తినండి.'],
      hi: ['प्यास से पहले पानी पिएं।', 'हल्का, थोड़ा नमकीन खाना खाएं।'],
    },
    donts: {
      en: ['Do not leave kids in parked cars.', 'Avoid alcohol in heat.'],
      te: ['ఆపిన కార్లలో పిల్లలను వదలకండి.', 'వేడిలో మద్యం తాగకండి.'],
      hi: ['खड़ी गाड़ियों में बच्चों को न छोड़ें।', 'गर्मी में शराब से बचें।'],
    },
  },
  {
    id: 'landslide', emoji: '⛰️',
    title: { en: 'Landslide', te: 'కొండచరియలు', hi: 'भूस्खलन' },
    before: {
      en: ['Watch for new cracks on slopes.', 'Keep drains on slopes clear.', 'Know the uphill escape path.'],
      te: ['వాలులపై కొత్త పగుళ్లు గమనించండి.', 'వాలు డ్రైన్లు శుభ్రంగా ఉంచండి.', 'ఎత్తుకు పారిపోయే మార్గం తెలుసుకోండి.'],
      hi: ['ढलानों पर नई दरारें देखें।', 'ढलान की नालियां साफ रखें।', 'ऊंचाई की ओर भागने का रास्ता जानें।'],
    },
    during: {
      en: ['Move sideways away from the slide path.', 'Alert neighbours loudly.', 'Call 112 after reaching safety.'],
      te: ['జారుడు మార్గం నుండి పక్కకు కదలండి.', 'పొరుగువారిని బిగ్గరగా హెచ్చరించండి.', 'సురక్షిత స్థలానికి చేరాక 112కు కాల్ చేయండి.'],
      hi: ['फिसलन के रास्ते से बगल हटें।', 'पड़ोसियों को ज़ोर से सचेत करें।', 'सुरक्षित जगह पहुंचकर 112 लगाएं।'],
    },
    after: {
      en: ['Stay away — more slides can follow.', 'Do not cross fresh debris.', 'Report blocked roads.'],
      te: ['మరిన్ని జారుళ్లు రావచ్చు దూరంగా ఉండండి.', 'తాజా శిథిలాలను దాటకండి.', 'మూసుకుపోయిన రోడ్లను నివేదించండి.'],
      hi: ['और भूस्खलन हो सकता है, दूर रहें।', 'ताजा मलबा पार न करें।', 'बंद सड़कों की सूचना दें।'],
    },
    emergency: {
      en: ['Call 112 with landmark + direction.', 'Keep the slope in sight if safe.'],
      te: ['గుర్తు + దిశతో 112కు కాల్ చేయండి.', 'సురక్షితమైతే వాలును గమనిస్తూ ఉండండి.'],
      hi: ['पहचान + दिशा के साथ 112 लगाएं।', 'सुरक्षित हो तो ढलान पर नजर रखें।'],
    },
    dos: {
      en: ['Plant deep-rooted grass.', 'Divert water away from slopes.'],
      te: ['లోతు వేర్ల గడ్డి నాటండి.', 'వాలుల నుండి నీటిని మళ్లించండి.'],
      hi: ['गहरी जड़ों वाली घास लगाएं।', 'ढलानों से पानी हटाएं।'],
    },
    donts: {
      en: ['Do not build at slope bases.', 'Do not cut slopes steeply.'],
      te: ['వాలు అడుగున నిర్మించకండి.', 'వాలులను నిటారుగా కోయకండి.'],
      hi: ['ढलान की जड़ में निर्माण न करें।', 'ढलानों को खड़ा न काटें।'],
    },
  },
  {
    id: 'tsunami', emoji: '🌅',
    title: { en: 'Tsunami', te: 'సునామీ', hi: 'सुनामी' },
    before: {
      en: ['Know your coastal evacuation route.', 'Learn the signs: long quake, sea receding.', 'Keep a go-bag ready.'],
      te: ['తీర తరలింపు మార్గం తెలుసుకోండి.', 'సంకేతాలు నేర్చుకోండి: పెద్ద భూకంపం, సముద్రం వెనక్కి తగ్గడం.', 'గో-బ్యాగ్ సిద్ధంగా ఉంచండి.'],
      hi: ['तटीय निकासी मार्ग जानें।', 'संकेत सीखें: लंबा भूकंप, समुद्र का पीछे हटना।', 'गो-बैग तैयार रखें।'],
    },
    during: {
      en: ['Run to high ground immediately.', 'Never go to watch the wave.', 'Stay until official all-clear.'],
      te: ['వెంటనే ఎత్తైన ప్రదేశానికి పరుగెత్తండి.', 'అలను చూడటానికి ఎప్పుడూ వెళ్లకండి.', 'అధికారిక క్లియరెన్స్ వరకు ఉండండి.'],
      hi: ['तुरंत ऊंची जगह दौड़ें।', 'लहर देखने कभी न जाएं।', 'आधिकारिक हरी झंडी तक रहें।'],
    },
    after: {
      en: ['Stay out of floodwater.', 'Help rescuers with local knowledge.', 'Boil water; discard soaked food.'],
      te: ['వరద నీటికి దూరంగా ఉండండి.', 'స్థానిక పరిజ్ఞానంతో రక్షకులకు సహాయం చేయండి.', 'నీరు మరిగించండి; తడిసిన ఆహారం పారేయండి.'],
      hi: ['बाढ़ के पानी से दूर रहें।', 'स्थानीय जानकारी से बचाव दल की मदद करें।', 'पानी उबालें; भीगा खाना फेंकें।'],
    },
    emergency: {
      en: ['Call 112 with beach name + km stone.', 'Guide others uphill calmly.'],
      te: ['బీచ్ పేరు + కిమీ రాయితో 112కు కాల్ చేయండి.', 'ఇతరులను ప్రశాంతంగా ఎత్తుకు నడిపించండి.'],
      hi: ['बीच का नाम + किमी पत्थर के साथ 112 लगाएं।', 'दूसरों को शांति से ऊंचाई पर ले जाएं।'],
    },
    dos: {
      en: ['Move 2km+ inland or 30m up.', 'Take radio + documents.'],
      te: ['2 కిమీ+ లోపలికి లేదా 30మీ ఎత్తుకు వెళ్లండి.', 'రేడియో + పత్రాలు తీసుకెళ్లండి.'],
      hi: ['2 किमी+ अंदर या 30 मी ऊपर जाएं।', 'रेडियो + दस्तावेज़ लें।'],
    },
    donts: {
      en: ['Do not return for belongings.', 'Do not believe wave myths.'],
      te: ['వస్తువుల కోసం తిరిగి వెళ్లకండి.', 'అలల అపోహలు నమ్మకండి.'],
      hi: ['सामान के लिए वापस न जाएं।', 'लहरों के मिथकों पर विश्वास न करें।'],
    },
  },
];
