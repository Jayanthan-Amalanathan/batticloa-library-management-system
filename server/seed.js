require('dotenv').config();
const db = require('./db');
const { hashPassword } = require('./auth');

console.log('Seeding database...');

// Wipe existing data
db.exec(`
  DELETE FROM audit_log; DELETE FROM librarian_requests; DELETE FROM contact_messages;
  DELETE FROM event_registrations; DELETE FROM events; DELETE FROM announcements;
  DELETE FROM reservations; DELETE FROM loans; DELETE FROM books; DELETE FROM users;
`);

// USERS
const insertUser = db.prepare(`
  INSERT INTO users (full_name, email, phone, password_hash, role, member_category,
                     membership_id, membership_status, membership_expiry, address)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
const exp = expiry.toISOString().split('T')[0];

insertUser.run('System Administrator', 'admin@batticaloalibrary.lk', '+94652222222',
  hashPassword('admin123'), 'admin', 'Staff Members', 'BPL00000001', 'active', exp,
  'Batticaloa Public Library, Bar Road, Batticaloa');

insertUser.run('Head Librarian', 'librarian@batticaloalibrary.lk', '+94652222223',
  hashPassword('library123'), 'librarian', 'Staff Members', 'BPL00000002', 'active', exp,
  'Batticaloa Public Library, Bar Road, Batticaloa');

insertUser.run('Event Coordinator', 'events@batticaloalibrary.lk', '+94652222224',
  hashPassword('events123'), 'event_coordinator', 'Staff Members', 'BPL00000003', 'active', exp, null);

insertUser.run('Priya Selvarajah', 'priya@example.com', '+94771234567',
  hashPassword('member123'), 'public', 'Students', 'BPL00000101', 'active', exp,
  'No. 12, Trinco Road, Batticaloa');

insertUser.run('Kumaran Rasiah', 'kumaran@example.com', '+94771234568',
  hashPassword('member123'), 'public', 'Researchers', 'BPL00000102', 'active', exp,
  'University Park, Vantharumoolai');

insertUser.run('Aisha Mohammed', 'aisha@example.com', '+94771234569',
  hashPassword('member123'), 'public', 'Public Members', 'BPL00000103', 'pending', exp,
  'Kallady, Batticaloa');

// BOOKS
const insertBook = db.prepare(`
  INSERT INTO books (isbn, title, author, publisher, publication_year, category, collection_type,
                     language, call_number, description, cover_image, total_copies, available_copies, branch)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const books = [
  ['9780143127741','Sapiens: A Brief History of Humankind','Yuval Noah Harari','Harper',2015,'History','lending','English','909.HAR','From the very dawn of humankind to the present day, this book explores the major revolutions that have shaped our species.','/images/book-sapiens.svg',5,4,'Main'],
  ['9780062316097','The Power of Habit','Charles Duhigg','Random House',2014,'Self-Help','lending','English','158.DUH','Why we do what we do in life and business — the science of habit formation.','/images/book-habit.svg',3,2,'Main'],
  ['9780141439518','Pride and Prejudice','Jane Austen','Penguin Classics',2003,'Fiction','lending','English','823.AUS','A timeless tale of love, class, and social standing in Regency England.','/images/book-pride.svg',4,3,'Main'],
  ['9780061122415','The Alchemist','Paulo Coelho','HarperOne',2014,'Fiction','lending','English','869.COE','A young shepherd journeys to find a worldly treasure, learning to listen to his heart along the way.','/images/book-alchemist.svg',6,5,'Main'],
  ['9780062457714','The Subtle Art of Not Giving a F*ck','Mark Manson','HarperOne',2016,'Self-Help','lending','English','158.MAN','A counterintuitive approach to living a good life.','/images/book-subtle.svg',3,1,'Main'],
  ['9780321125217','Domain-Driven Design','Eric Evans','Addison-Wesley',2003,'Computer Science','reference','English','005.EVA','Tackling complexity in the heart of software.','/images/book-ddd.svg',2,2,'Eastern University'],
  ['9780132350884','Clean Code','Robert C. Martin','Prentice Hall',2008,'Computer Science','reference','English','005.MAR','A handbook of agile software craftsmanship.','/images/book-cleancode.svg',3,2,'Eastern University'],
  ['9789550533039','Madol Doova','Martin Wickramasinghe','Sarasa Publishers',2010,'Fiction','special','Sinhala','891.WIC','A beloved Sri Lankan classic about adventure and friendship on a remote island.','/images/book-madol.svg',4,4,'Main'],
  ['9789550000099','Funny Boy','Shyam Selvadurai','Penguin India',1994,'Fiction','special','English','823.SEL','A coming-of-age novel set in Sri Lanka during ethnic tensions.','/images/book-funnyboy.svg',2,1,'Main'],
  ['9780132126953','Educated','Tara Westover','Random House',2018,'Memoir','lending','English','920.WES','A memoir of a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD.','/images/book-educated.svg',3,3,'Main'],
  ['9780062315007','Becoming','Michelle Obama','Crown Publishing',2018,'Biography','lending','English','920.OBA','An intimate, powerful memoir by the former First Lady of the United States.','/images/book-becoming.svg',4,2,'Main'],
  ['9780141988511','Atomic Habits','James Clear','Avery',2018,'Self-Help','lending','English','158.CLE','An easy and proven way to build good habits and break bad ones.','/images/book-atomic.svg',5,3,'Main'],
  ['9789556711234','History of Batticaloa','S. Pathmanathan','Kumaran Press',2018,'History','special','English','954.PAT','A scholarly account of the cultural and political history of the Eastern Province.','/images/book-batticaloa.svg',2,2,'Main'],
  ['9780198796718','A Brief History of Time','Stephen Hawking','Bantam',1998,'Science','lending','English','523.HAW','From the Big Bang to black holes — a layperson’s guide to cosmology.','/images/book-time.svg',3,2,'Main'],
  ['9780141182803','To Kill a Mockingbird','Harper Lee','Harper Perennial',2006,'Fiction','lending','English','813.LEE','A novel about racial injustice in the Deep South, told through the eyes of a child.','/images/book-mockingbird.svg',4,4,'Main'],
  ['9780553418811','The Martian','Andy Weir','Crown',2014,'Science Fiction','lending','English','813.WEI','An astronaut stranded on Mars must use his ingenuity to survive.','/images/book-martian.svg',2,1,'Main'],
];
books.forEach(b => insertBook.run(...b));

// EVENTS
const insertEvent = db.prepare(`
  INSERT INTO events (title, description, event_date, location, category, capacity, image)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const inDays = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0,19).replace('T',' '); };

const events = [
  ['Tamil Literature Workshop','Explore classical Tamil literature with renowned scholar Prof. Kanagasabai. Discussion includes Sangam poetry and modern Tamil novels.', inDays(7), 'Main Library, Auditorium', 'workshop', 60, '/images/event-tamil.svg'],
  ['Children’s Story Time','Weekly storytelling for ages 5–10. Stories in Tamil, Sinhala, and English. Free for all children.', inDays(3), 'Children’s Section', 'children', 40, '/images/event-children.svg'],
  ['Digital Literacy for Seniors','Free training in basic computer use, email, and internet safety for senior citizens.', inDays(14), 'Computer Lab', 'training', 25, '/images/event-digital.svg'],
  ['Author Meet: Shehan Karunatilaka','Booker Prize–winning author discusses his latest work and the future of Sri Lankan literature.', inDays(21), 'Main Auditorium', 'author', 100, '/images/event-author.svg'],
  ['Maker Space: 3D Printing Intro','Hands-on introduction to 3D printing and design. Equipment provided. Bring your ideas!', inDays(10), 'Maker Space, Floor 2', 'workshop', 15, '/images/event-maker.svg'],
  ['Heritage Photo Exhibition','Historical photographs of Batticaloa from the early 20th century. On display all month.', inDays(2), 'Exhibition Hall', 'exhibition', 200, '/images/event-heritage.svg'],
];
events.forEach(e => insertEvent.run(...e));

// ANNOUNCEMENTS
const insertAnn = db.prepare(`
  INSERT INTO announcements (title, body, category, featured, emergency, publish_at, expires_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
`);
insertAnn.run('Library Hours Update','The library is now open Monday–Saturday, 8:30 AM–7:00 PM. Sundays remain closed.','general',1,0,null);
insertAnn.run('New Digital Catalog Live','Our integrated digital catalog connecting Koha, Eastern University Library, and Open Library is now live. Search across thousands of titles instantly.','services',1,0,null);
insertAnn.run('Membership Drive 2026','Annual membership renewal is now open. New members receive a free welcome kit and one month free.','membership',0,0,null);
insertAnn.run('Power Outage Notice','Scheduled CEB maintenance on Sunday will affect online services from 9 AM to 12 PM.','notice',0,1,null);
insertAnn.run('Free Wi-Fi Available','High-speed Wi-Fi is now available throughout all library branches for members.','services',0,0,null);

console.log('Seed complete.');
console.log('\nLogin credentials:');
console.log('  Admin:        admin@batticaloalibrary.lk     / admin123');
console.log('  Librarian:    librarian@batticaloalibrary.lk / library123');
console.log('  Event Coord:  events@batticaloalibrary.lk    / events123');
console.log('  Member:       priya@example.com              / member123');
console.log('  Member:       kumaran@example.com            / member123');
