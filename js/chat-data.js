/* ══════════════════════════════════════════════════════════════════════
   MOCHI — CHAT CONTENT
   What the portfolio assistant knows. Kept apart from chat.js (like
   data.js is kept apart from main.js) so an answer can be edited without
   touching the code that matches questions to it.

   How matching works
     A visitor's question is lowercased and stripped of punctuation, then
     each topic scores one point per word of every keyword it contains
     (whole words; a trailing "s" is allowed, so "project" also matches
     "projects"; a two-word phrase scores 2; a topic's "strong" keywords
     count triple), times the topic's weight.
     The highest score answers; on a tie, the topic listed first wins.
     No match at all → fallback.
     Project questions are answered from PROJECTS in data.js, using the
     PROJECT_KEYS below, so a project is never described twice.

   Answers are authored HTML. Visitor input is never inserted as HTML.
   Action types: project (opens a case study), message (opens the
   message form), goto (scrolls to a section), link (opens a URL).
   ══════════════════════════════════════════════════════════════════════ */
'use strict';

var CHAT = {
  name: 'Mochi',
  hint: 'Hi! Need help? Ask me here 👋',
  welcome: 'Hi, I’m <b>Mochi</b>, Marjon’s portfolio assistant. Ask me about Marjon’s projects, skills, experience, or how to get in touch.',
  // Shown as buttons under the welcome message and after most answers.
  starters: ['why', 'projects', 'skills', 'availability', 'contact'],
  labels: {
    about: 'About Marjon',
    projects: 'What has Marjon built?',
    skills: 'Skills',
    awards: 'Awards',
    trainings: 'Trainings',
    beyond: 'Beyond the code',
    availability: 'Is Marjon available?',
    contact: 'Contact',
    cv: 'Can I see a CV?',
    why: 'Why hire Marjon?',
    experience: 'Experience',
    team: 'Solo or team work?',
    hardest: 'Hardest problem solved',
    code: 'Can I see the code?'
  },

  topics: [
    { id: 'about',
      keys: ['who is', 'about', 'marjon', 'student', 'study', 'studying', 'school', 'university', 'college', 'where', 'based', 'location', 'from', 'yourself', 'background'],
      weight: .6,   // "marjon" and "about" appear in most questions; a specific topic should win
      answer: 'Marjon C. Vera is a <b>BS Computer Science student at Biliran Province State University</b>, based in Naval, Biliran, Philippines. Marjon works on both sides of the stack (web systems, mobile apps, and computer vision) and is currently building <b>IntelliGuide</b>, a thesis project.',
      actions: [{ type: 'goto', value: 'about', label: 'Go to About' }],
      next: ['projects', 'skills', 'contact'] },

    { id: 'why',
      keys: ['why hire', 'why should', 'should i hire', 'should we hire', 'if i hire', 'if we hire', 'do for', 'value', 'bring', 'offer', 'contribute', 'strength', 'strong', 'strongest', 'good at', 'best at', 'different', 'benefit', 'company'],
      strong: ['different', 'stand out', 'unique', 'special', 'why hire', 'should we hire', 'should i hire'],
      answer: 'Here’s what Marjon can bring to your team, with proof on this site:<ul>' +
        '<li><b>Web systems, end to end:</b> interface, PHP back end, MySQL database, and deployment. QuiteScan, built solo, is live.</li>' +
        '<li><b>Mobile apps with on-device AI:</b> Flutter apps that run computer-vision models with no internet connection (IntelliGuide, CassavaCare).</li>' +
        '<li><b>Computer-vision models from data to phone:</b> dataset annotation, YOLOv8 training, model evaluation, and conversion (PyTorch → ONNX → TFLite).</li>' +
        '<li><b>Results backed by numbers:</b> CassavaCare identified 34 of 41 test leaves correctly (82.9%), and CocoScan&rsquo;s EfficientNetB0 model 154 of 160 (96.25%).</li>' +
        '<li><b>Startup experience:</b> part of the founding team of Tingi, a recycling rewards app launching in Palo, Leyte.</li>' +
        '<li><b>Recognised for academic excellence:</b> Best Emerging Markets Machine Learning Architect Award (International).</li></ul>',
      actions: [{ type: 'goto', value: 'work', label: 'See the projects' }, { type: 'message', label: 'Send Marjon a message' }],
      next: ['experience', 'cv', 'availability'] },

    { id: 'experience',
      keys: ['experience', 'experienced', 'work experience', 'worked', 'track record', 'done an internship', 'internship before', 'had an internship', 'ojt before', 'previous job', 'job before', 'employment', 'years of'],
      answer: 'Marjon’s hands-on experience so far comes from real projects rather than a job title:<ul>' +
        '<li><b>QuiteScan</b>, a live attendance system built solo, end to end</li>' +
        '<li><b>Tingi</b>, a startup, as part of the founding team</li>' +
        '<li><b>IntelliGuide</b>, a thesis with a three-stage on-device AI pipeline</li>' +
        '<li>An <b>international IT immersion program</b> at the University of Danang, Vietnam</li></ul>' +
        'For anything not listed here, such as formal internships, ask Marjon directly.',
      actions: [{ type: 'message', label: 'Ask Marjon' }],
      next: ['why', 'projects', 'cv'] },

    { id: 'team',
      keys: ['team', 'individual', 'group', 'with others'],
      strong: ['teamwork', 'alone', 'solo', 'by himself', 'collaborate', 'collaboration'],
      answer: 'Both. Marjon’s role differs by project:<ul>' +
        '<li><b>QuiteScan:</b> built solo, from interface to database, as the final project for Application Development and Emerging Technologies (3rd year, 1st semester)</li>' +
        '<li><b>Tingi:</b> a team startup; Marjon is part of the founding team</li>' +
        '<li><b>IntelliGuide:</b> Marjon’s thesis, building the app and detection pipeline</li>' +
        '<li><b>CocoScan:</b> a 5-member team project for Design and Analysis of Algorithms; Marjon built the app</li>' +
        '<li><b>CassavaCare:</b> a project given by one of Marjon&rsquo;s faculty instructors; Marjon trained both models and built the app</li>' +
        '<li><b>Banana Detector:</b> built during an international immersion program in Vietnam</li></ul>',
      next: ['hardest', 'why', 'contact'] },

    { id: 'hardest',
      keys: ['hardest', 'difficult', 'difficulty', 'challenge', 'challenging', 'problem solved', 'proud', 'proudest', 'best project', 'favorite', 'favourite', 'biggest', 'struggle'],
      answer: 'Two of the toughest problems so far:<ul>' +
        '<li><b>CassavaCare:</b> getting a 110.9M-parameter CNN + transformer classifier to run on a phone. Its preprocessing was undocumented and had to be recovered by testing, the model needed a PyTorch → ONNX → TensorFlow → TFLite conversion, and shrinking it broke on Android’s accelerator until only the safe layers were halved.</li>' +
        '<li><b>Banana Detector:</b> ripeness is continuous, but the model needs four classes. The hardest boundary is overripe vs. rotten, where the advice flips from “use it” to “throw it away”.</li></ul>',
      actions: [{ type: 'project', value: 'cassavacare', label: 'Open CassavaCare' }, { type: 'project', value: 'banana', label: 'Open Banana Detector' }],
      next: ['why', 'team', 'projects'] },

    { id: 'code',
      keys: ['code', 'source', 'source code', 'repository', 'repo', 'github', 'codebase'],
      answer: 'Marjon’s code is on GitHub: <a href="https://github.com/marjonvera2005-creator" target="_blank" rel="noopener noreferrer">github.com/marjonvera2005-creator</a>.',
      next: ['projects', 'skills', 'contact'] },

    { id: 'learning',
      keys: ['learning', 'currently', 'right now', 'now', 'working on', 'next', 'improving', 'goal', 'future', 'plan'],
      answer: 'Right now Marjon is <b>building IntelliGuide</b> (the thesis), <b>exploring on-device computer vision</b>, and <b>improving as a full-stack developer</b>.',
      next: ['projects', 'why', 'availability'] },

    { id: 'salary',
      keys: ['salary', 'pay', 'compensation', 'expected salary', 'how much', 'wage', 'rate', 'budget', 'cost'],
      answer: 'That’s best discussed directly with Marjon.',
      actions: [{ type: 'message', label: 'Send Marjon a message' }],
      next: ['why', 'availability'] },

    { id: 'details',
      // Facts the portfolio doesn't state. Mochi says so instead of guessing.
      keys: ['remote', 'remotely', 'onsite', 'on site', 'hybrid', 'relocate', 'relocation', 'move', 'full time', 'part time', 'schedule', 'start', 'when can', 'graduate', 'graduation', 'year level', 'what year', 'languages', 'speak', 'age', 'old', 'visa', 'travel'],
      answer: 'Good question, but I don’t have that detail. I only know what’s on this portfolio, and I won’t guess. Marjon can answer it directly.',
      actions: [{ type: 'message', label: 'Ask Marjon' }],
      next: ['why', 'availability', 'cv'] },

    { id: 'projects',
      keys: ['project', 'built', 'build', 'work', 'portfolio', 'made', 'make', 'app', 'apps', 'system', 'case study'],
      list: true,   // answered from PROJECTS in chat.js
      next: ['skills', 'awards', 'contact'] },

    { id: 'unlisted',
      // Common tools that are NOT on Marjon's skills list. Listed before
      // "skills" so a tie ("does Marjon know React?") gets the honest answer.
      keys: ['react', 'angular', 'vue', 'svelte', 'nextjs', 'node', 'nodejs', 'express', 'laravel', 'django', 'flask', 'spring', 'java', 'kotlin', 'swift', 'csharp', 'dotnet', 'typescript', 'ruby', 'rails', 'golang', 'rust', 'aws', 'azure', 'docker', 'kubernetes', 'firebase', 'mongodb', 'postgres', 'postgresql', 'wordpress', 'figma', 'unity'],
      answer: 'That one isn’t on Marjon’s skills list, so I can’t confirm it. Marjon’s main tools are web (HTML, CSS, JavaScript, PHP, MySQL), Flutter, and Python computer vision. Ask Marjon directly about anything else.',
      actions: [{ type: 'goto', value: 'capabilities', label: 'See all skills' }, { type: 'message', label: 'Ask Marjon' }],
      next: ['skills', 'why'] },

    { id: 'skills',
      keys: ['skill', 'tech', 'technology', 'technologies', 'stack', 'language', 'programming', 'tool', 'know', 'can do', 'html', 'css', 'javascript', 'php', 'mysql', 'flutter', 'python', 'yolo', 'opencv', 'tensorflow', 'ai', 'ml', 'machine learning', 'frontend', 'backend', 'mobile', 'web'],
      answer: 'Marjon’s skills fall into three groups:<ul>' +
        '<li><b>Web &amp; systems:</b> HTML5, CSS3, JavaScript, PHP, MySQL, schema design, REST APIs, auth &amp; sessions, QR encode/decode</li>' +
        '<li><b>Mobile:</b> Flutter, TensorFlow Lite, OpenStreetMap, on-device inference, offline-first apps, GPS, Hive storage</li>' +
        '<li><b>AI &amp; vision:</b> Python, YOLOv8, YOLO26 Nano, OpenCV, Google Colab, Kaggle, dataset annotation, model evaluation, PyTorch → ONNX → TFLite</li></ul>',
      actions: [{ type: 'goto', value: 'capabilities', label: 'See all skills' }],
      next: ['projects', 'awards', 'availability'] },

    { id: 'awards',
      keys: ['award', 'achievement', 'recognition', 'prize', 'honor', 'honour', 'won', 'win', 'excellence', 'architect'],
      answer: 'Marjon received the <b>Best Emerging Markets Machine Learning Architect Award (International)</b> for achieving Academic Excellence in the BS Computer Science third year level, at the Biliran Province State University Recognition Program on 25 May 2026.',
      actions: [{ type: 'goto', value: 'awards', label: 'See certificate & photos' }],
      next: ['trainings', 'projects', 'contact'] },

    { id: 'trainings',
      keys: ['training', 'certificate', 'certification', 'cert', 'course', 'seminar', 'webinar', 'immersion', 'danang', 'vietnam', 'cisco', 'networking', 'literacy'],
      answer: 'Marjon has completed four trainings, with five certificates between them:<ul>' +
        '<li><b>Immersion Program in Information Technology</b>, University of Danang, Vietnam (Mar 2026)</li>' +
        '<li><b>Networking Basics</b>, Cisco Networking Academy (May 2026), with two certificates: the course completion and the awarded certificate</li>' +
        '<li><b>Introduction to AI Literacy and Responsible Use</b>, CHED ACHIEVE · Mapúa University with Arizona State University (Sep 2026)</li>' +
        '<li><b>Integrated OS: Be More Digi-TALINO</b>, Integrated Office Solutions, Inc. (Sep 2025)</li></ul>',
      actions: [{ type: 'goto', value: 'trainings', label: 'View certificates' }],
      next: ['awards', 'skills', 'contact'] },

    { id: 'beyond',
      keys: ['hobby', 'hobbies', 'free time', 'interest', 'outside', 'beyond', 'trip', 'gym', 'fitness', 'workout', 'waterfall', 'photo', 'picture', 'personal', 'fun', 'life'],
      strong: ['hobby', 'hobbies', 'free time', 'beyond the code'],
      answer: 'Away from the keyboard, Marjon travels, hikes to waterfalls, and trains at the gym. The <b>Beyond the code</b> section has 36 photos, most of them from Da Nang, Vietnam.',
      actions: [{ type: 'goto', value: 'beyond', label: 'See the photos' }],
      next: ['about', 'trainings', 'contact'] },

    { id: 'availability',
      keys: ['available', 'availability', 'hire', 'hiring', 'job', 'intern', 'internship', 'ojt', 'role', 'position', 'open to', 'freelance', 'opportunity', 'work with', 'employ'],
      answer: 'Yes. Marjon is <b>open to internships and junior developer roles</b> in web systems, mobile apps, and computer vision.',
      actions: [{ type: 'message', label: 'Send Marjon a message' }],
      next: ['why', 'projects', 'cv'] },

    { id: 'contact',
      keys: ['contact', 'email', 'mail', 'reach', 'message', 'talk', 'connect', 'facebook', 'instagram', 'linkedin', 'social', 'touch', 'call'],
      answer: 'The quickest way is email: <a href="mailto:marjonvera2005@gmail.com">marjonvera2005@gmail.com</a>. Marjon is also on <a href="https://www.linkedin.com/in/marjon-vera-372a663b5/" target="_blank" rel="noopener noreferrer">LinkedIn</a>, and Marjon’s code is on <a href="https://github.com/marjonvera2005-creator" target="_blank" rel="noopener noreferrer">GitHub</a>.',
      actions: [{ type: 'message', label: 'Send a message' }],
      next: ['availability', 'projects'] },

    { id: 'cv',
      keys: ['cv', 'resume', 'résumé', 'curriculum'],
      answer: 'Yes! Marjon’s one-page CV covers projects, skills, awards, and trainings: <a href="cv/Marjon-Vera-CV.pdf" target="_blank" rel="noopener">download the CV (PDF)</a>.',
      actions: [{ type: 'message', label: 'Send Marjon a message' }],
      next: ['projects', 'skills'] },

    { id: 'site',
      keys: ['this site', 'this website', 'website', 'framework', 'built this', 'made this', 'how was', 'source code'],
      answer: 'This portfolio is plain <b>HTML, CSS, and JavaScript</b>, with no frameworks and no build step. I’m plain JavaScript too.',
      next: ['projects', 'skills'] },

    { id: 'bot',
      keys: ['mochi', 'bot', 'chatbot', 'robot', 'you', 'are you', 'ai assistant'],
      weight: .5,   // "you" is common, so this topic only wins when nothing else matches
      answer: 'I’m Mochi, a small scripted assistant Marjon built for this portfolio. I answer only from what’s on this site, so I won’t make things up. If I don’t know something, I’ll point you to Marjon.',
      next: ['projects', 'skills', 'contact'] },

    { id: 'hello',
      keys: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup'],
      weight: .5,   // "hi, what are the skills?" should answer the skills part
      answer: 'Hello! What would you like to know about Marjon?',
      next: ['projects', 'skills', 'awards', 'availability', 'contact'] },

    { id: 'thanks',
      keys: ['thanks', 'thank', 'ty', 'salamat', 'great', 'cool', 'nice', 'awesome', 'ok', 'okay', 'bye', 'goodbye'],
      weight: .5,
      answer: 'You’re welcome! Anything else?',
      next: ['projects', 'contact'] }
  ],

  // Extra words that point at one project, on top of its title.
  PROJECT_KEYS: {
    intelliguide: ['intelliguide', 'intelli', 'obstacle', 'blind', 'visually impaired', 'thesis', 'navigation', 'assistive'],
    cocoscan: ['cocoscan', 'coco scan', 'coconut', 'palm', 'yellowing', 'caterpillar', 'flaccidity', 'efficientnet', 'efficientnetb0', 'algorithm', 'algorithms'],
    tingi: ['tingi', 'startup', 'start up', 'business', 'recycle', 'recycling', 'plastic', 'pickup', 'palo', 'leyte', 'tacloban', 'eco'],
    quitescan: ['quitescan', 'quite scan', 'qr', 'attendance', 'scan', 'scanner', 'gate'],
    cassavacare: ['cassavacare', 'cassava', 'leaf', 'leaves', 'disease', 'crop', 'plant'],
    banana: ['banana', 'ripe', 'ripeness', 'rotten', 'fruit']
  },

  fallback: {
    answer: 'I’m not sure about that one. I only know what’s on this portfolio. You can ask Marjon directly, or try one of these:',
    actions: [{ type: 'message', label: 'Ask Marjon' }],
    next: ['projects', 'skills', 'contact']
  }
};
