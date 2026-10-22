/* KrishiSetu
   Comprehensive Agricultural Translation & Multi-Language Engine
   Supports English, Hindi, Marathi, Punjabi, Kannada, Telugu, Gujarati */

window.I18N = (() => {
  const LANGS = [
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'en', label: 'English', sub: 'English' },
    { code: 'mr', label: 'मराठी', sub: 'Marathi' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
    { code: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
    { code: 'te', label: 'తెలుగు', sub: 'Telugu' },
    { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' }
  ];

  const DICT = {
    // Brand & Top bar
    brand_sub: {
      en: 'KrishiSetu · Farmer Collective Portal',
      hi: 'कृषि सेतु (KrishiSetu) · किसान साथी',
      mr: 'कृषी सेतू (KrishiSetu) · शेतकरी साथी',
      pa: 'ਕ੍ਰਿਸ਼ੀ ਸੇਤੂ (KrishiSetu) · ਕਿਸਾਨ ਸਾਥੀ',
      kn: 'ಕೃಷಿ ಸೇತು (KrishiSetu) · ರೈತ ಮಿತ್ರ',
      te: 'కృషి సేతు (KrishiSetu) · రైతు మిత్రుడు',
      gu: 'કૃષિ સેતુ (KrishiSetu) · ખેડૂત સાથી'
    },
    demo_badge_title: {
      en: 'Demo Prototype · Sample Data',
      hi: 'डेमो प्रोटोटाइप · सैंपल डेटा',
      mr: 'डेमो प्रोटोटाइप · नमुना डेटा',
      pa: 'ਡੈਮੋ ਪ੍ਰੋਟੋਟਾਈਪ · ਨਮੂਨਾ ਡਾਟਾ',
      kn: 'ಡೆಮೊ ಮಾದರಿ · ಮಾದರಿ ಡೇಟಾ',
      te: 'డెమో ప్రోటోటైప్ · నమూనా డేటా',
      gu: 'ડેમો પ્રોટોટાઇપ · નમૂના ડેટા'
    },
    demo_badge_desc: {
      en: 'Active prototype for Indian Farmer Collectives. Buyer emails and replies run in simulation test mode.',
      hi: 'भारतीय किसान उत्पादक समूहों (FPO) के लिए प्रोटोटाइप। खरीदार ईमेल और प्रतिक्रिया परीक्षण सिमुलेशन मोड में हैं।',
      mr: 'भारतीय शेतकरी उत्पादक गटांसाठी (FPO) प्रोटोटाइप. खरेदीदार ईमेल व प्रतिसाद चाचणी मोडमध्ये आहेत.',
      pa: 'ਭਾਰਤੀ ਕਿਸਾਨ ਉਤਪਾਦਕ ਸਮੂਹਾਂ (FPO) ਲਈ ਪ੍ਰੋਟੋਟਾਈਪ। ਖਰੀਦਦਾਰ ਈਮੇਲ ਅਤੇ ਜਵਾਬ ਟੈਸਟ ਮੋਡ ਵਿੱਚ ਹਨ।',
      kn: 'ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆಗಳಿಗಾಗಿ (FPO) ಮಾದರಿ. ಖರೀದಿದಾರರ ಇಮೇಲ್ ಪರೀಕ್ಷಾ ಕ್ರಮದಲ್ಲಿದೆ.',
      te: 'భారతీయ రైతు ఉత్పత్తిదారుల సంఘాల (FPO) కోసం నమూనా. కొనుగోలుదారుల ఈమెయిళ్ళు పరీక్ష విధానంలో ఉన్నాయి.',
      gu: 'ભારતીય ખેડૂત ઉત્પાદક જૂથો (FPO) માટે પ્રોટોટાઇપ. ખરીદનાર ઇમેઇલ સિમ્યુલેશન મોડમાં છે.'
    },

    // Welcome Hero
    hero_title: {
      en: 'Fair price for your harvest, <em>together as a collective</em>',
      hi: 'फसल का सही दाम, <em>किसानों का सामूहिक मंच</em>',
      mr: 'पिकाला योग्य हमीभाव, <em>शेतकऱ्यांचा एकत्रित मंच</em>',
      pa: 'ਫਸਲ ਦਾ ਸਹੀ ਮੁੱਲ, <em>ਕਿਸਾਨਾਂ ਦਾ ਸਾਂਝਾ ਮੰਚ</em>',
      kn: 'ಬೆಳೆಗೆ ನ್ಯಾಯಯುತ ಬೆಲೆ, <em>ರೈತರ ಒಕ್ಕೂಟದ ವೇದಿಕೆ</em>',
      te: 'పంటకు సరైన ధర, <em>రైతుల సామూహిక వేదిక</em>',
      gu: 'પાકનો સાચો ભાવ, <em>ખેડૂતોનું સામૂહિક મંચ</em>'
    },
    hero_desc: {
      en: 'Instead of selling alone at mandi distress prices, pool harvest with neighbouring farmers. Agree on one minimum price and send verified direct quotes to mills and wholesale buyers — with zero middlemen commissions.',
      hi: 'एकल किसान के रूप में मंडी में कम भाव पर बेचने के बजाय, पड़ोसियों के साथ फसल जोड़ें। सर्वसम्मति से न्यूनतम भाव तय करें और आटा/दाल मिलों को सीधे ऑफ़र भेजें—बिना किसी बिचौलिये के।',
      mr: 'एकट्याने कमी भावात विकण्याऐवजी शेजारील शेतकऱ्यांसोबत पीक एकत्र करा. एक किमान भाव ठरवून थेट डाळ व पीठ गिरण्यांना विक्री करा.',
      pa: 'ਮੰਡੀ ਵਿਚ ਘੱਟ ਰੇਟ ਤੇ ਵੇਚਣ ਦੀ ਬਜਾਏ ਗੁਆਂਢੀ ਕਿਸਾਨਾਂ ਨਾਲ ਰਲ ਕੇ ਫਸਲ ਇਕੱਠੀ ਕਰੋ। ਘੱਟੋ-ਘੱਟ ਮੁੱਲ ਤੈਅ ਕਰਕੇ ਸਿੱਧਾ ਮਿੱਲਾਂ ਨੂੰ ਵੇਚੋ।',
      kn: 'ಒಬ್ಬರೇ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕಡಿಮೆ ಬೆಲೆಗೆ ಮಾರಾಟ ಮಾಡುವ ಬದಲು, ನೆರೆಯ ರೈತರೊಂದಿಗೆ ಬೆಳೆ ಒಟ್ಟುಗೂಡಿಸಿ. ಕನಿಷ್ಠ ಬೆಲೆ ನಿಗದಿಪಡಿಸಿ ನೇರವಾಗಿ ಗಿರಣಿಗಳಿಗೆ ಮಾರಾಟ ಮಾಡಿ.',
      te: 'మార్కెట్లో తక్కువ ధరకు అమ్మే బదులు, తోటి రైతులతో కలిసి పంటను కలపండి. కనీస ధరను నిర్ణయించి నేరుగా మిల్లులకు విక్రయించండి.',
      gu: 'એકલ દોકલ ખેડૂત તરીકે મંડીમાં ઓછા ભાવે વેચવાને બદલે પાડોશી ખેડૂતો સાથે પાક જોડો. સર્વસંમતિથી ભાવ નક્કી કરી સીધા મિલોને વેચો.'
    },
    feat_1_title: {
      en: 'Crop Pooling (फसल एकत्रीकरण)',
      hi: 'फसल एकत्रीकरण (Crop Pooling)',
      mr: 'पीक एकत्रीकरण (Crop Pooling)',
      pa: 'ਫਸਲ ਇਕੱਠੀ ਕਰਨਾ (Crop Pooling)',
      kn: 'ಬೆಳೆ ಒಟ್ಟುಗೂಡಿಸುವಿಕೆ (Crop Pooling)',
      te: 'పంట పూలింగ్ (Crop Pooling)',
      gu: 'પાક એકત્રીકરણ (Crop Pooling)'
    },
    feat_1_desc: {
      en: 'Combine harvest of the same crop to build wholesale volume (50–500 quintals) attractive to large commercial processors.',
      hi: 'एक ही फसल के किसानों की उपज जोड़कर थोक मात्रा (50–500 क्विंटल) तैयार करें जो बड़े खरीदारों व मिलों को आकर्षित करे।',
      mr: 'मोठ्या खरेदीदारांसाठी ५० ते ५०० क्विंटलचा साठा तयार करण्यासाठी एकाच पिकाचे शेतकरी एकत्र या.',
      pa: 'ਵੱਡੇ ਵਪਾਰੀਆਂ ਲਈ 50–500 ਕੁਇੰਟਲ ਦੀ ਮਾਤਰਾ ਤਿਆਰ ਕਰਨ ਲਈ ਇਕੱਠੇ ਹੋਵੋ।',
      kn: 'ದೊಡ್ಡ ಖರೀದಿದಾರರಿಗಾಗಿ 50–500 ಕ್ವಿಂಟಾಲ್ ಸಗಟು ಪ್ರಮಾಣವನ್ನು ಒಟ್ಟುಗೂಡಿಸಿ.',
      te: 'పెద్ద కొనుగోలుదారులను ఆకర్షించడానికి 50–500 క్వింటాళ్ల పరిమాణాన్ని సేకరించండి.',
      gu: 'મોટા ખરીદદારો માટે 50-500 ક્વિન્ટલનો જથ્થો તૈયાર કરવા ખેડૂતો જોડાય.'
    },
    feat_2_title: {
      en: 'Unanimous Price Voting (मूल्य सहमति)',
      hi: 'सामूहिक मूल्य सहमति (Price Agreement)',
      mr: 'किमान भाव मतदान (Price Agreement)',
      pa: 'ਸਾਂਝੀ ਕੀਮਤ ਸਹਿਮਤੀ (Price Agreement)',
      kn: 'ಬೆಲೆ ಒಪ್ಪಂದ ಮತದಾನ (Price Agreement)',
      te: 'ధర ఆమోదం ఓటింగ్ (Price Agreement)',
      gu: 'સામૂહિક ભાવ સંમતિ (Price Agreement)'
    },
    feat_2_desc: {
      en: 'Vote in private group chat on minimum acceptable rate based on APMC mandi prices and Govt MSP. Every farmer must agree.',
      hi: 'सरकारी MSP और मंडी भाव के आधार पर ग्रुप चैट में वोट करें। जब सभी किसान सहमत होते हैं, तभी सामूहिक भाव तय होता है।',
      mr: 'सरकारी हमीभाव आणि बाजारभावावर आधारित ग्रुप चॅटमध्ये मतदान करा. सर्व शेतकऱ्यांची संमती आवश्यक असते.',
      pa: 'ਸਰਕਾਰੀ MSP ਅਤੇ ਮੰਡੀ ਰੇਟਾਂ ਦੇ ਆਧਾਰ ਤੇ ਗਰੁੱਪ ਵਿਚ ਵੋਟ ਕਰੋ। ਸਾਰੇ ਕਿਸਾਨਾਂ ਦੀ ਸਹਿਮਤੀ ਲਾਜ਼ਮੀ ਹੈ।',
      kn: 'ಸರ್ಕಾರಿ ಬೆಂಬಲ ಬೆಲೆ ಹಾಗೂ ಮಂಡಿ ದರಗಳ ಆಧಾರದಲ್ಲಿ ಗುಂಪಿನಲ್ಲಿ ಮತ ಚಲಾಯಿಸಿ. ಎಲ್ಲ ರೈತರ ಒಪ್ಪಿಗೆ ಮುಖ್ಯ.',
      te: 'ప్రభుత్వ మద్దతు ధర, మార్కెట్ రేట్ల ఆధారంగా గ్రూప్‌లో ఓటు వేయండి. అందరి ఆమోదం తప్పనిసరి.',
      gu: 'સરકારી MSP અને મંડી ભાવોના આધારે ગ્રૂપ ચેટમાં વોટ કરો. બધા ખેડૂતોની સંમતિ જરૂરી છે.'
    },
    feat_3_title: {
      en: 'Direct Mill Buyer Outreach (सीधी बिक्री)',
      hi: 'मिलों व प्रसंस्करणकर्ताओं से सीधा संपर्क',
      mr: 'प्रक्रिया उद्योग व गिरण्यांशी थेट संपर्क',
      pa: 'ਮਿੱਲਾਂ ਅਤੇ ਵਪਾਰੀਆਂ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ',
      kn: 'ಗಿರಣಿಗಳು ಮತ್ತು ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರ ಸಂಪರ್ಕ',
      te: 'మిల్లులతో ప్రత్యక్ష సంప్రదింపులు',
      gu: 'મિલો સાથે સીધો સંપર્ક'
    },
    feat_3_desc: {
      en: 'Send collective quotation directly to verified flour mills, dal processors, and food companies with pickup and quality details.',
      hi: 'आटा मिलों, दाल मिलों और व्यापारियों को सीधे सामूहिक कोटेशन भेजें और मिलने वाली प्रतिक्रियाओं को समूह में देखें।',
      mr: 'दळण गिरण्या आणि डाळ उत्पादकांना थेट कोटेशन पाठवून थेट प्रतिसाद मिळवा.',
      pa: 'ਆਟਾ ਮਿੱਲਾਂ ਅਤੇ ਦਾਲ ਪ੍ਰੋਸੈਸਰਾਂ ਨੂੰ ਸਿੱਧਾ ਕੋਟੇਸ਼ਨ ਭੇਜੋ ਅਤੇ ਜਵਾਬ ਪ੍ਰਾਪਤ ਕਰੋ।',
      kn: 'ಹಿಟ್ಟಿನ ಗಿರಣಿಗಳು ಹಾಗೂ ಆಹಾರ ಸಂಸ್ಕರಣಾ ಘಟಕಗಳಿಗೆ ನೇರವಾಗಿ ಕೋಟೇಶನ್ ಕಳುಹಿಸಿ.',
      te: 'పిండి మిల్లులు మరియు పప్పుల మిల్లులకు నేరుగా కొటేషన్ పంపండి.',
      gu: 'લોટ મિલો, દાળ મિલો અને પ્રોસેસરોને સીધા જ ક્વોટેશન મોકલો.'
    },

    // Inclusive Greetings
    login_greeting: {
      en: 'Welcome, Farmer 🙏',
      hi: 'नमस्ते किसान साथी 🙏',
      mr: 'नमस्कार शेतकरी मित्र 🙏',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਸਾਥੀ 🙏',
      kn: 'ನಮಸ್ಕಾರ ರೈತ ಮಿತ್ರರೇ 🙏',
      te: 'నమస్కారం రైతు మిత్రులారా 🙏',
      gu: 'નમસ્તે ખેડૂત સાથી 🙏'
    },
    login_sub: {
      en: 'Sign in with your registered mobile number',
      hi: 'अपने पंजीकृत मोबाइल नंबर से प्रवेश करें',
      mr: 'आपल्या नोंदणीकृत मोबाईल नंबरने प्रवेश करा',
      pa: 'ਆਪਣੇ ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ ਨਾਲ ਲਾਗ ਇਨ ਕਰੋ',
      kn: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
      te: 'మీ నమోదిత మొబైల్ నంబర్‌తో లాగిన్ అవ్వండి',
      gu: 'તમારા નોંધાયેલા મોબાઈલ નંબરથી સાઇન ઇન કરો'
    },
    register_greeting: {
      en: 'Farmer Registration 🚜',
      hi: 'किसान पंजीकरण 🚜',
      mr: 'शेतकरी नोंदणी 🚜',
      pa: 'ਕਿਸਾਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ 🚜',
      kn: 'ರೈತರ ನೋಂದಣಿ 🚜',
      te: 'రైతు నమోదు 🚜',
      gu: 'ખેડૂત નોંધણી 🚜'
    },
    register_sub: {
      en: 'Join your local farmer collective and access cooperative services',
      hi: 'फसल समूह और सहकारी सेवाओं से जुड़ने के लिए विवरण भरें',
      mr: 'पीक गट आणि शेतकरी सहकारी सेवांमध्ये सहभागी व्हा',
      pa: 'ਫਸਲ ਪੂਲ ਅਤੇ ਸਹਿਕਾਰੀ ਸੇਵਾਵਾਂ ਲਈ ਆਪਣਾ ਵੇਰਵਾ ਭਰੋ',
      kn: 'ಬೆಳೆ ಒಕ್ಕೂಟ ಮತ್ತು ಸಹಕಾರಿ ಸೇವೆಗಳಿಗೆ ಸೇರಲು ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ',
      te: 'పంట పూల్ మరియు సహకార సేవలతో చేరడానికి వివరాలను నమోదు చేయండి',
      gu: 'પાક જૂથ અને સહકારી સેવાઓ સાથે જોડાવા વિગતો ભરો'
    },

    // Tabs & Buttons
    tab_login: { en: 'Sign In', hi: 'लॉग इन करें', mr: 'लॉग इन करा', pa: 'ਲਾਗ ਇਨ', kn: 'ಲಾಗಿನ್', te: 'లాగిన్', gu: 'સાઇન ઇન' },
    tab_register: { en: 'New Register', hi: 'नया पंजीकरण', mr: 'नवीन नोंदणी', pa: 'ਨਵੀਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ', kn: 'ಹೊಸ ನೋಂದಣಿ', te: 'కొత్త నమోదు', gu: 'નવી નોંધણી' },
    btn_signin: { en: 'Sign In to Account →', hi: 'खाते में प्रवेश करें →', mr: 'खात्यात प्रवेश करा →', pa: 'ਖਾਤੇ ਵਿੱਚ ਜਾਓ →', kn: 'ಖಾತೆಗೆ ಪ್ರವೇಶಿಸಿ →', te: 'ఖాతాలోకి ప్రవేశించండి →', gu: 'ખાતામાં પ્રવેશો →' },
    btn_signup: { en: 'Create Farmer Account →', hi: 'किसान खाता बनाएं →', mr: 'शेतकरी खाते तयार करा →', pa: 'ਕਿਸਾਨ ਖਾਤਾ ਬਣਾਓ →', kn: 'ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ →', te: 'రైతు ఖాతా తెరవండి →', gu: 'ખેડૂત ખાતું બનાવો →' },
    switch_to_reg: { en: 'New to KrishiSetu? Create an account', hi: 'पहली बार आए हैं? नया किसान खाता बनाएं', mr: 'नवीन आहात? नवीन शेतकरी खाते तयार करा', pa: 'ਪਹਿਲੀ ਵਾਰ ਆਏ ਹੋ? ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ', kn: 'ಹೊಸಬರೇ? ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ', te: 'మొదటిసారా? రైతు ఖాతా తెరవండి', gu: 'પહેલી વાર છો? નવું ખાતું બનાવો' },
    switch_to_login: { en: 'Already registered? Sign in here', hi: 'पहले से पंजीकृत हैं? लॉग इन करें', mr: 'आधीच नोंदणी केली आहे? लॉग इन करा', pa: 'ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰਡ ਹੋ? ਲਾਗ ਇਨ ਕਰੋ', kn: 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ? ಲಾಗಿನ್ ಮಾಡಿ', te: 'ఇప్పటికే నమోదయ్యారా? లాగిన్ అవ్వండి', gu: 'પહેલેથી નોંધાયેલા છો? સાઇન ઇન કરો' },

    // Form Field Labels & Placeholders
    lbl_phone: { en: 'Mobile Number (10 Digits)', hi: 'मोबाइल नंबर (10 अंक)', mr: 'मोबाईल नंबर (10 अंक)', pa: 'ਮੋਬਾਈਲ ਨੰਬਰ (10 ਅੰਕ)', kn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (10 ಅಂಕಿ)', te: 'మొబైల్ నంబర్ (10 అంకెలు)', gu: 'મોબાઇલ નંબર (10 અંક)' },
    lbl_password: { en: 'Password', hi: 'पासवर्ड', mr: 'पासवर्ड', pa: 'ਪਾਸਵਰਡ', kn: 'ಪಾಸ್ವರ್ಡ್', te: 'పాస్‌వర్డ్', gu: 'પાસવર્ડ' },
    lbl_name: { en: 'Full Name', hi: 'पूरा नाम', mr: 'पूर्ण नाव', pa: 'ਪੂਰਾ ਨਾਮ', kn: 'ಪೂರ್ಣ ಹೆಸರು', te: 'పూర్తి పేరు', gu: 'પૂરું નામ' },
    ph_name: { en: 'e.g. Ramesh Patil / Sunita Devi', hi: 'उदा. रमेश पाटिल / सुनीता देवी', mr: 'उदा. रमेश पाटील / अनिता पवार', pa: 'ਉਦਾ. ਜਗਜੀਤ ਸਿੰਘ / ਮਨਪ੍ਰੀਤ ਕੌਰ', kn: 'ಉದಾ. ರಮೇಶ್ ಪಾಟೀಲ್ / ಸುಜಾತಾ', te: 'ఉదా. రమేష్ పాటిల్ / సునీత', gu: 'દા.ત. રમેશ પટેલ / ગીતાબેન' },
    lbl_state: { en: 'State', hi: 'राज्य', mr: 'राज्य', pa: 'ਰਾਜ', kn: 'ರಾಜ್ಯ', te: 'రాష్ట్రం', gu: 'રાજ્ય' },
    sel_state: { en: 'Select State', hi: 'राज्य चुनें', mr: 'राज्य निवडा', pa: 'ਰਾਜ ਚੁਣੋ', kn: 'ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ', te: 'రాష్ట్రాన్ని ఎంచుకోండి', gu: 'રાજ્ય પસંદ કરો' },
    lbl_village: { en: 'Village / Mandi / Tehsil', hi: 'गाँव / मंडी / तहसील', mr: 'गाव / तालुका / मंडी', pa: 'ਪਿੰਡ / ਮੰਡੀ / ਤਹਿਸੀਲ', kn: 'ಗ್ರಾಮ / ಮಂಡಿ / ತಾಲೂಕು', te: 'గ్రామం / మార్కెట్ / మండలం', gu: 'ગામ / મંડી / તાલુકો' },
    ph_village: { en: 'e.g. Sehore / Ashta', hi: 'उदा. सीहोर / आष्टा', mr: 'उदा. नाशिक / बारामती', pa: 'ਉਦਾ. ਲੁਧਿਆਣਾ / ਖੰਨਾ', kn: 'ಉದಾ. ಧಾರವಾಡ / ಬೆಳಗಾವಿ', te: 'ఉదా. వరంగల్ / ఖమ్మం', gu: 'દા.ત. આણંદ / ગોંડલ' },
    lbl_land: { en: 'Farm Land in Acres (Optional)', hi: 'कुल कृषि भूमि - एकड़ में (वैकल्पिक)', mr: 'शेती जमीन - एकर (पर्यायी)', pa: 'ਜ਼ਮੀਨ - ਏਕੜ (ਵਿਕਲਪਿਕ)', kn: 'ಕೃಷಿ ಭೂಮಿ - ಎಕರೆ (ಐಚ್ಛಿಕ)', te: 'వ్యవసాయ భూమి - ఎకరాలు (ఐచ్ఛికం)', gu: 'કૃષિ જમીન - એકર (વૈકલ્પિક)' },
    lbl_crops: { en: 'Major Crops Grown', hi: 'प्रमुख फसलें (चुनें)', mr: 'पिकवली जाणारी प्रमुख पिके', pa: 'ਮੁੱਖ ਫਸਲਾਂ ਚੁਣੋ', kn: 'ಬೆಳೆಯುವ ಪ್ರಮುಖ ಬೆಳೆಗಳು', te: 'ప్రధాన పంటలు', gu: 'મુખ્ય પાક' },
    show_pw: { en: 'Show', hi: 'दिखाएं', mr: 'दाखवा', pa: 'ਵੇਖਾਓ', kn: 'ತೋರಿಸಿ', te: 'చూపించు', gu: 'બતાવો' },
    hide_pw: { en: 'Hide', hi: 'छिपाएं', mr: 'लपवा', pa: 'ਛੁਪਾਓ', kn: 'ಮರೆಮಾಡಿ', te: 'దాచు', gu: 'છુપાવો' },
    footer_text: {
      en: '© KrishiSetu · Designed for Indian Agricultural Collectives',
      hi: '© KrishiSetu · भारतीय कृषि सहकारी संघों के अनुरूप',
      mr: '© KrishiSetu · भारतीय कृषी सहकारी संस्थांसाठी',
      pa: '© KrishiSetu · ਭਾਰਤੀ ਕਿਸਾਨ ਸਹਿਕਾਰੀਆਂ ਲਈ',
      kn: '© KrishiSetu · ಭಾರತೀಯ ಕೃಷಿ ಒಕ್ಕೂಟಗಳಿಗಾಗಿ',
      te: '© KrishiSetu · భారతీయ వ్యవసాయ సహకారాల కోసం',
      gu: '© KrishiSetu · ભારતીય કૃષિ સહકારી માટે'
    },

    // App Navigation
    nav_home_main: { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', pa: 'ਡੈਸ਼ਬੋਰਡ', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', te: 'డ్యాష్‌బోర్డ్', gu: 'ડેશબોર્ડ' },
    nav_home_sub: { en: 'Farmer Summary', hi: 'किसान अवलोकन', mr: 'शेतकरी आढावा', pa: 'ਸਾਰ', kn: 'ಸಾರಾಂಶ', te: 'సారాంశం', gu: 'સારાંશ' },
    nav_pools_main: { en: 'Crop Pools', hi: 'फसल समूह', mr: 'पीक पूल', pa: 'ਫਸਲ ਪੂਲ', kn: 'ಬೆಳೆ ಪೂಲ್', te: 'పంట పూల్స్', gu: 'પાક જૂથ' },
    nav_pools_sub: { en: 'Collective Sale', hi: 'सामूहिक बिक्री', mr: 'सामूहिक विक्री', pa: 'ਸਾਂਝੀ ਵਿਕਰੀ', kn: 'ಸಾಮೂಹಿಕ ಮಾರಾಟ', te: 'సామూహిక విక్రయం', gu: 'સામૂહિક વેચાણ' },
    nav_labour_main: { en: 'Farm Labour', hi: 'खेत श्रमिक', mr: 'शेतमजूर', pa: 'ਖੇਤ ਮਜ਼ਦੂਰ', kn: 'ಕೃಷಿ ಕಾರ್ಮಿಕರು', te: 'వ్యవసాయ కార్మికులు', gu: 'ખેત મજૂર' },
    nav_labour_sub: { en: 'Local Hands', hi: 'श्रमिक सेवा', mr: 'मजूर सेवा', pa: 'ਮਜ਼ਦੂਰ ਸੇਵਾ', kn: 'ಕಾರ್ಮಿಕ ಸೇವೆ', te: 'కార్మిక సేవ', gu: 'મજૂર સેવા' },
    nav_gear_main: { en: 'Farm Gear', hi: 'कृषि यंत्र', mr: 'कृषी औजारे', pa: 'ਖੇਤੀ ਔਜ਼ਾਰ', kn: 'ಕೃಷಿ ಉಪಕರಣ', te: 'వ్యవసాయ యంత్రాలు', gu: 'કૃષિ યંત્ર' },
    nav_gear_sub: { en: 'Rent & Buy', hi: 'किराया व बिक्री', mr: 'भाडे व खरेदी', pa: 'ਕਿਰਾਇਆ ਤੇ ਵਿਕਰੀ', kn: 'ಬಾಡಿಗೆ ಮತ್ತು ಖರೀದಿ', te: 'అద్దె & విక్రయం', gu: 'ભાડે અને વેચાણ' },
    btn_logout: { en: 'Log out', hi: 'लॉग आउट', mr: 'लॉग आउट', pa: 'ਲਾਗ ਆਉਟ', kn: 'ಲಾಗ್ ಔಟ್', te: 'లాగ్ అవుట్', gu: 'લૉગ આઉટ' },
    choose_lang: { en: 'Language', hi: 'भाषा चुनें', mr: 'भाषा निवडा', pa: 'ਭਾਸ਼ਾ ਚੁਣੋ', kn: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ', te: 'భాషను ఎంచుకోండి', gu: 'ભાષા પસંદ કરો' },
    ph_pass: { en: 'Min 6 characters', hi: 'न्यूनतम 6 अंक/अक्षर', mr: 'किमान ६ वर्ण', pa: 'ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰ', kn: 'ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು', te: 'కనీసం 6 అక్షరాలు', gu: 'ઓછામાં ઓછા 6 અક્ષરો' },
    ph_land: { en: 'e.g. 4.5', hi: 'उदा. 4.5', mr: 'उदा. 4.5', pa: 'ਉਦਾ. 4.5', kn: 'ಉದಾ. 4.5', te: 'ఉదా. 4.5', gu: 'દા.ત. 4.5' },
    btn_wait: { en: 'Please wait…', hi: 'कृपया प्रतीक्षा करें…', mr: 'कृपया प्रतीक्षा करा…', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ…', kn: 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ…', te: 'దయచేసి వేచి ఉండండి…', gu: 'કૃપા કરીને રાહ જુઓ…' },
    btn_welcome_check: { en: 'Welcome ✓', hi: 'स्वागत है ✓', mr: 'स्वागत आहे ✓', pa: 'ਸੁਆਗਤ ਹੈ ✓', kn: 'ಸ್ವಾಗತ ✓', te: 'స్వాగతం ✓', gu: 'સ્વાગત છે ✓' },
    btn_new_pool: { en: '+ New Pool', hi: '+ नया समूह', mr: '+ नवीन गट', pa: '+ ਨਵਾਂ ਪੂਲ', kn: '+ ಹೊಸ ಪೂಲ್', te: '+ కొత్త పూల్', gu: '+ નવું જૂથ' },
    greeting_fmt: { en: 'Welcome, {name} 🙏', hi: 'नमस्ते, {name} जी 🙏', mr: 'नमस्कार, {name} 🙏', pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, {name} 🙏', kn: 'ನಮಸ್ಕಾರ, {name} 🙏', te: 'నమస్కారం, {name} 🙏', gu: 'નમસ્તે, {name} 🙏' }
  };

  let current = localStorage.getItem('hc_lang') || 'en';

  function getLang() { return current; }

  function t(key) {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[current] || entry.en || entry.hi || key;
  }

  function setLang(code) {
    if (!LANGS.some((l) => l.code === code)) code = 'en';
    current = code;
    localStorage.setItem('hc_lang', code);
    document.documentElement.lang = code;
    applyPage(document);
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  }

  // Scans all elements with data-i18n and updates them immediately
  function applyPage(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (val) {
        if (val.includes('<') && val.includes('>')) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    root.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.dataset.i18nPh;
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    // Sync any language pickers in DOM
    root.querySelectorAll('.lang-picker-select, #lang-picker').forEach((sel) => {
      sel.value = current;
    });
  }

  function selectorHtml(extraClass = '') {
    return `<div class="lang-selector ${extraClass}" aria-label="Select preferred language">
      <span class="lang-icon" aria-hidden="true">🌐</span>
      <select class="lang-picker-select" aria-label="Preferred Language">
        ${LANGS.map((l) => `<option value="${l.code}" ${l.code === current ? 'selected' : ''}>${l.label} (${l.sub})</option>`).join('')}
      </select>
    </div>`;
  }

  function attachPicker(root = document) {
    root.querySelectorAll('.lang-picker-select, #lang-picker').forEach((picker) => {
      picker.value = current;
      picker.onchange = (e) => setLang(e.target.value);
    });
  }

  // Auto-init on script load
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.documentElement) document.documentElement.lang = current;
      applyPage(document);
      attachPicker(document);
    });
  }

  return { LANGS, getLang, setLang, t, applyPage, selectorHtml, attachPicker, attachPickers: attachPicker };
})();
