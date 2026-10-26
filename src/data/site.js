// Single source of facts for the site: shops, menu, reviews, jobs. The social and review
// automations copy their prices and hours from here (by hand), so change them here first.

export const SITE = 'https://www.blessed.cafe';

export const SOCIAL = {
  instagram: 'https://www.instagram.com/blessedcoffee2024/',
  facebook: 'https://www.facebook.com/profile.php?id=61569255849766',
};

export const RATING = { score: 4.8, count: '100+', url: 'https://maps.app.goo.gl/LaRvUkWyq7bKAcDt5' };

// hours: null = not published yet, delivery: [] = no delivery links yet. Both render as "coming soon".
export const SHOPS = [
  {
    id: 'patisia',
    name: 'Blessed Coffee 2024',
    nick: { el: 'Πατήσια, το πρώτο', en: 'Patisia, the original' },
    area: { el: 'Κάτω Πατήσια', en: 'Kato Patisia' },
    street: { el: 'Ρόδου 68', en: 'Rodou 68' },
    locality: { el: 'Αθήνα', en: 'Athens' },
    postal: '104 45',
    phones: ['+302112181815', '+306932917800'],
    hours: { opens: '07:00', closes: '22:00' },
    geo: { lat: 38.0039997, lng: 23.7243728 },
    query: 'Blessed Coffee, Ρόδου 68, Αθήνα 104 45',
    embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3143.848258999412!2d23.72437279554395!3d38.00399970171721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1a2d0879e2663%3A0xae1b9a8dccbf3a7e!2zzqHPjM60zr_PhSA2OCwgzpHOuM6uzr3OsSAxMDQgNDU!5e0!3m2!1sel!2sgr!4v1779614962924!5m2!1sel!2sgr',
    delivery: [
      { name: 'e-food', url: 'https://www.e-food.gr/delivery/athina/blessed-coffee-kai-coctails-7652934' },
      { name: 'Wolt', url: 'https://wolt.com/en/grc/athens/restaurant/blessed-coffee-ro-do' },
      { name: 'Box', url: 'https://box.gr/delivery/kato-patisia/blessed-coffee-and-spirits' },
    ],
    isNew: false,
  },
  {
    id: 'kamatero',
    name: 'Blessed Coffee Kamatero',
    nick: { el: 'Καματερό, το καινούριο', en: 'Kamatero, the new one' },
    area: { el: 'Καματερό', en: 'Kamatero' },
    street: { el: 'Κωστή Παλαμά 17Α', en: 'Kosti Palama 17A' },
    locality: { el: 'Καματερό', en: 'Kamatero' },
    postal: '134 51',
    phones: ['+302102388812'],
    hours: null, // TODO: Kamatero opening hours
    geo: null,
    query: 'Κωστή Παλαμά 17Α, Καματερό 134 51',
    embed: `https://www.google.com/maps?q=${encodeURIComponent('Κωστή Παλαμά 17Α, Καματερό 134 51')}&output=embed`,
    delivery: [], // TODO: Kamatero e-food / Wolt / Box links
    isNew: true,
  },
];

export const shop = (id) => SHOPS.find((s) => s.id === id);

// +302112181815 -> 211 218 1815
export const phoneText = (p) => p.replace('+30', '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');

export const address = (s, lang) => `${s.street[lang]}, ${s.locality[lang]} ${s.postal}`;

export const directions = (s) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query)}`;

export const price = (n) => (n == null ? '' : `${n.toFixed(2)}€`);

// Menu. Rows are [name, price] or [name, price, price] when the section has two price columns.
// TODO: confirm Kamatero uses the same menu and prices.
export const MENU = [
  {
    id: 'coffee', title: { el: 'Καφές', en: 'Coffee' }, cols: ['Mrs Rose', 'Dolce'],
    items: [
      ['Freddo Espresso', 2.3, 2.2], ['Freddo Cappuccino', 2.6, 2.5], ['Cappuccino Latte', 2.6, 2.5],
      ['Cappuccino', 2.6, 2.5], ['Espresso', 1.8, 1.7], ['Macchiato', 2.1, 2.1], ['Frappe', 1.8, null],
      ['NES', 1.8, null], ['Φίλτρου', 2, null], ['Ελληνικός', 1.8, null], ['Americano', 2, null],
    ],
  },
  {
    id: 'pastries', title: { el: 'Σφολιάτες', en: 'Pastries' },
    items: [
      ['Τυρόπιτα', 1.6], ['Τυρόπιτα Κουρού', 1.9], ['Φλογέρα Philadelphia', 2.8], ['Μπουγάτσα Κρέμα', 2.8],
      ['Πίτσα', 2.8], ['Ζαμπονοτυρόπιτα', 2.9], ['Πεϊνιρλί', 2.8], ['Κρουασάν', 2.5], ['Λουκανικόπιτα', 2.5],
      ['Σπανακόπιτα με Τυρί', 2.5],
    ],
  },
  {
    id: 'sandwiches', title: { el: 'Sandwiches', en: 'Sandwiches' },
    items: [
      ['Γαλλική μπαγκέτα φιλέτο κοτόπουλο', 2.9], ['Γαλλική μπαγκέτα γαλοπούλα', 2.6],
      ['Μπαγκέτα σικάλεως γαλοπούλα', 2.6], ['Βιεννέζικο με ζαμπόν', 2.9], ['Αραβική με ζαμπόν', 2.7],
      ['Αραβική με γαλοπούλα', 2.7], ['Αραβική με κοτόπουλο', 2.9], ['Χάμπουργκερ με μπιφτέκι', 3],
      ['Τριπλό τοστ σικάλεως', 3],
    ],
  },
  {
    id: 'sweets', title: { el: 'Γλυκά (Ζάγκας)', en: 'Desserts (Zagkas)' },
    items: [['Banoffee', 2.9], ['Cheesecake', 2.9], ['Προφιτερόλ', 2.9], ['Sweet Dubai', 3.2], ['Black Forest', 3.2]],
  },
  {
    id: 'snacks', title: { el: 'Γλυκά snacks (Red Almond)', en: 'Sweet snacks (Red Almond)' },
    items: [
      ['Τάρτα Cookies 100γρ', 2.7], ['Τάρτα Banoffee 80γρ', 2.7], ['Τάρτα Πραλίνα Φουντουκιού 100γρ', 2.7],
      ['Μπάρα Ενέργειας με Καρύδι & Φρούτα 60γρ', 2.5], ['Μπάρα Σοκολάτας με Φουντούκια 60γρ', 2.5],
      ['Mini Soft Cookies Βανίλια με Κομμάτια Σοκολάτας 100γρ', 2.7], ['Mini Brownies Σοκολάτα 100γρ', 2.7],
      ['Mini Γκοφρετάκια 100γρ', 2.7], ['Mini Γκοφρετάκια Φράουλα 100γρ', 2.7],
      ['Κριτσινοκούλουρο Ηλιόσπορος 100γρ', 2.7], ['Κριτσινάκι με Επικάλυψη Σοκολάτας', 2.7],
    ],
  },
  {
    id: 'protein', title: { el: 'Protein bars', en: 'Protein bars' },
    items: [['Σοκολάτα Γάλακτος 40γρ', 1.8], ['Σοκολάτα - Μπισκότο 40γρ', 1.8], ['Μαύρη Σοκολάτα 40γρ', 1.8]],
  },
  {
    id: 'drinks', title: { el: 'Αναψυκτικά', en: 'Soft drinks' },
    items: [
      ['Coca Cola Κουτί 330ml', 1.5], ['Λουξ', 1.5], ['Monster', 2.5], ['Amita', 1.4], ['Amita Motion', 1.8],
      ['Hell', 1.5], ['Red Bull', 2.5], ['Σόδα Schweppes Κουτί 330ml', 1.5], ['Sprite Κουτί 330ml', 1.5],
      ['Fanta 330ml', 1.5], ['Τσάι Λεμόνι', 1.5], ['Τσάι Ροδάκινο', 1.5], ['Νερό', 0.5],
    ],
  },
  {
    id: 'beer', title: { el: 'Μπύρες', en: 'Beer' }, cols: { el: ['Τραπέζι', 'Take away'], en: ['Table', 'Take away'] },
    items: [['Amstel', 4, 3], ['Alfa', 4, 3], ['Heineken', 4, 3.5], ['Corona', 4, 3.5], ['Kaiser', 4, 3.5], ['Fischer', 4, 3.5]],
  },
  {
    id: 'cocktails', title: { el: 'Cocktails', en: 'Cocktails' },
    items: [['Zombie', 6], ['Daiquiri', 6], ['Pornstar', 6], ['Mojito', 6], ['Cucumber Basil', 6], ['Bubble Blessed', 6]],
  },
];

// Real Google reviews of the Patisia shop (translations are ours).
export const REVIEWS = [
  { name: 'Martha Grigoriou', el: 'Ωραίος καφές και κάτι για τη λιγούρα, είναι ό,τι πρέπει, όταν συνοδεύεται από γρήγορη και ευγενική εξυπηρέτηση!', en: "Nice coffee and something for cravings, it's a must, when accompanied by fast and polite service!" },
  { name: 'Ninaki Euangelou', el: 'Τα παιδιά είναι καταπληκτικά, πολύ ομαδικά σε όλες τις βάρδιες, εξυπηρετικότατα κ αμεσότατα! Καθαρά, περιποιημένα, νόστιμα, ο καφές φοβερός κ από ποιότητα κ από τεχνική! Ευχαριστούμε πολύ για την απόλαυση!', en: 'The guys are amazing, very teamy in all shifts, very helpful and direct! Clean, well-groomed, delicious, the coffee is awesome in terms of quality and technique! Thank you very much for the enjoyment!' },
  { name: 'Blackoni Chris', el: 'Το μοναδικό μαγαζί που είδα στο ντελίβερι να σου στέλνουν ποτηράκι με πάγο για το energy drink. Δεν θα πω κάτι άλλο, μπράβο στους μερακλήδες που έχουν όρεξη για δουλειά και αγαπάνε αυτό που κάνουν.', en: "The only shop I've seen on delivery that sends you a glass of ice for the energy drink. I won't say anything else, bravo to the enthusiasts who have an appetite for work and love what they do." },
  { name: 'Mourati', el: 'Απ’ τους καλύτερους καφέδες που έχω δοκιμάσει, ευγενέστατο προσωπικό και πολύ εξυπηρετικό, ευέλικτος χώρος μέσα και έξω για όσους είναι καπνιστές. Θα το πρότεινα σε όλους όσους θέλουν να κάτσουν για καφέ στην πλατεία.', en: 'One of the best coffees I have tasted, very polite and helpful staff, flexible space inside and outside for smokers. I would recommend it to everyone who wants to sit down for coffee in the square.' },
  { name: 'Κορλεόνε Γλυνός', el: 'Συγχαρητήρια, εξαιρετικός καφές παιδιά, μπράβο σας! Είχα καιρό να απολαύσω έτσι καφέ! Έτυχε να παραγγείλω μέσω πλατφόρμας και έμεινα πολύ ικανοποιημένος 🙏🏻💙', en: 'Congratulations, excellent coffee guys, well done! It had been a long time since I enjoyed coffee like this! I happened to order through a platform and was very satisfied 🙏🏻💙' },
];

export const JOBS = [
  { el: { title: 'Barista', desc: 'Ζητάμε barista με πάθος για τον καφέ και εμπειρία σε specialty. Πλήρης ή μερική απασχόληση.', tags: ['Πλήρης', 'Μερική', 'Με εμπειρία'] },
    en: { title: 'Barista', desc: 'We are looking for a barista with a passion for coffee and specialty experience. Full or part time.', tags: ['Full time', 'Part time', 'Experience required'] } },
  { el: { title: 'Διανομέας', desc: 'Αναζητούμε υπεύθυνο διανομέα για πρωινές και βραδινές βάρδιες.', tags: ['Ευέλικτο ωράριο', 'Δίπλωμα οδήγησης'] },
    en: { title: 'Delivery driver', desc: 'We need a reliable delivery driver for morning and evening shifts.', tags: ['Flexible hours', 'Driving licence'] } },
];
