// ===== i18n translations =====
const TRANSLATIONS = {
  en: {
    // Topbar
    'topbar.address': 'Bar Road, Batticaloa, Sri Lanka',
    'topbar.hours': 'Mon–Sat: 8:30 AM – 7:00 PM',
    'topbar.login': 'Member Login',
    // Nav
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.collections': 'Collections',
    'nav.catalog': 'Catalog',
    'nav.services': 'Services',
    'nav.events': 'Events',
    'nav.help': 'Help',
    'nav.contact': 'Contact',
    'nav.join': 'Join Library',
    // Header brand
    'brand.name': 'Batticaloa Public Library',
    'brand.tagline': 'Knowledge · Heritage · Innovation',
    // Footer
    'footer.desc': 'A modern, integrated knowledge hub serving the Eastern Province with digital catalogs, research support, and community programs since 1972.',
    'footer.explore': 'Explore',
    'footer.members': 'Members',
    'footer.visit': 'Visit Us',
    'footer.about': 'About Us',
    'footer.collections': 'Collections',
    'footer.catalog': 'Search Catalog',
    'footer.events': 'Events & Programs',
    'footer.services': 'Services',
    'footer.join': 'Join the Library',
    'footer.login': 'Member Login',
    'footer.dashboard': 'My Dashboard',
    'footer.help': 'Help & FAQ',
    'footer.ask': 'Ask a Librarian',
    'footer.opac': 'Koha OPAC ↗',
    'footer.address1': 'Bar Road, Batticaloa',
    'footer.address2': 'Sri Lanka 30000',
    'footer.hours': 'Mon–Sat: 8:30 AM – 7:00 PM',
    'footer.closed': 'Sunday & Holidays: Closed',
    'footer.privacy': 'Privacy Policy',
    'footer.accessibility': 'Accessibility (WCAG 2.1)',
    'footer.staff': 'Staff Portal',
    // Home page
    'home.hero.title': 'Knowledge for Every Citizen',
    'home.hero.desc': 'Welcome to the Batticaloa Public Library — your unified gateway to thousands of books, digital archives, research support, and community programs serving the Eastern Province.',
    'home.hero.placeholder': 'Search books by title, author, ISBN, or subject…',
    'home.hero.search': 'Search Catalog',
    'home.hero.note': 'Searches the integrated Koha OPAC across <strong>Batticaloa Public Library</strong>, <strong>Eastern University</strong> and partner libraries.',
    'home.hero.browse': '→ Browse our digital catalog',
    'home.stats.titles': 'Titles in Catalog',
    'home.stats.members': 'Active Members',
    'home.stats.programs': 'Programs This Year',
    'home.stats.catalogs': 'Connected Catalogs',
    'home.announcements.eyebrow': 'Announcements & News',
    'home.announcements.title': 'Stay Informed',
    'home.announcements.desc': 'Latest notices, service updates and community programs from your library.',
    'home.arrivals.eyebrow': 'Just In',
    'home.arrivals.title': 'New Arrivals',
    'home.arrivals.desc': 'The latest titles added to our shelves this week.',
    'home.arrivals.browse': 'Browse Full Catalog →',
    'home.services.eyebrow': 'Library Services',
    'home.services.title': 'What We Offer',
    'home.services.desc': 'Comprehensive services for students, researchers, families and the community.',
    'home.services.lending': 'Lending & Reference',
    'home.services.lending.desc': 'Borrow from our 50,000+ titles or access our reference and research collections.',
    'home.services.digital': 'Digital Services',
    'home.services.digital.desc': 'Free Wi-Fi, computer access, e-document delivery and online research databases.',
    'home.services.programs': 'Programs & Events',
    'home.services.programs.desc': 'Workshops, author meets, children\'s storytime and community learning programs.',
    'home.services.maker': 'Maker Space',
    'home.services.maker.desc': 'Hands-on innovation space with 3D printers, electronics kits and design tools.',
    'home.services.all': 'View All Services →',
    'home.events.eyebrow': 'Upcoming',
    'home.events.title': 'Programs & Events',
    'home.events.desc': 'Join us for workshops, exhibitions, training and community gatherings.',
    'home.events.all': 'View All Events →',
    'home.mission.eyebrow': 'Our Mission',
    'home.mission.title': 'A Modern Knowledge Hub for Batticaloa',
    'home.mission.desc': 'For over five decades, the Batticaloa Public Library has served as the cultural and intellectual heart of the Eastern Province. Today, we are transforming into a fully digital, integrated library — connecting Koha catalogs, the Eastern University Library, and Open Library to bring the world\'s knowledge to every citizen.',
    'home.mission.f1': 'Integrated catalog spanning multiple libraries',
    'home.mission.f2': 'Multilingual services in English, Tamil, and Sinhala',
    'home.mission.f3': 'Digital archive of local heritage and rare manuscripts',
    'home.mission.f4': 'Free programs for students, seniors, and researchers',
    'home.mission.f5': 'Accessible to all — WCAG 2.1 compliant platform',
    'home.mission.btn': 'Learn About Us →',
    'home.cta.title': 'Become a Member Today',
    'home.cta.desc': 'Annual membership is just LKR 500 for adults, free for students and seniors. Get borrowing privileges, event access, computer use, and full digital library access.',
    'home.cta.join': 'Join the Library',
    'home.cta.benefits': 'Membership Benefits',
    // About page
    'about.hero.title': 'About the Library',
    'about.hero.desc': 'Serving the Eastern Province since 1972 — preserving heritage, empowering communities.',
    'about.story.eyebrow': 'Our Story',
    'about.story.title': 'A Heritage of Learning',
    'about.story.p1': 'Established in 1972, the Batticaloa Public Library has grown from a modest reading room into a comprehensive knowledge institution. Through decades of social change and rebuilding, the library has remained a steadfast home for readers, researchers, students and dreamers across the Eastern Province.',
    'about.story.p2': 'Today, in partnership with the <strong>Eastern University</strong> and the Municipal Council, we are completing a digital transformation that brings together multiple library systems under one platform — making knowledge truly accessible to all.',
    'about.vmv.eyebrow': 'Vision & Mission',
    'about.vmv.title': 'Our Purpose',
    'about.vision.title': 'Vision',
    'about.vision.desc': 'To be a modern, digitally connected, community-centered knowledge hub that promotes lifelong learning, research, innovation and cultural preservation.',
    'about.mission.title': 'Mission',
    'about.mission.desc': 'To provide free and equitable access to information, learning resources and cultural heritage for every member of the Batticaloa community.',
    'about.values.title': 'Values',
    'about.values.desc': 'Inclusivity, integrity, accessibility, intellectual freedom, community service, and continuous innovation in library services.',
    'about.timeline.eyebrow': 'Our Journey',
    'about.timeline.title': 'Historical Milestones',
    'about.hours.eyebrow': 'Find Us',
    'about.hours.title': 'Hours & Location',
    'about.hours.branch': 'Main Branch — Bar Road',
    'about.hours.address': 'Bar Road, Batticaloa 30000, Eastern Province, Sri Lanka',
    'about.hours.schedule': 'Opening Hours',
    'about.hours.branches': 'Our Branches',
    'about.leadership.eyebrow': 'Governance',
    'about.leadership.title': 'Leadership & Staff',
    'about.cta.title': 'Be Part of Our Story',
    'about.cta.desc': 'Join thousands of members who call Batticaloa Public Library their intellectual home.',
    'about.cta.join': 'Join the Library',
    'about.cta.contact': 'Get in Touch',
    // Catalog page
    'catalog.hero.title': 'Search the Catalog',
    'catalog.hero.desc': 'Browse our local digital catalog or search the integrated Koha OPAC across multiple libraries.',
    'catalog.placeholder': 'Search title, author, ISBN, description…',
    'catalog.search': 'Search',
    'catalog.available': 'Available only',
    'catalog.sort': 'Sort:',
    'catalog.sort.newest': 'Newest First',
    'catalog.sort.title': 'Title A–Z',
    'catalog.sort.author': 'Author A–Z',
    'catalog.loading': 'Loading…',
    'catalog.opac.btn': 'Open Koha OPAC ↗',
    'catalog.opac.text': 'Search Eastern University & partner libraries directly:',
    'catalog.opac.placeholder': 'Search all connected libraries…',
    'catalog.opac.search': 'Search OPAC ↗',
    // Collections page
    'collections.hero.title': 'Our Collections',
    'collections.hero.desc': 'Over 50,000 titles spanning multiple languages and disciplines — from everyday lending to rare manuscripts.',
    'collections.lending.title': 'Lending Collection',
    'collections.lending.desc': 'Our largest collection — fiction, non-fiction, biographies and reference works available for borrowing. Standard loan period: 14 days, renewable up to 2 times.',
    'collections.reference.title': 'Reference Collection',
    'collections.reference.desc': 'Encyclopedias, dictionaries, scholarly journals and academic resources. In-library use only. Citation support and research consultations available.',
    'collections.periodicals.title': 'Periodicals & Journals',
    'collections.periodicals.desc': 'Daily newspapers, weekly magazines and academic journals in Tamil, Sinhala and English. Digital subscriptions and full-text archive access.',
    'collections.special.title': 'Special Collections',
    'collections.special.desc': 'Rare books, local authors, Sri Lankan heritage materials, and digitized manuscripts. Includes an exclusive collection on Eastern Province history and culture.',
    'collections.digital.title': 'Digital & E-Resources',
    'collections.digital.desc': 'E-books, audiobooks, online databases, digitized newspapers, and research repositories. Accessible 24/7 to all members from any device.',
    'collections.children.title': 'Children\'s Collection',
    'collections.children.desc': 'Picture books, early readers, children\'s literature and educational resources. Dedicated children\'s branch at Kallady with weekly storytime programs.',
    'collections.standards.eyebrow': 'Standards',
    'collections.standards.title': 'Built on International Standards',
    'collections.standards.desc': 'Our collections use internationally recognized cataloging systems for interoperability and discoverability across partner libraries.',
    'collections.cta.title': 'Start Exploring Today',
    'collections.cta.desc': 'Search our catalog or visit any branch to discover our full collections.',
    'collections.cta.catalog': 'Search the Catalog',
    'collections.cta.join': 'Become a Member',
    // Services page
    'services.hero.title': 'Library Services',
    'services.hero.desc': 'Free and low-cost services that empower learning, research, and community engagement.',
    'services.what.eyebrow': 'What We Offer',
    'services.what.title': 'Services for Everyone',
    'services.what.desc': 'From lending books to running a 3D printer — discover everything the library has for you.',
    'services.join.title': 'Join the Library',
    'services.join.desc': 'Online membership registration with same-day approval. Annual renewal supported. Student membership is free.',
    'services.join.btn': 'Register Now',
    'services.research.title': 'Research Support',
    'services.research.desc': 'Book a consultation with a librarian for citation guidance, database access, and research strategies.',
    'services.research.btn': 'Ask a Librarian',
    'services.delivery.title': 'Document Delivery',
    'services.delivery.desc': 'Request scanned articles or chapters by email or secure download. Copyright-compliant service.',
    'services.internet.title': 'Internet & Computers',
    'services.internet.desc': 'Free high-speed Wi-Fi and 20+ public-access workstations throughout the library. Booking recommended.',
    'services.maker.title': 'Maker Space',
    'services.maker.desc': '3D printers, electronics workstations, and innovation kits. Workshops held every Saturday at 10 AM.',
    'services.print.title': 'Print, Copy & Scan',
    'services.print.desc': 'Affordable printing, photocopying, and scanning services. Pay as you go — LKR 5/page B&W.',
    'services.workshops.title': 'Workshops & Training',
    'services.workshops.desc': 'Digital literacy, language classes, and skill-building programs for all ages. Most are free to attend.',
    'services.volunteer.title': 'Volunteer Programs',
    'services.volunteer.desc': 'Support community outreach, children\'s programs, and digitization projects as a library volunteer.',
    'services.volunteer.btn': 'Get Involved',
    'services.donations.title': 'Donations',
    'services.donations.desc': 'Donate books or contribute to our acquisitions fund. Tax-deductible receipts provided for all donations.',
    'services.membership.eyebrow': 'Membership',
    'services.membership.title': 'Choose Your Plan',
    'services.membership.desc': 'Memberships are open to all residents of the Eastern Province and visiting researchers.',
    'services.cta.title': 'Ready to Get Started?',
    'services.cta.desc': 'Registration takes just a few minutes. Start borrowing, learning, and connecting today.',
    'services.cta.join': 'Join the Library',
    'services.cta.questions': 'Have Questions?',
    // Events page
    'events.hero.title': 'Programs & Events',
    'events.hero.desc': 'Workshops, exhibitions, story times, author meets and more — free to attend, open to all.',
    'events.filter.all': 'All Events',
    'events.filter.upcoming': 'Upcoming',
    'events.filter.workshop': 'Workshops',
    'events.filter.children': 'Children',
    'events.filter.author': 'Author Meets',
    'events.filter.training': 'Training',
    'events.filter.exhibition': 'Exhibitions',
    // Contact page
    'contact.hero.title': 'Contact Us',
    'contact.hero.desc': 'Questions, feedback, research help or general inquiries — we\'d love to hear from you.',
    'contact.info.title': 'Get in Touch',
    'contact.info.desc': 'Reach out by phone, email, or use the form. We respond to all inquiries within 24 hours.',
    'contact.address.title': 'Address',
    'contact.phone.title': 'Phone & Email',
    'contact.hours.title': 'Opening Hours',
    'contact.emergency.title': 'After-Hours Emergency',
    'contact.form.title': 'Send a Message',
    'contact.form.name': 'Full Name *',
    'contact.form.email': 'Email Address *',
    'contact.form.phone': 'Phone Number',
    'contact.form.dept': 'Department',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message *',
    'contact.form.submit': 'Send Message',
    'contact.map.eyebrow': 'Find Us',
    'contact.map.title': 'Visit the Library',
    // Help page
    'help.hero.title': 'Help & Support',
    'help.hero.desc': 'Tutorials, FAQs, and direct support to help you get the most from your library.',
    'help.links.catalog': 'Search Catalog',
    'help.links.join': 'Join Library',
    'help.links.login': 'Member Login',
    'help.links.ask': 'Ask a Librarian',
    'help.faq.eyebrow': 'FAQ',
    'help.faq.title': 'Frequently Asked Questions',
    'help.resources.eyebrow': 'Resources',
    'help.resources.title': 'Tutorials & Guides',
    // Login/Register pages
    'login.title': 'Member Login',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.submit': 'Sign In',
    'login.forgot': 'Forgot password?',
    'login.noaccount': 'Not a member yet?',
    'login.register': 'Join the Library',
    'register.title': 'Join the Library',
    'register.name': 'Full Name',
    'register.email': 'Email Address',
    'register.phone': 'Phone Number',
    'register.address': 'Address',
    'register.password': 'Password',
    'register.submit': 'Create Account',
    'register.have': 'Already a member?',
    'register.login': 'Sign in',
    // Common
    'common.home': 'Home',
    'common.loading': 'Loading…',
    'common.browse': 'Browse →',
    'common.search': 'Search',
    'common.available': 'Available',
    'common.onloan': 'On Loan',
    'common.noevents': 'No upcoming events',
    'common.noannouncements': 'No announcements',
    'common.checkback': 'Check back soon.',
  },

  ta: {
    // Topbar
    'topbar.address': 'பார் சாலை, மட்டக்களப்பு, இலங்கை',
    'topbar.hours': 'திங்கள்–சனி: காலை 8:30 – மாலை 7:00',
    'topbar.login': 'உறுப்பினர் உள்நுழைவு',
    // Nav
    'nav.home': 'முகப்பு',
    'nav.about': 'எங்களைப் பற்றி',
    'nav.collections': 'தொகுப்புகள்',
    'nav.catalog': 'பட்டியல்',
    'nav.services': 'சேவைகள்',
    'nav.events': 'நிகழ்வுகள்',
    'nav.help': 'உதவி',
    'nav.contact': 'தொடர்பு',
    'nav.join': 'நூலகத்தில் சேருங்கள்',
    // Header brand
    'brand.name': 'மட்டக்களப்பு பொது நூலகம்',
    'brand.tagline': 'அறிவு · பாரம்பரியம் · புதுமை',
    // Footer
    'footer.desc': '1972 ஆம் ஆண்டு முதல் கிழக்கு மாகாணத்திற்கு சேவை செய்யும் நவீன, ஒருங்கிணைந்த அறிவு மையம்.',
    'footer.explore': 'ஆராயுங்கள்',
    'footer.members': 'உறுப்பினர்கள்',
    'footer.visit': 'வருகை தாருங்கள்',
    'footer.about': 'எங்களைப் பற்றி',
    'footer.collections': 'தொகுப்புகள்',
    'footer.catalog': 'பட்டியலில் தேடுங்கள்',
    'footer.events': 'நிகழ்வுகள் & திட்டங்கள்',
    'footer.services': 'சேவைகள்',
    'footer.join': 'நூலகத்தில் சேருங்கள்',
    'footer.login': 'உறுப்பினர் உள்நுழைவு',
    'footer.dashboard': 'என் டாஷ்போர்டு',
    'footer.help': 'உதவி & கேள்விகள்',
    'footer.ask': 'நூலகரிடம் கேளுங்கள்',
    'footer.opac': 'Koha OPAC ↗',
    'footer.address1': 'பார் சாலை, மட்டக்களப்பு',
    'footer.address2': 'இலங்கை 30000',
    'footer.hours': 'திங்கள்–சனி: காலை 8:30 – மாலை 7:00',
    'footer.closed': 'ஞாயிறு & விடுமுறை நாட்கள்: மூடப்பட்டிருக்கும்',
    'footer.privacy': 'தனியுரிமைக் கொள்கை',
    'footer.accessibility': 'அணுகல்தன்மை (WCAG 2.1)',
    'footer.staff': 'ஊழியர் போர்டல்',
    // Home page
    'home.hero.title': 'ஒவ்வொரு குடிமகனுக்கும் அறிவு',
    'home.hero.desc': 'மட்டக்களப்பு பொது நூலகத்திற்கு வரவேற்கிறோம் — கிழக்கு மாகாணத்திற்கு சேவை செய்யும் ஆயிரக்கணக்கான புத்தகங்கள், டிஜிட்டல் காப்பகங்கள், ஆராய்ச்சி ஆதரவு மற்றும் சமுதாய திட்டங்களுக்கான உங்கள் ஒருங்கிணைந்த நுழைவாயில்.',
    'home.hero.placeholder': 'தலைப்பு, ஆசிரியர், ISBN அல்லது பொருளால் புத்தகங்களை தேடுங்கள்…',
    'home.hero.search': 'பட்டியலில் தேடுங்கள்',
    'home.hero.note': 'ஒருங்கிணைந்த Koha OPAC மூலம் <strong>மட்டக்களப்பு பொது நூலகம்</strong>, <strong>கிழக்கு பல்கலைக்கழகம்</strong> மற்றும் கூட்டாளி நூலகங்களில் தேடுகிறது.',
    'home.hero.browse': '→ எங்கள் டிஜிட்டல் பட்டியலை உலாவுங்கள்',
    'home.stats.titles': 'பட்டியலில் தலைப்புகள்',
    'home.stats.members': 'செயலில் உள்ள உறுப்பினர்கள்',
    'home.stats.programs': 'இந்த ஆண்டு திட்டங்கள்',
    'home.stats.catalogs': 'இணைக்கப்பட்ட பட்டியல்கள்',
    'home.announcements.eyebrow': 'அறிவிப்புகள் & செய்திகள்',
    'home.announcements.title': 'தகவலுடன் இருங்கள்',
    'home.announcements.desc': 'உங்கள் நூலகத்திலிருந்து சமீபத்திய அறிவிப்புகள், சேவை புதுப்பிப்புகள் மற்றும் சமுதாய திட்டங்கள்.',
    'home.arrivals.eyebrow': 'புதிதாக வந்தவை',
    'home.arrivals.title': 'புதிய வருகைகள்',
    'home.arrivals.desc': 'இந்த வாரம் எங்கள் அலமாரிகளில் சேர்க்கப்பட்ட சமீபத்திய தலைப்புகள்.',
    'home.arrivals.browse': 'முழு பட்டியலை உலாவுங்கள் →',
    'home.services.eyebrow': 'நூலக சேவைகள்',
    'home.services.title': 'நாங்கள் என்ன வழங்குகிறோம்',
    'home.services.desc': 'மாணவர்கள், ஆராய்ச்சியாளர்கள், குடும்பங்கள் மற்றும் சமுதாயத்திற்கான விரிவான சேவைகள்.',
    'home.services.lending': 'கடன் & குறிப்பு',
    'home.services.lending.desc': 'எங்கள் 50,000+ தலைப்புகளிலிருந்து கடன் வாங்குங்கள் அல்லது எங்கள் குறிப்பு மற்றும் ஆராய்ச்சி தொகுப்புகளை அணுகுங்கள்.',
    'home.services.digital': 'டிஜிட்டல் சேவைகள்',
    'home.services.digital.desc': 'இலவச Wi-Fi, கணினி அணுகல், e-ஆவண டெலிவரி மற்றும் ஆன்லைன் ஆராய்ச்சி தரவுத்தளங்கள்.',
    'home.services.programs': 'திட்டங்கள் & நிகழ்வுகள்',
    'home.services.programs.desc': 'பட்டறைகள், ஆசிரியர் சந்திப்புகள், குழந்தைகள் கதை நேரம் மற்றும் சமுதாய கற்றல் திட்டங்கள்.',
    'home.services.maker': 'மேக்கர் ஸ்பேஸ்',
    'home.services.maker.desc': '3D பிரிண்டர்கள், மின்னணு கிட்கள் மற்றும் வடிவமைப்பு கருவிகளுடன் நடைமுறை கண்டுபிடிப்பு இடம்.',
    'home.services.all': 'அனைத்து சேவைகளையும் காணுங்கள் →',
    'home.events.eyebrow': 'வரவிருக்கும்',
    'home.events.title': 'திட்டங்கள் & நிகழ்வுகள்',
    'home.events.desc': 'பட்டறைகள், கண்காட்சிகள், பயிற்சி மற்றும் சமுதாய கூட்டங்களில் எங்களுடன் சேருங்கள்.',
    'home.events.all': 'அனைத்து நிகழ்வுகளையும் காணுங்கள் →',
    'home.mission.eyebrow': 'எங்கள் நோக்கம்',
    'home.mission.title': 'மட்டக்களப்புக்கான நவீன அறிவு மையம்',
    'home.mission.desc': 'ஐந்து தசாப்தங்களுக்கும் மேலாக, மட்டக்களப்பு பொது நூலகம் கிழக்கு மாகாணத்தின் கலாச்சார மற்றும் அறிவுசார் மையமாக சேவை செய்துள்ளது.',
    'home.mission.f1': 'பல நூலகங்களில் ஒருங்கிணைந்த பட்டியல்',
    'home.mission.f2': 'ஆங்கிலம், தமிழ் மற்றும் சிங்களத்தில் பன்மொழி சேவைகள்',
    'home.mission.f3': 'உள்ளூர் பாரம்பரியம் மற்றும் அரிய கையெழுத்துப் படைப்புகளின் டிஜிட்டல் காப்பகம்',
    'home.mission.f4': 'மாணவர்கள், முதியோர் மற்றும் ஆராய்ச்சியாளர்களுக்கான இலவச திட்டங்கள்',
    'home.mission.f5': 'அனைவருக்கும் அணுகக்கூடியது — WCAG 2.1 இணங்கிய தளம்',
    'home.mission.btn': 'எங்களைப் பற்றி அறியுங்கள் →',
    'home.cta.title': 'இன்றே உறுப்பினராகுங்கள்',
    'home.cta.desc': 'வயது வந்தோருக்கு ஆண்டு உறுப்பினர் கட்டணம் வெறும் ரூ. 500, மாணவர்கள் மற்றும் முதியோருக்கு இலவசம்.',
    'home.cta.join': 'நூலகத்தில் சேருங்கள்',
    'home.cta.benefits': 'உறுப்பினர் சலுகைகள்',
    // About page
    'about.hero.title': 'நூலகத்தைப் பற்றி',
    'about.hero.desc': '1972 முதல் கிழக்கு மாகாணத்திற்கு சேவை செய்கிறோம் — பாரம்பரியத்தை பாதுகாக்கிறோம், சமுதாயங்களை வலுப்படுத்துகிறோம்.',
    'about.story.eyebrow': 'எங்கள் கதை',
    'about.story.title': 'கற்றலின் பாரம்பரியம்',
    'about.story.p1': '1972 ல் நிறுவப்பட்ட மட்டக்களப்பு பொது நூலகம், ஒரு சிறிய வாசிப்பு அறையிலிருந்து ஒரு விரிவான அறிவு நிறுவனமாக வளர்ந்துள்ளது.',
    'about.story.p2': 'இன்று, <strong>கிழக்கு பல்கலைக்கழகம்</strong> மற்றும் நகராட்சி சபையுடன் இணைந்து, நாங்கள் ஒரு டிஜிட்டல் மாற்றத்தை முடித்துக்கொண்டிருக்கிறோம்.',
    'about.vmv.eyebrow': 'பார்வை & நோக்கம்',
    'about.vmv.title': 'எங்கள் நோக்கம்',
    'about.vision.title': 'பார்வை',
    'about.vision.desc': 'வாழ்நாள் முழுவதும் கற்றல், ஆராய்ச்சி, புதுமை மற்றும் கலாச்சார பாதுகாப்பை ஊக்குவிக்கும் நவீன, டிஜிட்டல் ரீதியில் இணைக்கப்பட்ட அறிவு மையமாக விளங்குவது.',
    'about.mission.title': 'நோக்கம்',
    'about.mission.desc': 'மட்டக்களப்பு சமுதாயத்தின் ஒவ்வொரு உறுப்பினருக்கும் தகவல், கற்றல் வளங்கள் மற்றும் கலாச்சார பாரம்பரியத்திற்கு இலவச மற்றும் சமத்துவமான அணுகலை வழங்குவது.',
    'about.values.title': 'மதிப்புகள்',
    'about.values.desc': 'உள்ளடக்கம், நேர்மை, அணுகல்தன்மை, அறிவுசார் சுதந்திரம், சமுதாய சேவை மற்றும் நூலக சேவைகளில் தொடர்ச்சியான புதுமை.',
    'about.timeline.eyebrow': 'எங்கள் பயணம்',
    'about.timeline.title': 'வரலாற்று மைல்கற்கள்',
    'about.hours.eyebrow': 'எங்களை கண்டுபிடியுங்கள்',
    'about.hours.title': 'நேரங்கள் & இடம்',
    'about.hours.branch': 'பிரதான கிளை — பார் சாலை',
    'about.hours.address': 'பார் சாலை, மட்டக்களப்பு 30000, கிழக்கு மாகாணம், இலங்கை',
    'about.hours.schedule': 'திறக்கும் நேரங்கள்',
    'about.hours.branches': 'எங்கள் கிளைகள்',
    'about.leadership.eyebrow': 'நிர்வாகம்',
    'about.leadership.title': 'தலைமை & ஊழியர்கள்',
    'about.cta.title': 'எங்கள் கதையின் ஒரு பகுதியாகுங்கள்',
    'about.cta.desc': 'மட்டக்களப்பு பொது நூலகத்தை தங்கள் அறிவுசார் இல்லமாக கொண்ட ஆயிரக்கணக்கான உறுப்பினர்களுடன் சேருங்கள்.',
    'about.cta.join': 'நூலகத்தில் சேருங்கள்',
    'about.cta.contact': 'தொடர்பு கொள்ளுங்கள்',
    // Catalog page
    'catalog.hero.title': 'பட்டியலில் தேடுங்கள்',
    'catalog.hero.desc': 'எங்கள் உள்ளூர் டிஜிட்டல் பட்டியலை உலாவுங்கள் அல்லது பல நூலகங்களில் ஒருங்கிணைந்த Koha OPAC ஐ தேடுங்கள்.',
    'catalog.placeholder': 'தலைப்பு, ஆசிரியர், ISBN, விளக்கம் தேடுங்கள்…',
    'catalog.search': 'தேடு',
    'catalog.available': 'கிடைக்கும் மட்டும்',
    'catalog.sort': 'வரிசை:',
    'catalog.sort.newest': 'புதியது முதல்',
    'catalog.sort.title': 'தலைப்பு அ–ஆ',
    'catalog.sort.author': 'ஆசிரியர் அ–ஆ',
    'catalog.loading': 'ஏற்றுகிறது…',
    'catalog.opac.btn': 'Koha OPAC திற ↗',
    'catalog.opac.text': 'கிழக்கு பல்கலைக்கழகம் & கூட்டாளி நூலகங்களை நேரடியாக தேடுங்கள்:',
    'catalog.opac.placeholder': 'அனைத்து இணைக்கப்பட்ட நூலகங்களில் தேடுங்கள்…',
    'catalog.opac.search': 'OPAC தேடு ↗',
    // Collections page
    'collections.hero.title': 'எங்கள் தொகுப்புகள்',
    'collections.hero.desc': 'பல மொழிகள் மற்றும் துறைகளில் 50,000+ தலைப்புகள் — அன்றாட கடன் முதல் அரிய கையெழுத்துப் படைப்புகள் வரை.',
    'collections.lending.title': 'கடன் தொகுப்பு',
    'collections.lending.desc': 'எங்களின் மிகப் பெரிய தொகுப்பு — கடன் வாங்குவதற்கு கதைகள், கதை அல்லாதவை, வாழ்க்கை வரலாறுகள் மற்றும் குறிப்பு படைப்புகள். நிலையான கடன் காலம்: 14 நாட்கள், 2 முறை வரை புதுப்பிக்கலாம்.',
    'collections.reference.title': 'குறிப்பு தொகுப்பு',
    'collections.reference.desc': 'கலைக்களஞ்சியங்கள், அகராதிகள், அறிவியல் பத்திரிகைகள் மற்றும் கல்வி வளங்கள். நூலக உள்ளே மட்டுமே பயன்படுத்தலாம்.',
    'collections.periodicals.title': 'பத்திரிகைகள் & இதழ்கள்',
    'collections.periodicals.desc': 'தமிழ், சிங்கள மற்றும் ஆங்கிலத்தில் தினசரி செய்தித்தாள்கள், வாராந்திர இதழ்கள் மற்றும் கல்வி பத்திரிகைகள்.',
    'collections.special.title': 'சிறப்பு தொகுப்புகள்',
    'collections.special.desc': 'அரிய புத்தகங்கள், உள்ளூர் ஆசிரியர்கள், இலங்கை பாரம்பரிய பொருட்கள் மற்றும் டிஜிட்டல் மயமாக்கப்பட்ட கையெழுத்துப் படைப்புகள்.',
    'collections.digital.title': 'டிஜிட்டல் & இ-வளங்கள்',
    'collections.digital.desc': 'இ-புத்தகங்கள், ஆடியோபுக்குகள், ஆன்லைன் தரவுத்தளங்கள், டிஜிட்டல் செய்தித்தாள்கள் மற்றும் ஆராய்ச்சி களஞ்சியங்கள். உறுப்பினர்களுக்கு எந்த சாதனத்திலிருந்தும் 24/7 அணுகல்.',
    'collections.children.title': 'குழந்தைகள் தொகுப்பு',
    'collections.children.desc': 'படங்கள் புத்தகங்கள், ஆரம்ப வாசிப்பாளர்கள், குழந்தை இலக்கியம் மற்றும் கல்வி வளங்கள். வாராந்திர கதை நேரத்துடன் கள்ளாடியில் அர்ப்பணிப்பான குழந்தைகள் கிளை.',
    'collections.standards.eyebrow': 'தரநிலைகள்',
    'collections.standards.title': 'சர்வதேச தரநிலைகளில் கட்டமைக்கப்பட்டது',
    'collections.standards.desc': 'எங்கள் தொகுப்புகள் கூட்டாளி நூலகங்களில் இயக்கியமைப்பு மற்றும் கண்டுபிடிப்பிற்கு சர்வதேசமாக அங்கீகரிக்கப்பட்ட வகைப்படுத்தல் அமைப்புகளை பயன்படுத்துகின்றன.',
    'collections.cta.title': 'இன்றே ஆராய ஆரம்பியுங்கள்',
    'collections.cta.desc': 'எங்கள் முழு தொகுப்புகளை கண்டுபிடிக்க பட்டியலில் தேடுங்கள் அல்லது எந்த கிளையையும் வருகை தாருங்கள்.',
    'collections.cta.catalog': 'பட்டியலில் தேடுங்கள்',
    'collections.cta.join': 'உறுப்பினராகுங்கள்',
    // Services page
    'services.hero.title': 'நூலக சேவைகள்',
    'services.hero.desc': 'கற்றல், ஆராய்ச்சி மற்றும் சமுதாய ஈடுபாட்டை வலுப்படுத்தும் இலவச மற்றும் குறைந்த விலை சேவைகள்.',
    'services.what.eyebrow': 'நாங்கள் என்ன வழங்குகிறோம்',
    'services.what.title': 'அனைவருக்கும் சேவைகள்',
    'services.what.desc': 'புத்தகங்கள் கடன் வாங்குவதிலிருந்து 3D பிரிண்டர் இயக்குவது வரை — நூலகம் உங்களுக்கு என்ன வழங்குகிறது என்பதை கண்டுபிடியுங்கள்.',
    'services.join.title': 'நூலகத்தில் சேருங்கள்',
    'services.join.desc': 'அதே நாள் அனுமோதனத்துடன் ஆன்லைன் உறுப்பினர் பதிவு. மாணவர் உறுப்பினர் இலவசம்.',
    'services.join.btn': 'இப்போதே பதிவு செய்யுங்கள்',
    'services.research.title': 'ஆராய்ச்சி ஆதரவு',
    'services.research.desc': 'மேற்கோள் வழிகாட்டுதல், தரவுத்தள அணுகல் மற்றும் ஆராய்ச்சி உத்திகளுக்கு நூலகரிடம் ஆலோசனை பதிவு செய்யுங்கள்.',
    'services.research.btn': 'நூலகரிடம் கேளுங்கள்',
    'services.delivery.title': 'ஆவண வழங்கல்',
    'services.delivery.desc': 'மின்னஞ்சல் அல்லது பாதுகாப்பான பதிவிறக்கம் மூலம் ஸ்கேன் செய்யப்பட்ட கட்டுரைகள் அல்லது அத்தியாயங்களை கோருங்கள்.',
    'services.internet.title': 'இணையம் & கணினிகள்',
    'services.internet.desc': 'இலவச அதிவேக Wi-Fi மற்றும் நூலகம் முழுவதும் 20+ பொது அணுகல் பணிநிலையங்கள். முன்பதிவு பரிந்துரைக்கப்படுகிறது.',
    'services.maker.title': 'மேக்கர் ஸ்பேஸ்',
    'services.maker.desc': '3D பிரிண்டர்கள், மின்னணு பணிநிலையங்கள் மற்றும் கண்டுபிடிப்பு கிட்கள். ஒவ்வொரு சனிக்கிழமையும் காலை 10 மணிக்கு பட்டறைகள்.',
    'services.print.title': 'அச்சிடு, நகல் & ஸ்கேன்',
    'services.print.desc': 'மலிவான அச்சிடல், நகலெடுத்தல் மற்றும் ஸ்கேனிங் சேவைகள். பயன்படுத்தியதற்கேற்ப செலுத்துங்கள் — ரூ. 5/பக்கம் கறுப்பு-வெள்ளை.',
    'services.workshops.title': 'பட்டறைகள் & பயிற்சி',
    'services.workshops.desc': 'அனைத்து வயதினருக்கும் டிஜிட்டல் கல்வியறிவு, மொழி வகுப்புகள் மற்றும் திறன் வளர்ச்சி திட்டங்கள். பெரும்பாலும் இலவசம்.',
    'services.volunteer.title': 'தன்னார்வ திட்டங்கள்',
    'services.volunteer.desc': 'நூலக தன்னார்வராக சமுதாய விளைவுகள், குழந்தைகள் திட்டங்கள் மற்றும் டிஜிட்டல் மயமாக்கல் திட்டங்களை ஆதரிக்கவும்.',
    'services.volunteer.btn': 'ஈடுபடுங்கள்',
    'services.donations.title': 'நன்கொடைகள்',
    'services.donations.desc': 'புத்தகங்களை நன்கொடை செய்யுங்கள் அல்லது எங்கள் கையகப்படுத்தல் நிதிக்கு பங்களியுங்கள். அனைத்து நன்கொடைகளுக்கும் வரி விலக்கு ரசீது வழங்கப்படும்.',
    'services.membership.eyebrow': 'உறுப்பினர்',
    'services.membership.title': 'உங்கள் திட்டத்தை தேர்ந்தெடுங்கள்',
    'services.membership.desc': 'கிழக்கு மாகாணத்தின் அனைத்து குடியிருப்பாளர்களுக்கும் மற்றும் வருகை தரும் ஆராய்ச்சியாளர்களுக்கும் உறுப்பினர் திறந்திருக்கிறது.',
    'services.cta.title': 'தொடங்க தயாரா?',
    'services.cta.desc': 'பதிவு செய்ய சில நிமிடங்கள் மட்டுமே ஆகும். இன்றே கடன் வாங்க, கற்க மற்றும் இணையத் தொடங்குங்கள்.',
    'services.cta.join': 'நூலகத்தில் சேருங்கள்',
    'services.cta.questions': 'கேள்விகள் இருக்கிறதா?',
    // Events page
    'events.hero.title': 'திட்டங்கள் & நிகழ்வுகள்',
    'events.hero.desc': 'பட்டறைகள், கண்காட்சிகள், கதை நேரங்கள், ஆசிரியர் சந்திப்புகள் மற்றும் பலவற்றை — கலந்துகொள்ள இலவசம், அனைவருக்கும் திறந்திருக்கும்.',
    'events.filter.all': 'அனைத்து நிகழ்வுகளும்',
    'events.filter.upcoming': 'வரவிருக்கும்',
    'events.filter.workshop': 'பட்டறைகள்',
    'events.filter.children': 'குழந்தைகள்',
    'events.filter.author': 'ஆசிரியர் சந்திப்புகள்',
    'events.filter.training': 'பயிற்சி',
    'events.filter.exhibition': 'கண்காட்சிகள்',
    // Contact page
    'contact.hero.title': 'தொடர்பு கொள்ளுங்கள்',
    'contact.hero.desc': 'கேள்விகள், கருத்துகள், ஆராய்ச்சி உதவி அல்லது பொது விசாரணைகள் — நாங்கள் உங்களிடமிருந்து கேட்க விரும்புகிறோம்.',
    'contact.info.title': 'தொடர்பில் இருங்கள்',
    'contact.info.desc': 'தொலைபேசி, மின்னஞ்சல் மூலம் அல்லது படிவத்தை பயன்படுத்தி தொடர்பு கொள்ளுங்கள். நாங்கள் 24 மணி நேரத்திற்குள் அனைத்து விசாரணைகளுக்கும் பதிலளிக்கிறோம்.',
    'contact.address.title': 'முகவரி',
    'contact.phone.title': 'தொலைபேசி & மின்னஞ்சல்',
    'contact.hours.title': 'திறக்கும் நேரங்கள்',
    'contact.emergency.title': 'நேரம் கடந்த அவசரகாலம்',
    'contact.form.title': 'ஒரு செய்தி அனுப்புங்கள்',
    'contact.form.name': 'முழு பெயர் *',
    'contact.form.email': 'மின்னஞ்சல் முகவரி *',
    'contact.form.phone': 'தொலைபேசி எண்',
    'contact.form.dept': 'துறை',
    'contact.form.subject': 'விஷயம்',
    'contact.form.message': 'செய்தி *',
    'contact.form.submit': 'செய்தி அனுப்புங்கள்',
    'contact.map.eyebrow': 'எங்களை கண்டுபிடியுங்கள்',
    'contact.map.title': 'நூலகத்தை வருகை தாருங்கள்',
    // Help page
    'help.hero.title': 'உதவி & ஆதரவு',
    'help.hero.desc': 'பயிற்சிகள், அடிக்கடி கேட்கப்படும் கேள்விகள் மற்றும் நூலகத்தை சிறப்பாக பயன்படுத்திக் கொள்ள நேரடி ஆதரவு.',
    'help.links.catalog': 'பட்டியலில் தேடுங்கள்',
    'help.links.join': 'நூலகத்தில் சேருங்கள்',
    'help.links.login': 'உறுப்பினர் உள்நுழைவு',
    'help.links.ask': 'நூலகரிடம் கேளுங்கள்',
    'help.faq.eyebrow': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'help.faq.title': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'help.resources.eyebrow': 'வளங்கள்',
    'help.resources.title': 'பயிற்சிகள் & வழிகாட்டிகள்',
    // Common
    'common.home': 'முகப்பு',
    'common.loading': 'ஏற்றுகிறது…',
    'common.browse': 'உலாவுங்கள் →',
    'common.search': 'தேடு',
    'common.available': 'கிடைக்கும்',
    'common.onloan': 'கடனில் உள்ளது',
    'common.noevents': 'வரவிருக்கும் நிகழ்வுகள் இல்லை',
    'common.noannouncements': 'அறிவிப்புகள் இல்லை',
    'common.checkback': 'விரைவில் மீண்டும் பார்க்கவும்.',
  },

  si: {
    // Topbar
    'topbar.address': 'බාර් පාර, මඩකලපුව, ශ්‍රී ලංකාව',
    'topbar.hours': 'සඳු–සෙන: ප.ව. 8:30 – ප.ව. 7:00',
    'topbar.login': 'සාමාජික පිවිසීම',
    // Nav
    'nav.home': 'මුල් පිටුව',
    'nav.about': 'අප ගැන',
    'nav.collections': 'එකතු',
    'nav.catalog': 'නාමාවලිය',
    'nav.services': 'සේවා',
    'nav.events': 'සිදුවීම්',
    'nav.help': 'උදව්',
    'nav.contact': 'සම්බන්ධ',
    'nav.join': 'පුස්තකාලයට එකතු වන්න',
    // Header brand
    'brand.name': 'මඩකලපුව මහජන පුස්තකාලය',
    'brand.tagline': 'දැනුම · උරුමය · නවෝත්පාදනය',
    // Footer
    'footer.desc': '1972 සිට නැගෙනහිර පළාතට සේවය කරන නවීන, ඒකාබද්ධ දැනුම් මධ්‍යස්ථානය.',
    'footer.explore': 'ගවේෂණය',
    'footer.members': 'සාමාජිකයන්',
    'footer.visit': 'අපට පැමිණෙන්න',
    'footer.about': 'අප ගැන',
    'footer.collections': 'එකතු',
    'footer.catalog': 'නාමාවලිය සෙවීම',
    'footer.events': 'සිදුවීම් & වැඩසටහන්',
    'footer.services': 'සේවා',
    'footer.join': 'පුස්තකාලයට එකතු වන්න',
    'footer.login': 'සාමාජික පිවිසීම',
    'footer.dashboard': 'මගේ පුවරුව',
    'footer.help': 'උදව් & FAQ',
    'footer.ask': 'පුස්තකාලාධිපතිගෙන් විමසන්න',
    'footer.opac': 'Koha OPAC ↗',
    'footer.address1': 'බාර් පාර, මඩකලපුව',
    'footer.address2': 'ශ්‍රී ලංකාව 30000',
    'footer.hours': 'සඳු–සෙන: ප.ව. 8:30 – ප.ව. 7:00',
    'footer.closed': 'ඉරිදා & නිවාඩු: වසා ඇත',
    'footer.privacy': 'රහස්‍යතා ප්‍රතිපත්තිය',
    'footer.accessibility': 'ප්‍රවේශ්‍යතාව (WCAG 2.1)',
    'footer.staff': 'කාර්ය මණ්ඩල ද්වාරය',
    // Home page
    'home.hero.title': 'සෑම පුරවැසියෙකුටම දැනුම',
    'home.hero.desc': 'මඩකලපුව මහජන පුස්තකාලයට සාදරයෙන් පිළිගනිමු — නැගෙනහිර පළාතට සේවය කරන දහස් ගණනක් පොත්, ඩිජිටල් ලේඛනාගාර, පර්යේෂණ සහාය සහ ප්‍රජා වැඩසටහන් සඳහා ඔබේ ඒකාබද්ධ ද්වාරය.',
    'home.hero.placeholder': 'මාතෘකාව, කර්තෘ, ISBN හෝ විෂය අනුව පොත් සොයන්න…',
    'home.hero.search': 'නාමාවලිය සොයන්න',
    'home.hero.note': 'ඒකාබද්ධ Koha OPAC හරහා <strong>මඩකලපුව මහජන පුස්තකාලය</strong>, <strong>නැගෙනහිර විශ්ව විද්‍යාලය</strong> සහ හවුල් පුස්තකාල හරහා සොයයි.',
    'home.hero.browse': '→ අපේ ඩිජිටල් නාමාවලිය පිරිසැලෙන්න',
    'home.stats.titles': 'නාමාවලියේ මාතෘකා',
    'home.stats.members': 'ක්‍රියාකාරී සාමාජිකයන්',
    'home.stats.programs': 'මෙ වසරේ වැඩසටහන්',
    'home.stats.catalogs': 'සම්බන්ධිත නාමාවලි',
    'home.announcements.eyebrow': 'නිවේදන & ප්‍රවෘත්ති',
    'home.announcements.title': 'දැනුවත් ව සිටින්න',
    'home.announcements.desc': 'ඔබේ පුස්තකාලයෙන් නවතම දැනුම්දීම්, සේවා යාවත්කාලීන සහ ප්‍රජා වැඩසටහන්.',
    'home.arrivals.eyebrow': 'අළුතෙන් ආ',
    'home.arrivals.title': 'නව පැමිණීම්',
    'home.arrivals.desc': 'මෙ සතියේ අපේ රාක්කවලට එකතු කළ නවතම මාතෘකා.',
    'home.arrivals.browse': 'සම්පූර්ණ නාමාවලිය බ්‍රවුස් කරන්න →',
    'home.services.eyebrow': 'පුස්තකාල සේවා',
    'home.services.title': 'අපි ලබා දෙන දේ',
    'home.services.desc': 'සිසුන්, පර්යේෂකයන්, පවුල් සහ ප්‍රජාව සඳහා සවිස්තරාත්මක සේවා.',
    'home.services.lending': 'ණය & මූලාශ්‍ර',
    'home.services.lending.desc': 'අපේ 50,000+ මාතෘකාවලින් ණයට ගන්න හෝ අපේ මූලාශ්‍ර සහ පර්යේෂණ එකතු වෙත ප්‍රවේශ වන්න.',
    'home.services.digital': 'ඩිජිටල් සේවා',
    'home.services.digital.desc': 'නොමිලේ Wi-Fi, පරිගණක ප්‍රවේශය, e-ලේඛන බෙදාහැරීම සහ මාර්ගගත පර්යේෂණ දත්ත ගබඩා.',
    'home.services.programs': 'වැඩසටහන් & සිදුවීම්',
    'home.services.programs.desc': 'වැඩමුළු, කර්තෘ හමුවීම්, ළමා කතා කාලය සහ ප්‍රජා ඉගෙනීමේ වැඩසටහන්.',
    'home.services.maker': 'නිර්මාණ අවකාශය',
    'home.services.maker.desc': '3D මුද්‍රණ යන්ත්‍ර, ඉලෙක්ට්‍රොනික කට්ටල සහ නිර්මාණ මෙවලම් සහිත ප්‍රායෝගික නවෝත්පාදන අවකාශය.',
    'home.services.all': 'සියලු සේවා බලන්න →',
    'home.events.eyebrow': 'ඉදිරියේ',
    'home.events.title': 'වැඩසටහන් & සිදුවීම්',
    'home.events.desc': 'වැඩමුළු, ප්‍රදර්ශන, පුහුණු සහ ප්‍රජා රැස්වීම් සඳහා අප හා එකතු වන්න.',
    'home.events.all': 'සියලු සිදුවීම් බලන්න →',
    'home.mission.eyebrow': 'අපේ මෙහෙවර',
    'home.mission.title': 'මඩකලපුව සඳහා නවීන දැනුම් මධ්‍යස්ථානය',
    'home.mission.desc': 'දශක පහකට ආසන්නව, මඩකලපුව මහජන පුස්තකාලය නැගෙනහිර පළාතේ සාංස්කෘතික හා බුද්ධිමය කේන්ද්‍රය ලෙස සේවය කර ඇත.',
    'home.mission.f1': 'බහු පුස්තකාල හරහා ඒකාබද්ධ නාමාවලිය',
    'home.mission.f2': 'ඉංග්‍රීසි, දෙමළ සහ සිංහල බහු භාෂා සේවා',
    'home.mission.f3': 'ස්ථානීය උරුමය සහ දුර්ලභ අත් ලේඛනවල ඩිජිටල් ලේඛනාගාරය',
    'home.mission.f4': 'සිසුන්, වැඩිහිටියන් සහ පර්යේෂකයන් සඳහා නොමිලේ වැඩසටහන්',
    'home.mission.f5': 'සෑම කෙනෙකුටම ප්‍රවේශ — WCAG 2.1 අනුකූල වේදිකාව',
    'home.mission.btn': 'අප ගැන දැන ගන්න →',
    'home.cta.title': 'අද ම සාමාජිකයෙකු වන්න',
    'home.cta.desc': 'වැඩිහිටියන් සඳහා වාර්ෂික සාමාජිකත්ව ගාස්තුව රු. 500 ක් පමණි, සිසුන් සහ වැඩිහිටියන් සඳහා නොමිලේ.',
    'home.cta.join': 'පුස්තකාලයට එකතු වන්න',
    'home.cta.benefits': 'සාමාජිකත්ව ප්‍රතිලාභ',
    // About page
    'about.hero.title': 'පුස්තකාලය ගැන',
    'about.hero.desc': '1972 සිට නැගෙනහිර පළාතට සේවය කිරීම — උරුමය ආරක්ෂා කිරීම, ප්‍රජාවන් සවිබල ගැන්වීම.',
    'about.story.eyebrow': 'අපේ කතාව',
    'about.story.title': 'ඉගෙනීමේ උරුමයක්',
    'about.story.p1': '1972 දී පිහිටුවන ලද මඩකලපුව මහජන පුස්තකාලය, කුඩා කියවන ශාලාවකින් ආරම්භ වී සවිස්තරාත්මක දැනුම් ආයතනයක් දක්වා වර්ධනය වී ඇත.',
    'about.story.p2': 'අද, <strong>නැගෙනහිර විශ්ව විද්‍යාලය</strong> සහ මහ නගර සභාව සමඟ හවුලෙන්, ඩිජිටල් පරිවර්තනයක් සිදු කරමින් සිටිමු.',
    'about.vmv.eyebrow': 'දර්ශනය & මෙහෙවර',
    'about.vmv.title': 'අපේ අරමුණ',
    'about.vision.title': 'දර්ශනය',
    'about.vision.desc': 'ජීවිත කාලය පුරා ඉගෙනීම, පර්යේෂණ, නවෝත්පාදනය සහ සාංස්කෘතික ආරක්ෂණය ප්‍රවර්ධනය කරන නවීන, ඩිජිටල් ලෙස සම්බන්ධිත, ප්‍රජා-කේන්ද්‍රීය දැනුම් මධ්‍යස්ථානයක් වීම.',
    'about.mission.title': 'මෙහෙවර',
    'about.mission.desc': 'මඩකලපු ප්‍රජාවේ සෑම සාමාජිකයෙකුටම තොරතුරු, ඉගෙනීමේ සම්පත් සහ සාංස්කෘතික උරුමය සඳහා නොමිලේ හා සමාන ප්‍රවේශය ලබා දීම.',
    'about.values.title': 'වටිනාකම්',
    'about.values.desc': 'සන්නිවේදනය, අඛණ්ඩිතව, ප්‍රවේශ්‍යතාව, බුද්ධිමය ස්වාධීනත්වය, ප්‍රජා සේවය සහ පුස්තකාල සේවා වල අඛණ්ඩ නවෝත්පාදනය.',
    'about.timeline.eyebrow': 'අපේ ගමන',
    'about.timeline.title': 'ඓතිහාසික සන්ධිස්ථාන',
    'about.hours.eyebrow': 'අපව සොයා ගන්න',
    'about.hours.title': 'වේලාවන් & ස්ථානය',
    'about.hours.branch': 'ප්‍රධාන ශාඛාව — බාර් පාර',
    'about.hours.address': 'බාර් පාර, මඩකලපුව 30000, නැගෙනහිර පළාත, ශ්‍රී ලංකාව',
    'about.hours.schedule': 'විවෘත කිරීමේ වේලාවන්',
    'about.hours.branches': 'අපේ ශාඛා',
    'about.leadership.eyebrow': 'පාලනය',
    'about.leadership.title': 'නායකත්වය & කාර්ය මණ්ඩලය',
    'about.cta.title': 'අපේ කතාවේ කොටසක් වන්න',
    'about.cta.desc': 'මඩකලපුව මහජන පුස්තකාලය තම බුද්ධිමය නිවස ලෙස සලකන දහස් ගණනාවක් සාමාජිකයන් සමඟ එකතු වන්න.',
    'about.cta.join': 'පුස්තකාලයට එකතු වන්න',
    'about.cta.contact': 'සම්බන්ධ වන්න',
    // Catalog page
    'catalog.hero.title': 'නාමාවලිය සොයන්න',
    'catalog.hero.desc': 'අපේ ස්ථානීය ඩිජිටල් නාමාවලිය බ්‍රවුස් කරන්න හෝ බහු පුස්තකාල හරහා ඒකාබද්ධ Koha OPAC සොයන්න.',
    'catalog.placeholder': 'මාතෘකාව, කර්තෘ, ISBN, විස්තරය සොයන්න…',
    'catalog.search': 'සොයන්න',
    'catalog.available': 'ලබා ගත හැකි පමණයි',
    'catalog.sort': 'වර්ග කිරීම:',
    'catalog.sort.newest': 'නවතම පළමු',
    'catalog.sort.title': 'මාතෘකාව අ–ශ',
    'catalog.sort.author': 'කර්තෘ අ–ශ',
    'catalog.loading': 'පූරණය වෙමින්…',
    'catalog.opac.btn': 'Koha OPAC විවෘත කරන්න ↗',
    'catalog.opac.text': 'නැගෙනහිර විශ්ව විද්‍යාලය & හවුල් පුස්තකාල සෘජුවම සොයන්න:',
    'catalog.opac.placeholder': 'සම්බන්ධිත සියලු පුස්තකාල සොයන්න…',
    'catalog.opac.search': 'OPAC සොයන්න ↗',
    // Collections page
    'collections.hero.title': 'අපේ එකතු',
    'collections.hero.desc': 'බහු භාෂා සහ විෂය ක්ෂේත්‍ර හරහා 50,000+ මාතෘකා — සාමාන්‍ය ණය සිට දුර්ලභ අත් ලේඛන දක්වා.',
    'collections.lending.title': 'ණය එකතුව',
    'collections.lending.desc': 'අපේ විශාලතම එකතුව — ණය ලබා ගැනීමට කල්පිතය, ජීවිත කතා සහ මූලාශ්‍ර කෘති. සම්මත ණය කාලය: දින 14, 2 වාරය දක්වා අලුත් කළ හැකිය.',
    'collections.reference.title': 'මූලාශ්‍ර එකතුව',
    'collections.reference.desc': 'විශ්වකෝශ, ශබ්ද කෝෂ, විද්‍යාත්මක සාම්පල සහ ශාස්ත්‍රීය සම්පත්. පුස්තකාල ඇතුළත භාවිතය පමණි.',
    'collections.periodicals.title': 'කාලීනතා & සාම්පල',
    'collections.periodicals.desc': 'දෙමළ, සිංහල සහ ඉංග්‍රීසි දිනපතා පුවත්පත්, සතිපතා සඟරා සහ ශාස්ත්‍රීය සාම්පල.',
    'collections.special.title': 'විශේෂ එකතු',
    'collections.special.desc': 'දුර්ලභ පොත්, ස්ථානීය කර්තෘවරුන්, ශ්‍රී ලංකා උරුම ද්‍රව්‍ය, සහ ඩිජිටල් කරන ලද අත් ලේඛන.',
    'collections.digital.title': 'ඩිජිටල් & e-සම්පත්',
    'collections.digital.desc': 'e-පොත්, ශ්‍රව්‍ය පොත්, මාර්ගගත දත්ත ගබඩා, ඩිජිටල් පුවත්පත් සහ පර්යේෂණ ගබඩා. සාමාජිකයන්ට ඕනෑම උපකරණයකින් 24/7 ප්‍රවේශය.',
    'collections.children.title': 'ළමා එකතුව',
    'collections.children.desc': 'චිත්‍ර පොත්, ආරම්භක කියවන්නන්, ළමා සාහිත්‍ය සහ අධ්‍යාපනික සම්පත්. සතිපතා කතා කාලය සහිත කල්ලාඩිහි ළමා ශාඛාව.',
    'collections.standards.eyebrow': 'ප්‍රමිතීන්',
    'collections.standards.title': 'ජාත්‍යන්තර ප්‍රමිතීන් මත ගොඩ නගා',
    'collections.standards.desc': 'අපේ එකතු හවුල් පුස්තකාල හරහා අන්තර් ක්‍රියාකාරිත්වය සහ සොයා ගැනීම සඳහා ජාත්‍යන්තරව පිළිගත් වර්ගීකරණ පද්ධති භාවිත කරයි.',
    'collections.cta.title': 'අද ගවේෂණය ආරම්භ කරන්න',
    'collections.cta.desc': 'අපේ සම්පූර්ණ එකතු සොයා ගැනීමට නාමාවලිය සොයන්න හෝ ඕනෑම ශාඛාවකට පැමිණෙන්න.',
    'collections.cta.catalog': 'නාමාවලිය සොයන්න',
    'collections.cta.join': 'සාමාජිකයෙකු වන්න',
    // Services page
    'services.hero.title': 'පුස්තකාල සේවා',
    'services.hero.desc': 'ඉගෙනීම, පර්යේෂණ සහ ප්‍රජා සම්බන්ධිත ක්‍රියාකාරකම් සවිබල ගැන්වෙන නොමිලේ සහ අඩු මිල සේවා.',
    'services.what.eyebrow': 'අපි ලබා දෙන දේ',
    'services.what.title': 'සෑම කෙනෙකුටම සේවා',
    'services.what.desc': 'පොත් ණය ගැනීමේ සිට 3D මුද්‍රණ යන්ත්‍රයක් ක්‍රියාත්මක කිරීම දක්වා — පුස්තකාලය ඔබ සඳහා ඇති දේ සොයා ගන්න.',
    'services.join.title': 'පුස්තකාලයට එකතු වන්න',
    'services.join.desc': 'ඒ ම දිනේ අනුමැතිය සහිත මාර්ගගත සාමාජිකත්ව ලියාපදිංචිය. සිසු සාමාජිකත්වය නොමිලේ.',
    'services.join.btn': 'දැන් ලියාපදිංචි වන්න',
    'services.research.title': 'පර්යේෂණ සහාය',
    'services.research.desc': 'උපුටා දැක්වීමේ මාර්ගෝපදේශනය, දත්ත ගබඩා ප්‍රවේශය සහ පර්යේෂණ උපාය මාර්ග සඳහා පුස්තකාලාධිපතිවරයෙකු සමඟ උපදේශනය වෙන් කරන්න.',
    'services.research.btn': 'පුස්තකාලාධිපතිගෙන් විමසන්න',
    'services.delivery.title': 'ලේඛන බෙදාහැරීම',
    'services.delivery.desc': 'විද්‍යුත් තැපෑල හෝ ආරක්ෂිත බාගත කිරීම හරහා ස්කෑන් කළ ලිපි හෝ පරිච්ඡේද ඉල්ලා සිටින්න.',
    'services.internet.title': 'අන්තර්ජාල & පරිගණක',
    'services.internet.desc': 'නොමිලේ අධිවේගී Wi-Fi සහ පුස්තකාලය පුරා 20+ පොදු ප්‍රවේශ වැඩ ස්ථාන. වෙන් කිරීම නිර්දේශ කෙරේ.',
    'services.maker.title': 'නිර්මාණ අවකාශය',
    'services.maker.desc': '3D මුද්‍රණ යන්ත්‍ර, ඉලෙක්ට්‍රොනික වැඩ ස්ථාන, සහ නවෝත්පාදන කට්ටල. සෑම සෙනසුරාදාම ප.ව. 10 ට වැඩමුළු.',
    'services.print.title': 'මුද්‍රණය, පිටපත් & ස්කෑන්',
    'services.print.desc': 'දැරිය හැකි මුද්‍රණ, ඡායාමාපන සහ ස්කෑනිං සේවා. භාවිතා කළ ප්‍රමාණයට ගෙවන්න — රු. 5/පිටුව කළු-සුදු.',
    'services.workshops.title': 'වැඩමුළු & පුහුණු',
    'services.workshops.desc': 'සියලු වයස් සඳහා ඩිජිටල් සාක්ෂරතාව, භාෂා පන්ති, සහ කුසලතා වර්ධන වැඩසටහන්. බොහොමය නොමිලේ.',
    'services.volunteer.title': 'ස්වේච්ඡා වැඩසටහන්',
    'services.volunteer.desc': 'පුස්තකාල ස්වේච්ඡා සේවකයෙකු ලෙස ප්‍රජා ව්‍යාප්ති, ළමා වැඩසටහන් සහ ඩිජිටලකරණ ව්‍යාපෘති ආධාර කරන්න.',
    'services.volunteer.btn': 'සහභාගි වන්න',
    'services.donations.title': 'පරිත්‍යාග',
    'services.donations.desc': 'පොත් පරිත්‍යාග කරන්න හෝ අපේ ලබාගැනීම් අරමුදලට දායක වන්න. සියලු දායකත්වයන් සඳහා බදු අඩු කළ රශීදු ලබා දෙනු ඇත.',
    'services.membership.eyebrow': 'සාමාජිකත්වය',
    'services.membership.title': 'ඔබේ සැලස්ම තෝරන්න',
    'services.membership.desc': 'නැගෙනහිර පළාතේ සියලු වාසිකරුවන්ට සහ සංචාරක පර්යේෂකයන්ට සාමාජිකත්වය විවෘතයි.',
    'services.cta.title': 'ආරම්භ කිරීමට සූදානම්ද?',
    'services.cta.desc': 'ලියාපදිංචිය මිනිත්තු කිහිපයක් ගනී. අද ම ණය ගැනීම, ඉගෙනීම සහ සම්බන්ධ වීම ආරම්භ කරන්න.',
    'services.cta.join': 'පුස්තකාලයට එකතු වන්න',
    'services.cta.questions': 'ප්‍රශ්ණ තිබේද?',
    // Events page
    'events.hero.title': 'වැඩසටහන් & සිදුවීම්',
    'events.hero.desc': 'වැඩමුළු, ප්‍රදර්ශන, කතා කාල, කර්තෘ හමුවීම් සහ තවත් — සහභාගීවීම නොමිලේ, සෑම කෙනෙකුටම විවෘතයි.',
    'events.filter.all': 'සියලු සිදුවීම්',
    'events.filter.upcoming': 'ඉදිරි',
    'events.filter.workshop': 'වැඩමුළු',
    'events.filter.children': 'ළමා',
    'events.filter.author': 'කර්තෘ හමුවීම්',
    'events.filter.training': 'පුහුණු',
    'events.filter.exhibition': 'ප්‍රදර්ශන',
    // Contact page
    'contact.hero.title': 'අප හා සම්බන්ධ වන්න',
    'contact.hero.desc': 'ප්‍රශ්ණ, ප්‍රතිපෝෂණ, පර්යේෂණ සහාය හෝ සාමාන්‍ය විමසීම් — ඔබගෙන් ඇසීමට අපි කැමැත්තෙමු.',
    'contact.info.title': 'සම්බන්ධ ව සිටින්න',
    'contact.info.desc': 'දුරකතන, විද්‍යුත් තැපෑල හරහා හෝ පෝරම භාවිතා කර සම්බන්ධ වන්න. අපි පැය 24ක් ඇතුළත සියලු විමසීම්වලට පිළිතුරු දෙමු.',
    'contact.address.title': 'ලිපිනය',
    'contact.phone.title': 'දුරකතන & විද්‍යුත් තැපෑල',
    'contact.hours.title': 'විවෘත කිරීමේ වේලාවන්',
    'contact.emergency.title': 'කාලාන්තරය ඉක්මවූ හදිසි',
    'contact.form.title': 'පණිවිඩයක් යවන්න',
    'contact.form.name': 'සම්පූර්ණ නම *',
    'contact.form.email': 'විද්‍යුත් තැපෑල ලිපිනය *',
    'contact.form.phone': 'දුරකතන අංකය',
    'contact.form.dept': 'අංශය',
    'contact.form.subject': 'විෂය',
    'contact.form.message': 'පණිවිඩය *',
    'contact.form.submit': 'පණිවිඩය යවන්න',
    'contact.map.eyebrow': 'අපව සොයා ගන්න',
    'contact.map.title': 'පුස්තකාලය වෙත පැමිණෙන්න',
    // Help page
    'help.hero.title': 'උදව් & සහාය',
    'help.hero.desc': 'ඔබේ පුස්තකාලයෙන් සහ ප්‍රශ්නොත්තර ලබා ගැනීමට නිබන්ධ, ප්‍රශ්ශ්නෝත්තර සහ සෘජු සහාය.',
    'help.links.catalog': 'නාමාවලිය සොයන්න',
    'help.links.join': 'පුස්තකාලයට එකතු වන්න',
    'help.links.login': 'සාමාජික පිවිසීම',
    'help.links.ask': 'පුස්තකාලාධිපතිගෙන් විමසන්න',
    'help.faq.eyebrow': 'නිතර අසන ප්‍රශ්ශ',
    'help.faq.title': 'නිතර අසන ප්‍රශ්ශ',
    'help.resources.eyebrow': 'සම්පත්',
    'help.resources.title': 'නිබන්ධ & මාර්ගෝපදේශ',
    // Common
    'common.home': 'මුල් පිටුව',
    'common.loading': 'පූරණය වෙමින්…',
    'common.browse': 'බ්‍රවුස් →',
    'common.search': 'සොයන්න',
    'common.available': 'ලබා ගත හැකිය',
    'common.onloan': 'ණය ගෙනයි',
    'common.noevents': 'ඉදිරි සිදුවීම් නැත',
    'common.noannouncements': 'නිවේදන නැත',
    'common.checkback': 'ඉක්මනින් නැවත බලන්න.',
  },
};

// ===== i18n engine =====
const i18n = {
  lang: localStorage.getItem('bpl-lang') || 'en',

  t(key) {
    return (TRANSLATIONS[this.lang] || TRANSLATIONS.en)[key] || (TRANSLATIONS.en)[key] || key;
  },

  apply() {
    const lang = this.lang;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder !== undefined) el.placeholder = val;
      } else if (el.dataset.i18nHtml) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });

    // Update lang button states
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('bpl-lang', lang);
    this.apply();
  },
};

// ===== Shared client utilities =====
const api = {
  async request(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'include',
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get(path)        { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body }); },
  put(path, body)  { return this.request(path, { method: 'PUT', body }); },
  del(path)        { return this.request(path, { method: 'DELETE' }); },
};

const auth = {
  user: null,
  async load() {
    try { const r = await api.get('/api/auth/me'); this.user = r.user; }
    catch (e) { this.user = null; }
    return this.user;
  },
  async logout() {
    await api.post('/api/auth/logout');
    location.href = '/';
  }
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function showAlert(container, message, type = 'success') {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;
  const icons = { success: '✓', danger: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `<div class="alert ${type}" role="alert"><span>${icons[type] || '•'}</span><span>${escapeHtml(message)}</span></div>`;
  setTimeout(() => {
    const a = el.querySelector('.alert');
    if (a) { a.style.transition = 'opacity 0.6s'; a.style.opacity = '0'; setTimeout(() => a.remove(), 650); }
  }, 5000);
}

// ===== Koha OPAC URL (HTTPS — redirects from HTTP) =====
const KOHA_URL = 'https://www.opac.lib.esn.ac.lk/cgi-bin/koha/opac-search.pl';

function buildKohaUrl(q, idx) {
  const url = new URL(KOHA_URL);
  if (q)   url.searchParams.set('q', q);
  if (idx) url.searchParams.set('idx', idx);
  return url.toString();
}

// ===== Header =====
function renderHeader(activeKey = '') {
  const links = [
    { key: 'home',        href: '/',           i18n: 'nav.home' },
    { key: 'about',       href: '/about',       i18n: 'nav.about' },
    { key: 'collections', href: '/collections', i18n: 'nav.collections' },
    { key: 'catalog',     href: '/catalog',     i18n: 'nav.catalog' },
    { key: 'services',    href: '/services',    i18n: 'nav.services' },
    { key: 'events',      href: '/events',      i18n: 'nav.events' },
    { key: 'help',        href: '/help',        i18n: 'nav.help' },
    { key: 'contact',     href: '/contact',     i18n: 'nav.contact' },
  ];
  const linkHtml = links.map(l =>
    `<li><a href="${l.href}" data-i18n="${l.i18n}"${activeKey === l.key ? ' class="active" aria-current="page"' : ''}>${i18n.t(l.i18n)}</a></li>`
  ).join('');

  const el = document.getElementById('site-header');
  if (!el) return;

  const curLang = i18n.lang;

  el.innerHTML = `
  <div class="topbar" role="banner">
    <div class="topbar-inner">
      <div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline;vertical-align:-1px;margin-right:3px;opacity:.75"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span data-i18n="topbar.address">${i18n.t('topbar.address')}</span>
        &nbsp;·&nbsp;
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline;vertical-align:-1px;opacity:.75"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
        <a href="tel:+94652222222">+94 65 222 2222</a>
        &nbsp;·&nbsp;
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline;vertical-align:-1px;opacity:.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span data-i18n="topbar.hours">${i18n.t('topbar.hours')}</span>
      </div>
      <div class="topbar-right">
        <div class="lang-switch" role="group" aria-label="Language">
          <button class="${curLang==='en'?'active':''}" data-lang="en" aria-pressed="${curLang==='en'}">EN</button>
          <button class="${curLang==='ta'?'active':''}" data-lang="ta" aria-pressed="${curLang==='ta'}">த</button>
          <button class="${curLang==='si'?'active':''}" data-lang="si" aria-pressed="${curLang==='si'}">සි</button>
        </div>
        <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle dark/light theme" title="Toggle theme">
          <svg id="theme-icon-moon" viewBox="0 0 24 24" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg id="theme-icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
        <span id="auth-link"><a href="/login" data-i18n="topbar.login">${i18n.t('topbar.login')}</a></span>
      </div>
    </div>
  </div>
  <header class="site-header" role="navigation" aria-label="Main navigation">
    <div class="header-inner">
      <a href="/" class="brand" aria-label="Batticaloa Public Library — Home">
        <img src="/images/logo.svg" alt="" class="brand-logo" aria-hidden="true" />
        <span class="brand-text">
          <strong data-i18n="brand.name">${i18n.t('brand.name')}</strong>
          <small data-i18n="brand.tagline">${i18n.t('brand.tagline')}</small>
        </span>
      </a>
      <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="main-nav">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <nav class="main-nav" id="main-nav">
        <ul>${linkHtml}<li><a href="/register" class="nav-cta" data-i18n="nav.join">${i18n.t('nav.join')}</a></li></ul>
      </nav>
    </div>
  </header>`;

  // Scroll shadow
  const hdr = el.querySelector('header.site-header');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  const toggle = el.querySelector('.menu-toggle');
  const nav    = el.querySelector('.main-nav');
  const menuIconOpen  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  const menuIconClose = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? menuIconClose : menuIconOpen;
  });

  // Close mobile menu on link click
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.innerHTML = menuIconOpen;
  }));

  // Close on outside click
  document.addEventListener('click', e => {
    if (!el.contains(e.target)) {
      nav?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      if (toggle) toggle.innerHTML = menuIconOpen;
    }
  });

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  const moonIcon = document.getElementById('theme-icon-moon');
  const sunIcon  = document.getElementById('theme-icon-sun');
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bpl-theme', theme);
    if (moonIcon && sunIcon) {
      moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
      sunIcon.style.display  = theme === 'dark' ? 'none'  : 'block';
    }
    if (themeBtn) themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  const savedTheme = localStorage.getItem('bpl-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);
  themeBtn?.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Language switcher
  el.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
      i18n.setLang(btn.dataset.lang);
    });
  });

  // Auth link
  auth.load().then(u => {
    const link = document.getElementById('auth-link');
    if (u && link) {
      const dashHref = ['admin','librarian','event_coordinator'].includes(u.role) ? '/admin' : '/dashboard';
      const firstName = escapeHtml((u.full_name || u.name || 'User').split(' ')[0]);
      link.innerHTML = `<a href="${dashHref}">Hi, ${firstName}</a> &nbsp;·&nbsp; <a href="#" id="logout-btn">Logout</a>`;
      document.getElementById('logout-btn')?.addEventListener('click', e => { e.preventDefault(); auth.logout(); });
    }
  });
}

// ===== Footer =====
function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;

  const socialLinks = [
    { href: '#', label: 'Facebook',  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>' },
    { href: '#', label: 'YouTube',   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#062f3a"/></svg>' },
    { href: '#', label: 'Instagram', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
    { href: '#', label: 'X (Twitter)', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  ];

  el.innerHTML = `
  <footer class="site-footer" role="contentinfo">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <img src="/images/logo.svg" alt="" style="width:40px;" aria-hidden="true" />
          <strong data-i18n="brand.name">${i18n.t('brand.name')}</strong>
        </div>
        <p class="footer-desc" data-i18n="footer.desc">${i18n.t('footer.desc')}</p>
        <div class="social-links" aria-label="Social media">
          ${socialLinks.map(s => `<a href="${s.href}" aria-label="${s.label}" rel="noopener">${s.icon}</a>`).join('')}
        </div>
      </div>
      <div>
        <h4 data-i18n="footer.explore">${i18n.t('footer.explore')}</h4>
        <ul>
          <li><a href="/about" data-i18n="footer.about">${i18n.t('footer.about')}</a></li>
          <li><a href="/collections" data-i18n="footer.collections">${i18n.t('footer.collections')}</a></li>
          <li><a href="/catalog" data-i18n="footer.catalog">${i18n.t('footer.catalog')}</a></li>
          <li><a href="/events" data-i18n="footer.events">${i18n.t('footer.events')}</a></li>
          <li><a href="/services" data-i18n="footer.services">${i18n.t('footer.services')}</a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="footer.members">${i18n.t('footer.members')}</h4>
        <ul>
          <li><a href="/register" data-i18n="footer.join">${i18n.t('footer.join')}</a></li>
          <li><a href="/login" data-i18n="footer.login">${i18n.t('footer.login')}</a></li>
          <li><a href="/dashboard" data-i18n="footer.dashboard">${i18n.t('footer.dashboard')}</a></li>
          <li><a href="/help" data-i18n="footer.help">${i18n.t('footer.help')}</a></li>
          <li><a href="/contact" data-i18n="footer.ask">${i18n.t('footer.ask')}</a></li>
          <li><a href="${KOHA_URL}" target="_blank" rel="noopener" data-i18n="footer.opac">${i18n.t('footer.opac')}</a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="footer.visit">${i18n.t('footer.visit')}</h4>
        <ul>
          <li data-i18n="footer.address1">${i18n.t('footer.address1')}</li>
          <li data-i18n="footer.address2">${i18n.t('footer.address2')}</li>
          <li><a href="tel:+94652222222">+94 65 222 2222</a></li>
          <li><a href="mailto:info@batticaloalibrary.lk">info@batticaloalibrary.lk</a></li>
          <li style="margin-top:0.5rem;color:#8ba4ad;font-size:0.83rem;" data-i18n="footer.hours">${i18n.t('footer.hours')}</li>
          <li style="color:#8ba4ad;font-size:0.83rem;" data-i18n="footer.closed">${i18n.t('footer.closed')}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} <span data-i18n="brand.name">${i18n.t('brand.name')}</span>. All rights reserved.</span>
      <span style="display:flex;gap:1.2rem;flex-wrap:wrap;">
        <a href="/policies" data-i18n="footer.privacy">${i18n.t('footer.privacy')}</a>
        <a href="/policies#accessibility" data-i18n="footer.accessibility">${i18n.t('footer.accessibility')}</a>
        <a href="/admin" data-i18n="footer.staff">${i18n.t('footer.staff')}</a>
      </span>
    </div>
  </footer>`;
}

// ===== Scroll-to-top button =====
function initScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderHeader(document.body.dataset.page || '');
  renderFooter();
  initScrollTop();
  i18n.apply();
});
