require('dotenv').config();
const db = require('./db');
const { hashPassword } = require('./auth');

console.log('Seeding database...');

// Wipe existing data and reset auto-increment counters
db.exec(`
  DELETE FROM audit_log; DELETE FROM chat_messages; DELETE FROM chat_sessions;
  DELETE FROM librarian_requests; DELETE FROM contact_messages;
  DELETE FROM event_registrations; DELETE FROM events; DELETE FROM announcements;
  DELETE FROM reservations; DELETE FROM loans; DELETE FROM books; DELETE FROM users;
  DELETE FROM revoked_tokens;
  DELETE FROM sqlite_sequence WHERE name IN
    ('users','books','loans','reservations','events','event_registrations',
     'announcements','contact_messages','librarian_requests','chat_sessions','chat_messages','audit_log');
`);

// ─── USERS ───────────────────────────────────────────────────────────────────
const insertUser = db.prepare(`
  INSERT INTO users (full_name, email, phone, password_hash, role, member_category,
                     membership_id, membership_status, membership_expiry, address, date_of_birth, nic)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const nextYear  = d => { const x = new Date(); x.setFullYear(x.getFullYear() + d); return x.toISOString().split('T')[0]; };
const pastYear  = d => { const x = new Date(); x.setFullYear(x.getFullYear() - d); return x.toISOString().split('T')[0]; };
const exp1 = nextYear(1);
const exp2 = nextYear(2);
const expPast = pastYear(0); // expired — today's date acts as boundary

// Staff
insertUser.run('System Administrator',   'admin@batticaloalibrary.lk',      '+94652222222', hashPassword('admin123'),   'admin',            'Staff Members',   'BPL00000001', 'active',  exp2,    'Batticaloa Public Library, Bar Road, Batticaloa', '1980-05-12', '800512-1234V');
insertUser.run('Head Librarian',         'librarian@batticaloalibrary.lk',  '+94652222223', hashPassword('library123'), 'librarian',        'Staff Members',   'BPL00000002', 'active',  exp2,    'Batticaloa Public Library, Bar Road, Batticaloa', '1975-08-20', '750820-5678V');
insertUser.run('Event Coordinator',      'events@batticaloalibrary.lk',     '+94652222224', hashPassword('events123'),  'event_coordinator','Staff Members',   'BPL00000003', 'active',  exp2,    '14, Trinco Road, Batticaloa',                     '1990-03-15', '900315-9012V');

// Active members — diverse categories
insertUser.run('Priya Selvarajah',       'priya@example.com',               '+94771234567', hashPassword('member123'), 'public', 'Students',       'BPL00000101', 'active',  exp1,    'No. 12, Trinco Road, Batticaloa',        '2003-06-21', '030621-1001V');
insertUser.run('Kumaran Rasiah',         'kumaran@example.com',             '+94771234568', hashPassword('member123'), 'public', 'Researchers',    'BPL00000102', 'active',  exp1,    'University Park, Vantharumoolai',         '1988-11-10', '881110-2002V');
insertUser.run('Aisha Mohammed',         'aisha@example.com',               '+94771234569', hashPassword('member123'), 'public', 'Public Members', 'BPL00000103', 'active',  exp1,    'Kallady, Batticaloa',                    '1995-04-30', '950430-3003V');
insertUser.run('Rajan Thambipillai',     'rajan@example.com',               '+94772345671', hashPassword('member123'), 'public', 'Students',       'BPL00000104', 'active',  exp1,    '25, Dutch Bar, Batticaloa',              '2004-01-15', '040115-4004V');
insertUser.run('Nirmala Chandrasekaran','nirmala@example.com',              '+94772345672', hashPassword('member123'), 'public', 'Senior Citizens','BPL00000105', 'active',  exp1,    'Navatkuda, Batticaloa',                  '1955-09-08', '550908-5005V');
insertUser.run('Farhan Ismail',          'farhan@example.com',              '+94772345673', hashPassword('member123'), 'public', 'Public Members', 'BPL00000106', 'active',  exp1,    'Eravur, Batticaloa',                     '1992-07-22', '920722-6006V');
insertUser.run('Sathiyapriya Yoganathan','sathiya@example.com',             '+94772345674', hashPassword('member123'), 'public', 'Students',       'BPL00000107', 'active',  exp1,    'Valaichenai, Batticaloa',                '2002-12-05', '021205-7007V');
insertUser.run('Mohamed Rizwan',         'rizwan@example.com',              '+94772345675', hashPassword('member123'), 'public', 'Researchers',    'BPL00000108', 'active',  exp1,    'Kattankudy, Batticaloa',                 '1985-03-18', '850318-8008V');
insertUser.run('Anitha Krishnaswamy',    'anitha@example.com',              '+94772345676', hashPassword('member123'), 'public', 'Public Members', 'BPL00000109', 'active',  exp1,    'Koddamunai, Batticaloa',                 '1978-11-27', '781127-9009V');
insertUser.run('Dilshan Perera',         'dilshan@example.com',             '+94772345677', hashPassword('member123'), 'public', 'Students',       'BPL00000110', 'active',  exp1,    'Passara Road, Badulla',                  '2001-08-03', '010803-1010V');

// Pending approval member
insertUser.run('Kavitha Sivarajah',      'kavitha@example.com',             '+94773456781', hashPassword('member123'), 'public', 'Students',       'BPL00000111', 'pending', exp1,    'Chenkalady, Batticaloa',                 '2005-02-14', '050214-1111V');
insertUser.run('Hassan Mubarak',         'hassan@example.com',              '+94773456782', hashPassword('member123'), 'public', 'Public Members', 'BPL00000112', 'pending', exp1,    'Oddamavadi, Batticaloa',                 '1998-06-30', '980630-1212V');

// Suspended member
insertUser.run('Tharshan Arumugam',      'tharshan@example.com',            '+94773456783', hashPassword('member123'), 'public', 'Public Members', 'BPL00000113', 'suspended', exp1, 'Ampara Road, Batticaloa',                '1993-09-11', '930911-1313V');

// ─── BOOKS ───────────────────────────────────────────────────────────────────
const insertBook = db.prepare(`
  INSERT INTO books (isbn, title, author, publisher, publication_year, category, collection_type,
                     language, call_number, description, cover_image, total_copies, available_copies, branch)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const books = [
  // English Lending — Main Branch
  ['9780143127741','Sapiens: A Brief History of Humankind','Yuval Noah Harari','Harper',2015,'History','lending','English','909 HAR','From the very dawn of humankind to the present day, this sweeping exploration of our species covers cognitive, agricultural, and scientific revolutions.','/images/book-sapiens.svg',5,3,'Main'],
  ['9780062316097','The Power of Habit','Charles Duhigg','Random House',2014,'Self-Help','lending','English','158 DUH','Why we do what we do in life and business — the science of habit formation backed by research.','/images/book-habit.svg',3,2,'Main'],
  ['9780141439518','Pride and Prejudice','Jane Austen','Penguin Classics',2003,'Fiction','lending','English','823 AUS','A timeless tale of love, class, and social standing in Regency England. Elizabeth Bennet navigates the complexities of society and romance.','/images/book-pride.svg',4,3,'Main'],
  ['9780061122415','The Alchemist','Paulo Coelho','HarperOne',2014,'Fiction','lending','English','869 COE','A young shepherd journeys to find a worldly treasure and learns to listen to his heart — one of the best-selling books of all time.','/images/book-alchemist.svg',6,4,'Main'],
  ['9780062457714','The Subtle Art of Not Giving a F*ck','Mark Manson','HarperOne',2016,'Self-Help','lending','English','158 MAN','A counterintuitive, generation-defining guide to living a good life by focusing on what truly matters.','/images/book-subtle.svg',3,1,'Main'],
  ['9780132350884','Clean Code','Robert C. Martin','Prentice Hall',2008,'Computer Science','lending','English','005 MAR','A handbook of agile software craftsmanship. Essential reading for any programmer who wants to write better code.','/images/book-cleancode.svg',3,2,'Main'],
  ['9780132126953','Educated','Tara Westover','Random House',2018,'Memoir','lending','English','920 WES','A memoir of a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge.','/images/book-educated.svg',3,3,'Main'],
  ['9780062315007','Becoming','Michelle Obama','Crown Publishing',2018,'Biography','lending','English','920 OBA','An intimate, powerful, and inspiring memoir by the former First Lady of the United States.','/images/book-becoming.svg',4,2,'Main'],
  ['9780141988511','Atomic Habits','James Clear','Avery',2018,'Self-Help','lending','English','158 CLE','An easy and proven way to build good habits and break bad ones through tiny changes that deliver remarkable results.','/images/book-atomic.svg',5,2,'Main'],
  ['9780198796718','A Brief History of Time','Stephen Hawking','Bantam',1998,'Science','lending','English','523 HAW','From the Big Bang to black holes — a guide to cosmology for general readers by one of the greatest scientific minds.','/images/book-time.svg',3,1,'Main'],
  ['9780141182803','To Kill a Mockingbird','Harper Lee','Harper Perennial',2006,'Fiction','lending','English','813 LEE','A Pulitzer Prize-winning novel about racial injustice in the Deep South, told through the eyes of young Scout Finch.','/images/book-mockingbird.svg',4,4,'Main'],
  ['9780553418811','The Martian','Andy Weir','Crown',2014,'Science Fiction','lending','English','813 WEI','An astronaut stranded on Mars must use his ingenuity, wit, and supplies to survive while NASA races to rescue him.','/images/book-martian.svg',2,0,'Main'],
  ['9780062409850','The Girl on the Train','Paula Hawkins','Riverhead Books',2015,'Fiction','lending','English','823 HAW','A psychological thriller about a woman who witnesses something disturbing during her daily commute.','/images/book-girl-train.svg',3,2,'Main'],
  ['9780385737951','The Maze Runner','James Dashner','Delacorte Press',2009,'Science Fiction','lending','English','813 DAS','A group of boys trapped in a mysterious maze must find a way out before time runs out.','/images/book-maze.svg',4,3,'Main'],
  ['9780525478812','The Fault in Our Stars','John Green','Dutton Books',2012,'Fiction','lending','English','813 GRE','A deeply moving story about two teenagers who fall in love while battling cancer.','/images/book-fault.svg',3,2,'Main'],

  // Reference — Eastern University Branch
  ['9780321125217','Domain-Driven Design','Eric Evans','Addison-Wesley',2003,'Computer Science','reference','English','005 EVA','Tackling complexity in the heart of software through domain modelling and bounded contexts.','/images/book-ddd.svg',2,2,'Eastern University'],
  ['9780201633610','Design Patterns','Gang of Four','Addison-Wesley',1994,'Computer Science','reference','English','005 GOF','Elements of Reusable Object-Oriented Software — the classic reference for software design patterns.','/images/book-dp.svg',2,2,'Eastern University'],
  ['9780201485677','The Mythical Man-Month','Frederick Brooks','Addison-Wesley',1995,'Computer Science','reference','English','005 BRO','Essays on software engineering from the creator of IBM System/360, still relevant decades later.','/images/book-mmm.svg',1,1,'Eastern University'],
  ['9780071606325','Database System Concepts','Silberschatz, Korth','McGraw-Hill',2010,'Computer Science','reference','English','005 SIL','Comprehensive textbook covering database design, SQL, storage, indexing, and transactions.','/images/book-db.svg',3,3,'Eastern University'],
  ['9780132461268','Operating System Concepts','Silberschatz, Galvin','Wiley',2012,'Computer Science','reference','English','005 OSC','The definitive reference on operating systems, covering processes, memory management, and file systems.','/images/book-os.svg',3,3,'Eastern University'],
  ['9780201734843','The Pragmatic Programmer','David Thomas, Andrew Hunt','Addison-Wesley',1999,'Computer Science','reference','English','005 THO','From journeyman to master — practical advice for programmers at all levels.','/images/book-pragma.svg',2,1,'Eastern University'],

  // Special Collections — Local & Regional Interest
  ['9789556711234','History of Batticaloa','S. Pathmanathan','Kumaran Press',2018,'History','special','English','954 PAT','A scholarly account of the cultural, political, and architectural history of the Eastern Province of Sri Lanka.','/images/book-batticaloa.svg',2,2,'Main'],
  ['9789550533039','Madol Doova','Martin Wickramasinghe','Sarasa Publishers',2010,'Fiction','special','Sinhala','891 WIC','A beloved Sri Lankan classic about adventure and friendship on a remote island — required reading in Sri Lankan schools.','/images/book-madol.svg',4,4,'Main'],
  ['9789550000099','Funny Boy','Shyam Selvadurai','Penguin India',1994,'Fiction','special','English','823 SEL','A coming-of-age novel set in Sri Lanka during the 1983 ethnic tensions, winner of multiple literary awards.','/images/book-funnyboy.svg',2,1,'Main'],
  ['9789556700001','Yarl Devi','Konangi Poet','Tamil Puthalvan',2019,'Poetry','special','Tamil','891 YAR','A modern Tamil poetry collection celebrating the landscapes and people of the Northern and Eastern provinces.','/images/book-yarl.svg',3,3,'Main'],
  ['9789556700002','Katha Nayagi','Gnanakumaran','Tamil Kavithai Illam',2020,'Fiction','special','Tamil','891 GNA','Short stories exploring the lives of ordinary people in post-war Batticaloa with warmth and vivid detail.','/images/book-katha.svg',3,3,'Main'],
  ['9789556700003','Puranic Tales of the East','R. Sivagnanam','Eastern Heritage Trust',2016,'History','special','Tamil','954 SIV','Ancient legends and temple histories of the Eastern Province, compiled from oral traditions and manuscript sources.','/images/book-puranic.svg',2,2,'Main'],
  ['9780062409851','The Amulet of Samarkand','Jonathan Stroud','Hyperion',2003,'Fiction','lending','English','823 STR','A young boy summons a 5,000-year-old djinni in a fantasy world inspired by ancient empires.','/images/book-amulet.svg',2,2,'Main'],
  ['9780099590088','Life of Pi','Yann Martel','Canongate',2003,'Fiction','lending','English','823 MAR','A young Indian boy survives 227 days at sea with a Bengal tiger in this Booker Prize-winning novel.','/images/book-pi.svg',3,2,'Main'],
  ['9780525559474','The Midnight Library','Matt Haig','Canongate',2020,'Fiction','lending','English','823 HAI','Between life and death there is a library that contains the stories of all the lives you could have lived.','/images/book-midnight.svg',4,3,'Main'],
  ['9780385543767','The Book Thief','Markus Zusak','Picador',2005,'Fiction','lending','English','823 ZUS','Narrated by Death, the story of a young girl living with a foster family in Nazi Germany who finds solace in books.','/images/book-thief.svg',3,2,'Main'],
];
books.forEach(b => insertBook.run(...b));

// ─── LOANS ───────────────────────────────────────────────────────────────────
// We insert loans directly via SQL so we can set specific timestamps.
// User IDs: staff start at 1, members: Priya=4, Kumaran=5, Aisha=6, Rajan=7, Nirmala=8, Farhan=9, Sathiya=10, Rizwan=11, Anitha=12, Dilshan=13
// Book IDs assigned in insertion order (1=Sapiens, 2=Power of Habit, …)

const insertLoan = db.prepare(`
  INSERT INTO loans (user_id, book_id, borrowed_at, due_date, returned_at, status, fine_amount)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const daysAgo = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0,19).replace('T',' '); };
const daysFromNow = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0,19).replace('T',' '); };

// Active loans — due in future
insertLoan.run(4,  1,  daysAgo(5),  daysFromNow(9),  null, 'active', 0);   // Priya → Sapiens
insertLoan.run(5,  6,  daysAgo(3),  daysFromNow(11), null, 'active', 0);   // Kumaran → Clean Code
insertLoan.run(6,  4,  daysAgo(7),  daysFromNow(7),  null, 'active', 0);   // Aisha → The Alchemist
insertLoan.run(7,  9,  daysAgo(2),  daysFromNow(12), null, 'active', 0);   // Rajan → Atomic Habits
insertLoan.run(8,  3,  daysAgo(4),  daysFromNow(10), null, 'active', 0);   // Nirmala → Pride & Prejudice
insertLoan.run(9,  7,  daysAgo(6),  daysFromNow(8),  null, 'active', 0);   // Farhan → Educated
insertLoan.run(10, 14, daysAgo(1),  daysFromNow(13), null, 'active', 0);   // Sathiya → Maze Runner
insertLoan.run(11, 29, daysAgo(3),  daysFromNow(11), null, 'active', 0);   // Rizwan → Midnight Library
insertLoan.run(12, 8,  daysAgo(8),  daysFromNow(6),  null, 'active', 0);   // Anitha → Becoming
insertLoan.run(13, 30, daysAgo(5),  daysFromNow(9),  null, 'active', 0);   // Dilshan → Book Thief

// Overdue active loans — due in the past, fines accruing
insertLoan.run(4,  2,  daysAgo(20), daysAgo(6),   null, 'active', 60);  // Priya → Power of Habit (overdue 6 days)
insertLoan.run(5,  10, daysAgo(25), daysAgo(11),  null, 'active', 110); // Kumaran → Brief History of Time (overdue 11 days)
insertLoan.run(7,  12, daysAgo(18), daysAgo(4),   null, 'active', 40);  // Rajan → The Martian (overdue 4 days)
insertLoan.run(9,  13, daysAgo(22), daysAgo(8),   null, 'active', 80);  // Farhan → Girl on the Train (overdue 8 days)

// Returned loans — completed history
insertLoan.run(4,  11, daysAgo(45), daysAgo(31), daysAgo(32), 'returned', 0);   // Priya returned To Kill a Mockingbird
insertLoan.run(5,  4,  daysAgo(40), daysAgo(26), daysAgo(25), 'returned', 0);   // Kumaran returned The Alchemist
insertLoan.run(6,  15, daysAgo(35), daysAgo(21), daysAgo(20), 'returned', 0);   // Aisha returned Fault in Our Stars
insertLoan.run(8,  9,  daysAgo(50), daysAgo(36), daysAgo(33), 'returned', 30);  // Nirmala returned Atomic Habits (3 days late)
insertLoan.run(11, 3,  daysAgo(60), daysAgo(46), daysAgo(44), 'returned', 20);  // Rizwan returned Pride & Prejudice (2 days late)
insertLoan.run(13, 1,  daysAgo(30), daysAgo(16), daysAgo(14), 'returned', 20);  // Dilshan returned Sapiens (2 days late)
insertLoan.run(12, 5,  daysAgo(55), daysAgo(41), daysAgo(40), 'returned', 10);  // Anitha returned Subtle Art (1 day late)
insertLoan.run(10, 7,  daysAgo(28), daysAgo(14), daysAgo(13), 'returned', 10);  // Sathiya returned Educated (1 day late)

// ─── RESERVATIONS ────────────────────────────────────────────────────────────
const insertRes = db.prepare(`
  INSERT INTO reservations (user_id, book_id, reserved_at, status)
  VALUES (?, ?, ?, ?)
`);

// Pending reservations (books currently out)
insertRes.run(4,  12, daysAgo(2),  'pending');  // Priya reserved The Martian (all copies out)
insertRes.run(6,  5,  daysAgo(1),  'pending');  // Aisha reserved Subtle Art (only 1 copy, all out)
insertRes.run(11, 1,  daysAgo(3),  'pending');  // Rizwan reserved Sapiens
insertRes.run(13, 10, daysAgo(1),  'pending');  // Dilshan reserved Brief History of Time
insertRes.run(8,  6,  daysAgo(4),  'pending');  // Nirmala reserved Clean Code

// Fulfilled reservation history
insertRes.run(5,  11, daysAgo(30), 'fulfilled'); // Kumaran reserved To Kill a Mockingbird
insertRes.run(7,  4,  daysAgo(25), 'fulfilled'); // Rajan reserved The Alchemist
insertRes.run(9,  8,  daysAgo(20), 'fulfilled'); // Farhan reserved Becoming

// ─── EVENTS ──────────────────────────────────────────────────────────────────
const insertEvent = db.prepare(`
  INSERT INTO events (title, description, event_date, location, category, capacity, image, registration_open)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const inDays = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0,19).replace('T',' '); };

const events = [
  ['Tamil Literature Workshop',
   'Explore classical Tamil literature with renowned scholar Prof. Kanagasabai. The session covers Sangam poetry, medieval epics, and modern Tamil novels. Interactive discussion and refreshments provided.',
   inDays(7), 'Main Library, Auditorium', 'workshop', 60, '/images/event-tamil.svg', 1],

  ['Children\'s Story Time',
   'Weekly storytelling for ages 5–10. Stories narrated in Tamil, Sinhala, and English. Craft activities follow each session. Free for all children — no registration required.',
   inDays(3), 'Children\'s Section', 'children', 40, '/images/event-children.svg', 1],

  ['Digital Literacy for Seniors',
   'Free training in basic computer use, email, WhatsApp, and internet safety designed for senior citizens. Trainers available for one-on-one assistance. Devices provided.',
   inDays(14), 'Computer Lab, Floor 1', 'training', 25, '/images/event-digital.svg', 1],

  ['Author Meet: Shehan Karunatilaka',
   'Booker Prize-winning author of "The Seven Moons of Maali Almeida" visits Batticaloa to discuss his latest work, the future of Sri Lankan literature, and his writing process. Book signing to follow.',
   inDays(21), 'Main Auditorium', 'author', 100, '/images/event-author.svg', 1],

  ['Maker Space: 3D Printing Introduction',
   'Hands-on introduction to 3D printing and design using Tinkercad. All equipment provided. Suitable for beginners aged 14 and above. Bring your design ideas — take home your creation!',
   inDays(10), 'Maker Space, Floor 2', 'workshop', 15, '/images/event-maker.svg', 1],

  ['Heritage Photo Exhibition',
   'Rare historical photographs of Batticaloa and the Eastern Province from the early 20th century, loaned by the National Archives. Free entry for all. Guided tours at 10 AM and 3 PM daily.',
   inDays(2), 'Exhibition Hall, Ground Floor', 'exhibition', 200, '/images/event-heritage.svg', 1],

  ['Reading Club: Monthly Meet',
   'Join our monthly reading group! This month we discuss "The Midnight Library" by Matt Haig. New members welcome. Light refreshments served.',
   inDays(5), 'Discussion Room B', 'workshop', 20, '/images/event-reading.svg', 1],

  ['University Entrance Exam Prep',
   'A free two-day intensive workshop for A/L students preparing for university entrance, covering study strategies, time management, and past paper review sessions in all streams.',
   inDays(28), 'Conference Hall', 'training', 80, '/images/event-exam.svg', 1],

  // Past event (closed registration)
  ['Library Open Day 2026',
   'Annual open day celebrating the library\'s anniversary. Guided tours, children\'s activities, book swaps, and cultural performances from local schools and universities.',
   daysAgo(7), 'All Floors, Main Branch', 'exhibition', 300, '/images/event-openday.svg', 0],
];
events.forEach(e => insertEvent.run(...e));

// ─── EVENT REGISTRATIONS ─────────────────────────────────────────────────────
const insertReg = db.prepare(`
  INSERT INTO event_registrations (event_id, user_id, name, email, phone, attended, registered_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Tamil Literature Workshop (event 1) — 18 registrations
const workshopRegs = [
  [1, 4, 'Priya Selvarajah', 'priya@example.com', '+94771234567', 0, daysAgo(4)],
  [1, 5, 'Kumaran Rasiah', 'kumaran@example.com', '+94771234568', 0, daysAgo(3)],
  [1, 8, 'Nirmala Chandrasekaran', 'nirmala@example.com', '+94772345672', 0, daysAgo(5)],
  [1, 10,'Sathiyapriya Yoganathan','sathiya@example.com','+94772345674', 0, daysAgo(2)],
  [1, null,'Kavindra Arulampalam','kavindra@gmail.com','+94771000001', 0, daysAgo(6)],
  [1, null,'Thiruvenkatam Nair','thiruven@gmail.com','+94771000002', 0, daysAgo(5)],
  [1, null,'Suganthi Murugesan','suganthi@gmail.com','+94771000003', 0, daysAgo(4)],
  [1, null,'Selvi Kanagasabai','selvi.k@gmail.com','+94771000004', 0, daysAgo(3)],
];
workshopRegs.forEach(r => insertReg.run(...r));

// Children's Story Time (event 2)
const childrenRegs = [
  [2, 6, 'Aisha Mohammed', 'aisha@example.com', '+94771234569', 0, daysAgo(1)],
  [2, 7, 'Rajan Thambipillai', 'rajan@example.com', '+94772345671', 0, daysAgo(2)],
  [2, null,'Muthumalar Rajasingham','muthu@gmail.com','+94771000005', 0, daysAgo(1)],
  [2, null,'Banu Krishnan','banu.k@gmail.com','+94771000006', 0, daysAgo(1)],
];
childrenRegs.forEach(r => insertReg.run(...r));

// Heritage Photo Exhibition (event 6) — popular, many walk-ins
[
  [6, 4, 'Priya Selvarajah','priya@example.com','+94771234567', 1, daysAgo(6)],
  [6, 9, 'Farhan Ismail','farhan@example.com','+94772345673', 1, daysAgo(5)],
  [6,12, 'Anitha Krishnaswamy','anitha@example.com','+94772345676', 1, daysAgo(5)],
  [6, null,'Jesuthasan Sritharan','jesu@gmail.com','+94771000007', 1, daysAgo(6)],
  [6, null,'Pradeep Manoharan','pradeep@gmail.com','+94771000008', 1, daysAgo(6)],
  [6, null,'Yasmin Cassim','yasmin@gmail.com','+94771000009', 1, daysAgo(5)],
].forEach(r => insertReg.run(...r));

// Past Library Open Day (event 9) — attended
[
  [9, 4,'Priya Selvarajah','priya@example.com','+94771234567', 1, daysAgo(12)],
  [9, 5,'Kumaran Rasiah','kumaran@example.com','+94771234568', 1, daysAgo(12)],
  [9, 6,'Aisha Mohammed','aisha@example.com','+94771234569', 1, daysAgo(11)],
  [9, 7,'Rajan Thambipillai','rajan@example.com','+94772345671', 1, daysAgo(10)],
  [9, 8,'Nirmala Chandrasekaran','nirmala@example.com','+94772345672', 1, daysAgo(11)],
  [9, 9,'Farhan Ismail','farhan@example.com','+94772345673', 1, daysAgo(10)],
  [9,10,'Sathiyapriya Yoganathan','sathiya@example.com','+94772345674', 1, daysAgo(10)],
  [9,11,'Mohamed Rizwan','rizwan@example.com','+94772345675', 1, daysAgo(11)],
  [9, null,'Arulnilavan Sivaprakasam','arul@gmail.com','+94771000010', 1, daysAgo(12)],
  [9, null,'Chamari Wickramasinghe','chamari@gmail.com','+94771000011', 1, daysAgo(12)],
  [9, null,'Indhira Velautham','indhira@gmail.com','+94771000012', 0, daysAgo(11)],
].forEach(r => insertReg.run(...r));

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
const insertAnn = db.prepare(`
  INSERT INTO announcements (title, body, category, featured, emergency, publish_at, expires_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
`);

insertAnn.run('Library Hours Update', 'The library is now open Monday–Saturday, 8:30 AM–7:00 PM. Sundays and public holidays remain closed. Extended hours during examination periods will be announced separately.', 'general', 1, 0, null);
insertAnn.run('New Digital Catalog Now Live', 'Our integrated digital catalog — connecting Batticaloa Public Library, Eastern University Library (Koha), and the Open Library — is now live. Search across thousands of titles instantly from any device.', 'services', 1, 0, null);
insertAnn.run('Annual Membership Renewal 2026', 'Annual membership renewal is now open for all categories. New members joining before 31 May receive a free welcome kit and one month of complimentary membership. Visit the front desk or register online.', 'membership', 0, 0, null);
insertAnn.run('Scheduled CEB Power Outage', 'The Ceylon Electricity Board has scheduled maintenance this Sunday, affecting online services and the computer lab from 9:00 AM to 12:00 PM. Physical collections remain accessible. We apologise for the inconvenience.', 'notice', 0, 1, null);
insertAnn.run('Free Wi-Fi for All Members', 'High-speed Wi-Fi is now available throughout all library branches. Connect to "BPL-Members" using your membership ID as the password. Non-members may access the guest network for up to 1 hour per day.', 'services', 0, 0, null);
insertAnn.run('New Tamil and Sinhala Acquisitions', 'We have added over 40 new titles to our Tamil and Sinhala special collections, including recent award-winning novels and academic works on Eastern Province history. Visit the Special Collections room on Floor 2.', 'services', 1, 0, null);
insertAnn.run('Overdue Fine Waiver Week', 'In celebration of Library Week 2026, all overdue fines accumulated before 1 January 2026 are hereby waived. Members with suspended borrowing privileges are encouraged to visit the front desk to reinstate their accounts.', 'general', 0, 0, null);

// ─── CONTACT MESSAGES ────────────────────────────────────────────────────────
const insertContact = db.prepare(`
  INSERT INTO contact_messages (name, email, phone, subject, message, department, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

[
  ['Kumaran Rasiah','kumaran@example.com','+94771234568','Book Acquisition Request','I am a researcher and would like to request that the library acquire the latest edition of "Molecular Biology of the Cell" by Alberts et al. It is essential for my current research project.','Collections','new', daysAgo(2)],
  ['Nirmala Chandrasekaran','nirmala@example.com','+94772345672','Renewal of Membership','My membership (BPL00000105) expired recently. Could you please guide me on the renewal process and whether the senior citizen concession still applies?','Membership','new', daysAgo(1)],
  ['Anonymous Visitor',  'visitor01@gmail.com','+94771999001','Wi-Fi Access Issue','The Wi-Fi network "BPL-Members" is not showing on my device. I am a valid member but have been unable to connect for the past three days. Please assist.','Technical Support','new', daysAgo(3)],
  ['Farhan Ismail',      'farhan@example.com', '+94772345673','Lost Book — Need Guidance','I have misplaced a book I borrowed last month (The Girl on the Train). What is the replacement policy? I am happy to pay the cost but need guidance on the amount and process.','Circulation','new', daysAgo(5)],
  ['School Teacher',     'teacher@school.lk',  '+94771888001','Group Visit Request','I am a teacher at Batticaloa Central College. I would like to arrange a guided library tour for 30 A/L students. Please let me know available dates and whether there is a charge.','Administration','new', daysAgo(4)],
  ['Mohamed Rizwan',     'rizwan@example.com', '+94772345675','Research Room Booking','I would like to reserve the Research Room for a two-day project with my team (4 people). We need access to reference materials and a projector. Could you confirm availability?','Administration','new', daysAgo(1)],
].forEach(r => insertContact.run(...r));

// ─── LIBRARIAN REQUESTS (Ask a Librarian) ────────────────────────────────────
const insertReq = db.prepare(`
  INSERT INTO librarian_requests (user_id, name, email, request_type, topic, details, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

[
  [4,  'Priya Selvarajah',       'priya@example.com',   'research',   'Sri Lankan Independence Movement', 'I am writing a history essay on the independence movement and need help finding primary and secondary sources available at this library or through inter-library loan.', 'open', daysAgo(3)],
  [5,  'Kumaran Rasiah',         'kumaran@example.com', 'recommend',  'Bioinformatics Textbooks',         'Can you recommend any textbooks on computational biology and bioinformatics suitable for self-study? Preferably something available in the reference section.', 'open', daysAgo(2)],
  [10, 'Sathiyapriya Yoganathan','sathiya@example.com', 'locate',     'Tamil Novels Post-2010',           'I am looking for contemporary Tamil novels published after 2010, preferably by authors from Sri Lanka or the diaspora. Can you help me locate what is in the collection?', 'open', daysAgo(1)],
  [null,'Guest User',            'guest@email.com',     'general',    'Library Card for Foreign National','I am a visiting academic from India. Am I eligible for a library card and if so what documents do I need to bring?', 'open', daysAgo(4)],
].forEach(r => insertReq.run(...r));

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n✓ Seed complete.\n');
console.log('── Login Credentials ─────────────────────────────────────────');
console.log('  Admin:        admin@batticaloalibrary.lk       / admin123');
console.log('  Librarian:    librarian@batticaloalibrary.lk   / library123');
console.log('  Event Coord:  events@batticaloalibrary.lk      / events123');
console.log('  Member:       priya@example.com                / member123');
console.log('  Member:       kumaran@example.com              / member123');
console.log('  Member:       aisha@example.com                / member123');
console.log('  Member:       rajan@example.com                / member123');
console.log('  Member:       farhan@example.com               / member123');
console.log('──────────────────────────────────────────────────────────────');
console.log('\nSummary:');
const counts = {
  users: db.prepare('SELECT COUNT(*) as n FROM users').get().n,
  books: db.prepare('SELECT COUNT(*) as n FROM books').get().n,
  loans: db.prepare('SELECT COUNT(*) as n FROM loans').get().n,
  active: db.prepare("SELECT COUNT(*) as n FROM loans WHERE status='active'").get().n,
  overdue: db.prepare("SELECT COUNT(*) as n FROM loans WHERE status='active' AND due_date < datetime('now')").get().n,
  reservations: db.prepare('SELECT COUNT(*) as n FROM reservations').get().n,
  events: db.prepare('SELECT COUNT(*) as n FROM events').get().n,
  registrations: db.prepare('SELECT COUNT(*) as n FROM event_registrations').get().n,
  announcements: db.prepare('SELECT COUNT(*) as n FROM announcements').get().n,
  contacts: db.prepare('SELECT COUNT(*) as n FROM contact_messages').get().n,
};
Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(14)} ${v}`));
