require('dotenv').config();
const { prepare, initSchema } = require('./db');
const { hashPassword } = require('./auth');

async function seed() {
  await initSchema();
  console.log('Seeding database...');

  // Wipe existing data
  const tables = ['audit_log','chat_messages','chat_sessions','librarian_requests','contact_messages',
                  'event_registrations','events','announcements','reservations','loans','books','users','revoked_tokens'];
  for (const t of tables) {
    await prepare(`DELETE FROM ${t}`).run();
  }
  await prepare(`DELETE FROM sqlite_sequence WHERE name IN (
    'users','books','loans','reservations','events','event_registrations',
    'announcements','contact_messages','librarian_requests','chat_sessions','chat_messages','audit_log'
  )`).run();

  // ─── USERS ──────────────────────────────────────────────────────────────────
  const nextYear  = d => { const x = new Date(); x.setFullYear(x.getFullYear() + d); return x.toISOString().split('T')[0]; };
  const pastYear  = d => { const x = new Date(); x.setFullYear(x.getFullYear() - d); return x.toISOString().split('T')[0]; };
  const exp1 = nextYear(1);
  const exp2 = nextYear(2);

  const insertUser = prepare(`
    INSERT INTO users (full_name, email, phone, password_hash, role, member_category,
                       membership_id, membership_status, membership_expiry, address, date_of_birth, nic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['System Administrator',   'admin@batticaloalibrary.lk',      '+94652222222', hashPassword('admin123'),   'admin',            'Staff Members',   'BPL00000001', 'active',    exp2, 'Batticaloa Public Library, Bar Road, Batticaloa', '1980-05-12', '800512-1234V'],
    ['Head Librarian',         'librarian@batticaloalibrary.lk',  '+94652222223', hashPassword('library123'), 'librarian',        'Staff Members',   'BPL00000002', 'active',    exp2, 'Batticaloa Public Library, Bar Road, Batticaloa', '1975-08-20', '750820-5678V'],
    ['Event Coordinator',      'events@batticaloalibrary.lk',     '+94652222224', hashPassword('events123'),  'event_coordinator','Staff Members',   'BPL00000003', 'active',    exp2, '14, Trinco Road, Batticaloa',                     '1990-03-15', '900315-9012V'],
    ['Priya Selvarajah',       'priya@example.com',               '+94771234567', hashPassword('member123'), 'public', 'Students',       'BPL00000101', 'active',    exp1, 'No. 12, Trinco Road, Batticaloa',        '2003-06-21', '030621-1001V'],
    ['Kumaran Rasiah',         'kumaran@example.com',             '+94771234568', hashPassword('member123'), 'public', 'Researchers',    'BPL00000102', 'active',    exp1, 'University Park, Vantharumoolai',         '1988-11-10', '881110-2002V'],
    ['Aisha Mohammed',         'aisha@example.com',               '+94771234569', hashPassword('member123'), 'public', 'Public Members', 'BPL00000103', 'active',    exp1, 'Kallady, Batticaloa',                    '1995-04-30', '950430-3003V'],
    ['Rajan Thambipillai',     'rajan@example.com',               '+94772345671', hashPassword('member123'), 'public', 'Students',       'BPL00000104', 'active',    exp1, '25, Dutch Bar, Batticaloa',              '2004-01-15', '040115-4004V'],
    ['Nirmala Chandrasekaran', 'nirmala@example.com',             '+94772345672', hashPassword('member123'), 'public', 'Senior Citizens','BPL00000105', 'active',    exp1, 'Navatkuda, Batticaloa',                  '1955-09-08', '550908-5005V'],
    ['Farhan Ismail',          'farhan@example.com',              '+94772345673', hashPassword('member123'), 'public', 'Public Members', 'BPL00000106', 'active',    exp1, 'Eravur, Batticaloa',                     '1992-07-22', '920722-6006V'],
    ['Sathiyapriya Yoganathan','sathiya@example.com',             '+94772345674', hashPassword('member123'), 'public', 'Students',       'BPL00000107', 'active',    exp1, 'Valaichenai, Batticaloa',                '2002-12-05', '021205-7007V'],
    ['Mohamed Rizwan',         'rizwan@example.com',              '+94772345675', hashPassword('member123'), 'public', 'Researchers',    'BPL00000108', 'active',    exp1, 'Kattankudy, Batticaloa',                 '1985-03-18', '850318-8008V'],
    ['Anitha Krishnaswamy',    'anitha@example.com',              '+94772345676', hashPassword('member123'), 'public', 'Public Members', 'BPL00000109', 'active',    exp1, 'Koddamunai, Batticaloa',                 '1978-11-27', '781127-9009V'],
    ['Dilshan Perera',         'dilshan@example.com',             '+94772345677', hashPassword('member123'), 'public', 'Students',       'BPL00000110', 'active',    exp1, 'Passara Road, Badulla',                  '2001-08-03', '010803-1010V'],
    ['Kavitha Sivarajah',      'kavitha@example.com',             '+94773456781', hashPassword('member123'), 'public', 'Students',       'BPL00000111', 'pending',   exp1, 'Chenkalady, Batticaloa',                 '2005-02-14', '050214-1111V'],
    ['Hassan Mubarak',         'hassan@example.com',              '+94773456782', hashPassword('member123'), 'public', 'Public Members', 'BPL00000112', 'pending',   exp1, 'Oddamavadi, Batticaloa',                 '1998-06-30', '980630-1212V'],
    ['Tharshan Arumugam',      'tharshan@example.com',            '+94773456783', hashPassword('member123'), 'public', 'Public Members', 'BPL00000113', 'suspended', exp1, 'Ampara Road, Batticaloa',                '1993-09-11', '930911-1313V'],
  ];
  for (const u of users) await insertUser.run(...u);

  // ─── BOOKS ──────────────────────────────────────────────────────────────────
  const insertBook = prepare(`
    INSERT INTO books (isbn, title, author, publisher, publication_year, category, collection_type,
                       language, call_number, description, cover_image, total_copies, available_copies, branch)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const books = [
    ['9780143127741','Sapiens: A Brief History of Humankind','Yuval Noah Harari','Harper',2015,'History','lending','English','909 HAR','From the very dawn of humankind to the present day, this sweeping exploration covers cognitive, agricultural, and scientific revolutions.','/images/book-sapiens.svg',5,3,'Main'],
    ['9780062316097','The Power of Habit','Charles Duhigg','Random House',2014,'Self-Help','lending','English','158 DUH','Why we do what we do in life and business — the science of habit formation backed by research.','/images/book-habit.svg',3,2,'Main'],
    ['9780141439518','Pride and Prejudice','Jane Austen','Penguin Classics',2003,'Fiction','lending','English','823 AUS','A timeless tale of love, class, and social standing in Regency England.','/images/book-pride.svg',4,3,'Main'],
    ['9780061122415','The Alchemist','Paulo Coelho','HarperOne',2014,'Fiction','lending','English','869 COE','A young shepherd journeys to find a worldly treasure and learns to listen to his heart.','/images/book-alchemist.svg',6,4,'Main'],
    ['9780062457714','The Subtle Art of Not Giving a F*ck','Mark Manson','HarperOne',2016,'Self-Help','lending','English','158 MAN','A counterintuitive guide to living a good life by focusing on what truly matters.','/images/book-subtle.svg',3,1,'Main'],
    ['9780132350884','Clean Code','Robert C. Martin','Prentice Hall',2008,'Computer Science','lending','English','005 MAR','A handbook of agile software craftsmanship.','/images/book-cleancode.svg',3,2,'Main'],
    ['9780132126953','Educated','Tara Westover','Random House',2018,'Memoir','lending','English','920 WES','A memoir of a young girl who leaves her survivalist family and earns a PhD from Cambridge.','/images/book-educated.svg',3,3,'Main'],
    ['9780062315007','Becoming','Michelle Obama','Crown Publishing',2018,'Biography','lending','English','920 OBA','An intimate, powerful, and inspiring memoir by the former First Lady of the United States.','/images/book-becoming.svg',4,2,'Main'],
    ['9780141988511','Atomic Habits','James Clear','Avery',2018,'Self-Help','lending','English','158 CLE','Tiny changes that deliver remarkable results.','/images/book-atomic.svg',5,2,'Main'],
    ['9780198796718','A Brief History of Time','Stephen Hawking','Bantam',1998,'Science','lending','English','523 HAW','From the Big Bang to black holes for general readers.','/images/book-time.svg',3,1,'Main'],
    ['9780141182803','To Kill a Mockingbird','Harper Lee','Harper Perennial',2006,'Fiction','lending','English','813 LEE','A Pulitzer Prize-winning novel about racial injustice in the Deep South.','/images/book-mockingbird.svg',4,4,'Main'],
    ['9780553418811','The Martian','Andy Weir','Crown',2014,'Science Fiction','lending','English','813 WEI','An astronaut stranded on Mars must use his ingenuity to survive.','/images/book-martian.svg',2,0,'Main'],
    ['9780062409850','The Girl on the Train','Paula Hawkins','Riverhead Books',2015,'Fiction','lending','English','823 HAW','A psychological thriller about a woman who witnesses something disturbing during her daily commute.','/images/book-girl-train.svg',3,2,'Main'],
    ['9780385737951','The Maze Runner','James Dashner','Delacorte Press',2009,'Science Fiction','lending','English','813 DAS','A group of boys trapped in a mysterious maze must find a way out.','/images/book-maze.svg',4,3,'Main'],
    ['9780525478812','The Fault in Our Stars','John Green','Dutton Books',2012,'Fiction','lending','English','813 GRE','A deeply moving story about two teenagers who fall in love while battling cancer.','/images/book-fault.svg',3,2,'Main'],
    ['9780321125217','Domain-Driven Design','Eric Evans','Addison-Wesley',2003,'Computer Science','reference','English','005 EVA','Tackling complexity in the heart of software.','/images/book-ddd.svg',2,2,'Eastern University'],
    ['9780201633610','Design Patterns','Gang of Four','Addison-Wesley',1994,'Computer Science','reference','English','005 GOF','Elements of Reusable Object-Oriented Software.','/images/book-dp.svg',2,2,'Eastern University'],
    ['9780201485677','The Mythical Man-Month','Frederick Brooks','Addison-Wesley',1995,'Computer Science','reference','English','005 BRO','Essays on software engineering still relevant decades later.','/images/book-mmm.svg',1,1,'Eastern University'],
    ['9780071606325','Database System Concepts','Silberschatz, Korth','McGraw-Hill',2010,'Computer Science','reference','English','005 SIL','Comprehensive textbook covering database design, SQL, and transactions.','/images/book-db.svg',3,3,'Eastern University'],
    ['9780132461268','Operating System Concepts','Silberschatz, Galvin','Wiley',2012,'Computer Science','reference','English','005 OSC','The definitive reference on operating systems.','/images/book-os.svg',3,3,'Eastern University'],
    ['9780201734843','The Pragmatic Programmer','David Thomas, Andrew Hunt','Addison-Wesley',1999,'Computer Science','reference','English','005 THO','Practical advice for programmers at all levels.','/images/book-pragma.svg',2,1,'Eastern University'],
    ['9789556711234','History of Batticaloa','S. Pathmanathan','Kumaran Press',2018,'History','special','English','954 PAT','A scholarly account of the history of the Eastern Province of Sri Lanka.','/images/book-batticaloa.svg',2,2,'Main'],
    ['9789550533039','Madol Doova','Martin Wickramasinghe','Sarasa Publishers',2010,'Fiction','special','Sinhala','891 WIC','A beloved Sri Lankan classic about adventure and friendship.','/images/book-madol.svg',4,4,'Main'],
    ['9789550000099','Funny Boy','Shyam Selvadurai','Penguin India',1994,'Fiction','special','English','823 SEL','A coming-of-age novel set in Sri Lanka during the 1983 ethnic tensions.','/images/book-funnyboy.svg',2,1,'Main'],
    ['9789556700001','Yarl Devi','Konangi Poet','Tamil Puthalvan',2019,'Poetry','special','Tamil','891 YAR','A modern Tamil poetry collection celebrating the Eastern Province.','/images/book-yarl.svg',3,3,'Main'],
    ['9789556700002','Katha Nayagi','Gnanakumaran','Tamil Kavithai Illam',2020,'Fiction','special','Tamil','891 GNA','Short stories exploring lives in post-war Batticaloa.','/images/book-katha.svg',3,3,'Main'],
    ['9789556700003','Puranic Tales of the East','R. Sivagnanam','Eastern Heritage Trust',2016,'History','special','Tamil','954 SIV','Ancient legends and temple histories of the Eastern Province.','/images/book-puranic.svg',2,2,'Main'],
    ['9780062409851','The Amulet of Samarkand','Jonathan Stroud','Hyperion',2003,'Fiction','lending','English','823 STR','A young boy summons a 5,000-year-old djinni in a fantasy world.','/images/book-amulet.svg',2,2,'Main'],
    ['9780099590088','Life of Pi','Yann Martel','Canongate',2003,'Fiction','lending','English','823 MAR','A Booker Prize-winning novel about survival at sea with a Bengal tiger.','/images/book-pi.svg',3,2,'Main'],
    ['9780525559474','The Midnight Library','Matt Haig','Canongate',2020,'Fiction','lending','English','823 HAI','Between life and death there is a library of all the lives you could have lived.','/images/book-midnight.svg',4,3,'Main'],
    ['9780385543767','The Book Thief','Markus Zusak','Picador',2005,'Fiction','lending','English','823 ZUS','Narrated by Death, a young girl in Nazi Germany finds solace in books.','/images/book-thief.svg',3,2,'Main'],
  ];
  for (const b of books) await insertBook.run(...b);

  // ─── LOANS ──────────────────────────────────────────────────────────────────
  const insertLoan = prepare(`
    INSERT INTO loans (user_id, book_id, borrowed_at, due_date, returned_at, status, fine_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const daysAgo = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0,19).replace('T',' '); };
  const daysFromNow = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0,19).replace('T',' '); };

  const loans = [
    [4,  1,  daysAgo(5),  daysFromNow(9),  null, 'active',   0],
    [5,  6,  daysAgo(3),  daysFromNow(11), null, 'active',   0],
    [6,  4,  daysAgo(7),  daysFromNow(7),  null, 'active',   0],
    [7,  9,  daysAgo(2),  daysFromNow(12), null, 'active',   0],
    [8,  3,  daysAgo(4),  daysFromNow(10), null, 'active',   0],
    [9,  7,  daysAgo(6),  daysFromNow(8),  null, 'active',   0],
    [10, 14, daysAgo(1),  daysFromNow(13), null, 'active',   0],
    [11, 29, daysAgo(3),  daysFromNow(11), null, 'active',   0],
    [12, 8,  daysAgo(8),  daysFromNow(6),  null, 'active',   0],
    [13, 30, daysAgo(5),  daysFromNow(9),  null, 'active',   0],
    [4,  2,  daysAgo(20), daysAgo(6),   null, 'active',  60],
    [5,  10, daysAgo(25), daysAgo(11),  null, 'active', 110],
    [7,  12, daysAgo(18), daysAgo(4),   null, 'active',  40],
    [9,  13, daysAgo(22), daysAgo(8),   null, 'active',  80],
    [4,  11, daysAgo(45), daysAgo(31), daysAgo(32), 'returned',  0],
    [5,  4,  daysAgo(40), daysAgo(26), daysAgo(25), 'returned',  0],
    [6,  15, daysAgo(35), daysAgo(21), daysAgo(20), 'returned',  0],
    [8,  9,  daysAgo(50), daysAgo(36), daysAgo(33), 'returned', 30],
    [11, 3,  daysAgo(60), daysAgo(46), daysAgo(44), 'returned', 20],
    [13, 1,  daysAgo(30), daysAgo(16), daysAgo(14), 'returned', 20],
    [12, 5,  daysAgo(55), daysAgo(41), daysAgo(40), 'returned', 10],
    [10, 7,  daysAgo(28), daysAgo(14), daysAgo(13), 'returned', 10],
  ];
  for (const l of loans) await insertLoan.run(...l);

  // ─── RESERVATIONS ───────────────────────────────────────────────────────────
  const insertRes = prepare(`INSERT INTO reservations (user_id, book_id, reserved_at, status) VALUES (?, ?, ?, ?)`);
  const reservations = [
    [4,  12, daysAgo(2),  'pending'],
    [6,  5,  daysAgo(1),  'pending'],
    [11, 1,  daysAgo(3),  'pending'],
    [13, 10, daysAgo(1),  'pending'],
    [8,  6,  daysAgo(4),  'pending'],
    [5,  11, daysAgo(30), 'fulfilled'],
    [7,  4,  daysAgo(25), 'fulfilled'],
    [9,  8,  daysAgo(20), 'fulfilled'],
  ];
  for (const r of reservations) await insertRes.run(...r);

  // ─── EVENTS ─────────────────────────────────────────────────────────────────
  const insertEvent = prepare(`
    INSERT INTO events (title, description, event_date, location, category, capacity, image, registration_open)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inDays = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0,19).replace('T',' '); };

  const events = [
    ['Tamil Literature Workshop','Explore classical Tamil literature with renowned scholar Prof. Kanagasabai.', inDays(7), 'Main Library, Auditorium', 'workshop', 60, '/images/event-tamil.svg', 1],
    ["Children's Story Time",'Weekly storytelling for ages 5–10 in Tamil, Sinhala, and English.', inDays(3), "Children's Section", 'children', 40, '/images/event-children.svg', 1],
    ['Digital Literacy for Seniors','Free training in basic computer use and internet safety for senior citizens.', inDays(14), 'Computer Lab, Floor 1', 'training', 25, '/images/event-digital.svg', 1],
    ['Author Meet: Shehan Karunatilaka','Booker Prize-winning author discusses his latest work. Book signing to follow.', inDays(21), 'Main Auditorium', 'author', 100, '/images/event-author.svg', 1],
    ['Maker Space: 3D Printing Introduction','Hands-on introduction to 3D printing using Tinkercad. Ages 14+.', inDays(10), 'Maker Space, Floor 2', 'workshop', 15, '/images/event-maker.svg', 1],
    ['Heritage Photo Exhibition','Rare historical photographs of Batticaloa and the Eastern Province.', inDays(2), 'Exhibition Hall, Ground Floor', 'exhibition', 200, '/images/event-heritage.svg', 1],
    ['Reading Club: Monthly Meet','Monthly reading group — this month: "The Midnight Library" by Matt Haig.', inDays(5), 'Discussion Room B', 'workshop', 20, '/images/event-reading.svg', 1],
    ['University Entrance Exam Prep','Free two-day intensive workshop for A/L students.', inDays(28), 'Conference Hall', 'training', 80, '/images/event-exam.svg', 1],
    ["Library Open Day 2026","Annual open day celebrating the library's anniversary.", daysAgo(7), 'All Floors, Main Branch', 'exhibition', 300, '/images/event-openday.svg', 0],
  ];
  for (const e of events) await insertEvent.run(...e);

  // ─── EVENT REGISTRATIONS ────────────────────────────────────────────────────
  const insertReg = prepare(`
    INSERT INTO event_registrations (event_id, user_id, name, email, phone, attended, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const regs = [
    [1, 4, 'Priya Selvarajah','priya@example.com','+94771234567', 0, daysAgo(4)],
    [1, 5, 'Kumaran Rasiah','kumaran@example.com','+94771234568', 0, daysAgo(3)],
    [1, 8, 'Nirmala Chandrasekaran','nirmala@example.com','+94772345672', 0, daysAgo(5)],
    [1,10, 'Sathiyapriya Yoganathan','sathiya@example.com','+94772345674', 0, daysAgo(2)],
    [1, null,'Kavindra Arulampalam','kavindra@gmail.com','+94771000001', 0, daysAgo(6)],
    [2, 6, 'Aisha Mohammed','aisha@example.com','+94771234569', 0, daysAgo(1)],
    [2, 7, 'Rajan Thambipillai','rajan@example.com','+94772345671', 0, daysAgo(2)],
    [6, 4, 'Priya Selvarajah','priya@example.com','+94771234567', 1, daysAgo(6)],
    [6, 9, 'Farhan Ismail','farhan@example.com','+94772345673', 1, daysAgo(5)],
    [6,12, 'Anitha Krishnaswamy','anitha@example.com','+94772345676', 1, daysAgo(5)],
    [9, 4, 'Priya Selvarajah','priya@example.com','+94771234567', 1, daysAgo(12)],
    [9, 5, 'Kumaran Rasiah','kumaran@example.com','+94771234568', 1, daysAgo(12)],
    [9, 6, 'Aisha Mohammed','aisha@example.com','+94771234569', 1, daysAgo(11)],
    [9, 7, 'Rajan Thambipillai','rajan@example.com','+94772345671', 1, daysAgo(10)],
    [9, 8, 'Nirmala Chandrasekaran','nirmala@example.com','+94772345672', 1, daysAgo(11)],
    [9, 9, 'Farhan Ismail','farhan@example.com','+94772345673', 1, daysAgo(10)],
  ];
  for (const r of regs) await insertReg.run(...r);

  // ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
  const insertAnn = prepare(`
    INSERT INTO announcements (title, body, category, featured, emergency, publish_at, expires_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  const anns = [
    ['Library Hours Update','The library is now open Monday–Saturday, 8:30 AM–7:00 PM.','general',1,0,null],
    ['New Digital Catalog Now Live','Our integrated digital catalog is now live. Search across thousands of titles instantly.','services',1,0,null],
    ['Annual Membership Renewal 2026','Annual membership renewal is now open for all categories.','membership',0,0,null],
    ['Scheduled CEB Power Outage','Maintenance this Sunday affecting online services and the computer lab from 9:00 AM to 12:00 PM.','notice',0,1,null],
    ['Free Wi-Fi for All Members','High-speed Wi-Fi is now available throughout all library branches.','services',0,0,null],
    ['New Tamil and Sinhala Acquisitions','We have added over 40 new titles to our Tamil and Sinhala special collections.','services',1,0,null],
    ['Overdue Fine Waiver Week','All overdue fines accumulated before 1 January 2026 are hereby waived.','general',0,0,null],
  ];
  for (const a of anns) await insertAnn.run(...a);

  // ─── CONTACT MESSAGES ───────────────────────────────────────────────────────
  const insertContact = prepare(`
    INSERT INTO contact_messages (name, email, phone, subject, message, department, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const contacts = [
    ['Kumaran Rasiah','kumaran@example.com','+94771234568','Book Acquisition Request','I am a researcher and would like to request the latest edition of "Molecular Biology of the Cell".','Collections','new',daysAgo(2)],
    ['Nirmala Chandrasekaran','nirmala@example.com','+94772345672','Renewal of Membership','My membership (BPL00000105) expired recently. Could you guide me on the renewal process?','Membership','new',daysAgo(1)],
    ['Farhan Ismail','farhan@example.com','+94772345673','Lost Book — Need Guidance','I have misplaced "The Girl on the Train" I borrowed last month. What is the replacement policy?','Circulation','new',daysAgo(5)],
    ['Mohamed Rizwan','rizwan@example.com','+94772345675','Research Room Booking','I would like to reserve the Research Room for a two-day project with my team.','Administration','new',daysAgo(1)],
  ];
  for (const c of contacts) await insertContact.run(...c);

  // ─── LIBRARIAN REQUESTS ─────────────────────────────────────────────────────
  const insertReq = prepare(`
    INSERT INTO librarian_requests (user_id, name, email, request_type, topic, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reqs = [
    [4, 'Priya Selvarajah','priya@example.com','research','Sri Lankan Independence Movement','I need help finding primary and secondary sources on the independence movement.','open',daysAgo(3)],
    [5, 'Kumaran Rasiah','kumaran@example.com','recommend','Bioinformatics Textbooks','Can you recommend textbooks on computational biology available in the reference section?','open',daysAgo(2)],
    [10,'Sathiyapriya Yoganathan','sathiya@example.com','locate','Tamil Novels Post-2010','I am looking for contemporary Tamil novels published after 2010 by Sri Lankan authors.','open',daysAgo(1)],
  ];
  for (const r of reqs) await insertReq.run(...r);

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n✓ Seed complete.\n');
  console.log('── Login Credentials ─────────────────────────────────────────');
  console.log('  Admin:        admin@batticaloalibrary.lk       / admin123');
  console.log('  Librarian:    librarian@batticaloalibrary.lk   / library123');
  console.log('  Member:       priya@example.com                / member123');
  console.log('──────────────────────────────────────────────────────────────');

  const countRows = await Promise.all([
    prepare('SELECT COUNT(*) as n FROM users').get(),
    prepare('SELECT COUNT(*) as n FROM books').get(),
    prepare('SELECT COUNT(*) as n FROM loans').get(),
    prepare("SELECT COUNT(*) as n FROM loans WHERE status='active'").get(),
    prepare('SELECT COUNT(*) as n FROM reservations').get(),
    prepare('SELECT COUNT(*) as n FROM events').get(),
    prepare('SELECT COUNT(*) as n FROM announcements').get(),
  ]);
  const labels = ['users','books','loans','active loans','reservations','events','announcements'];
  labels.forEach((l, i) => console.log(`  ${l.padEnd(16)} ${countRows[i].n}`));
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
