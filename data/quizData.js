// HSK 2 Workbook quiz data — 15 lessons, 225 questions.
// Each lesson: { id, zh, pinyin, en, images:{A..F filenames}, questions:[5 picture, 5 fill, 5 tf] }
export const LESSONS = [
 {
  "id": 1,
  "zh": "九月去北京旅游最好",
  "pinyin": "Jiǔ yuè qù Běijīng lǚyóu zuì hǎo",
  "en": "September is the best time to visit Beijing",
  "questions": [
   {
    "type": "picture",
    "prompt": "一月的北京天气最冷。",
    "pinyin": "Yī yuè de Běijīng tiānqì zuì lěng.",
    "en": "Beijing's weather is coldest in January.",
    "answer": "E",
    "explain": "“最冷” (coldest) → the snowman in the snow."
   },
   {
    "type": "picture",
    "prompt": "爸爸现在不能回来，他在工作呢。",
    "pinyin": "Bàba xiànzài bù néng huílai, tā zài gōngzuò ne.",
    "en": "Dad can't come home now; he's working.",
    "answer": "A",
    "explain": "“在工作” (working) → the people in the office."
   },
   {
    "type": "picture",
    "prompt": "星期六我们一起去踢足球吧。",
    "pinyin": "Xīngqīliù wǒmen yìqǐ qù tī zúqiú ba.",
    "en": "Let's go play soccer together on Saturday.",
    "answer": "C",
    "explain": "“踢足球” (play soccer) → the kids with a soccer ball."
   },
   {
    "type": "picture",
    "prompt": "你的小猫最漂亮。",
    "pinyin": "Nǐ de xiǎo māo zuì piàoliang.",
    "en": "Your kittens are the prettiest.",
    "answer": "F",
    "explain": "“小猫” (kittens) → the three cats."
   },
   {
    "type": "picture",
    "prompt": "我最喜欢旅游。",
    "pinyin": "Wǒ zuì xǐhuan lǚyóu.",
    "en": "What I like most is traveling.",
    "answer": "B",
    "explain": "“旅游” (travel) → the people with a map sightseeing."
   },
   {
    "type": "fill",
    "prompt": "王方（___）买一个新杯子。",
    "pinyin": "Wáng Fāng ___ mǎi yí ge xīn bēizi.",
    "en": "Wang Fang ___ buy a new cup.",
    "options": [
     {
      "k": "A",
      "zh": "为什么",
      "py": "wèi shénme",
      "en": "why"
     },
     {
      "k": "B",
      "zh": "要",
      "py": "yào",
      "en": "want / will"
     },
     {
      "k": "C",
      "zh": "最",
      "py": "zuì",
      "en": "most"
     },
     {
      "k": "D",
      "zh": "觉得",
      "py": "juéde",
      "en": "feel / think"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "也",
      "py": "yě",
      "en": "also"
     }
    ],
    "answer": "B",
    "explain": "要 (yào) — “Wang Fang wants to buy a new cup.” 要 expresses wanting or intending to do something."
   },
   {
    "type": "fill",
    "prompt": "昨天你（___）没来我家吃饭？",
    "pinyin": "Zuótiān nǐ ___ méi lái wǒ jiā chī fàn?",
    "en": "Why didn't you come to my home for dinner yesterday?",
    "options": [
     {
      "k": "A",
      "zh": "为什么",
      "py": "wèi shénme",
      "en": "why"
     },
     {
      "k": "B",
      "zh": "要",
      "py": "yào",
      "en": "want / will"
     },
     {
      "k": "C",
      "zh": "最",
      "py": "zuì",
      "en": "most"
     },
     {
      "k": "D",
      "zh": "觉得",
      "py": "juéde",
      "en": "feel / think"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "也",
      "py": "yě",
      "en": "also"
     }
    ],
    "answer": "A",
    "explain": "为什么 (wèi shénme) — “Why didn't you come…?” It asks the reason."
   },
   {
    "type": "fill",
    "prompt": "我（___）这个衣服太大了，你看看那个吧。",
    "pinyin": "Wǒ ___ zhège yīfu tài dà le, nǐ kànkan nàge ba.",
    "en": "I ___ this clothing is too big — take a look at that one.",
    "options": [
     {
      "k": "A",
      "zh": "为什么",
      "py": "wèi shénme",
      "en": "why"
     },
     {
      "k": "B",
      "zh": "要",
      "py": "yào",
      "en": "want / will"
     },
     {
      "k": "C",
      "zh": "最",
      "py": "zuì",
      "en": "most"
     },
     {
      "k": "D",
      "zh": "觉得",
      "py": "juéde",
      "en": "feel / think"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "也",
      "py": "yě",
      "en": "also"
     }
    ],
    "answer": "D",
    "explain": "觉得 (juéde) — “I think this is too big.” 觉得 introduces an opinion."
   },
   {
    "type": "fill",
    "prompt": "我的小猫两岁多了，大卫的小猫（___）两岁多了。",
    "pinyin": "Wǒ de xiǎo māo liǎng suì duō le, Dàwèi de xiǎo māo ___ liǎng suì duō le.",
    "en": "My kitten is over two years old; David's kitten is ___ over two.",
    "options": [
     {
      "k": "A",
      "zh": "为什么",
      "py": "wèi shénme",
      "en": "why"
     },
     {
      "k": "B",
      "zh": "要",
      "py": "yào",
      "en": "want / will"
     },
     {
      "k": "C",
      "zh": "最",
      "py": "zuì",
      "en": "most"
     },
     {
      "k": "D",
      "zh": "觉得",
      "py": "juéde",
      "en": "feel / think"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "也",
      "py": "yě",
      "en": "also"
     }
    ],
    "answer": "F",
    "explain": "也 (yě) — “David's kitten is also over two.” 也 means “also / too.”"
   },
   {
    "type": "fill",
    "prompt": "王老师（___）喜欢吃苹果。",
    "pinyin": "Wáng lǎoshī ___ xǐhuan chī píngguǒ.",
    "en": "Teacher Wang ___ likes eating apples.",
    "options": [
     {
      "k": "A",
      "zh": "为什么",
      "py": "wèi shénme",
      "en": "why"
     },
     {
      "k": "B",
      "zh": "要",
      "py": "yào",
      "en": "want / will"
     },
     {
      "k": "C",
      "zh": "最",
      "py": "zuì",
      "en": "most"
     },
     {
      "k": "D",
      "zh": "觉得",
      "py": "juéde",
      "en": "feel / think"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "也",
      "py": "yě",
      "en": "also"
     }
    ],
    "answer": "C",
    "explain": "最 (zuì) — “Teacher Wang likes eating apples most.” 最 marks the superlative."
   },
   {
    "type": "tf",
    "context": "她喜欢在家看电影，也喜欢睡觉，不喜欢出去。",
    "contextPy": "Tā xǐhuan zài jiā kàn diànyǐng, yě xǐhuan shuì jiào, bù xǐhuan chūqù.",
    "contextEn": "She likes watching movies at home and sleeping, and doesn't like going out.",
    "statement": "她最喜欢运动。",
    "statementPy": "Tā zuì xǐhuan yùndòng.",
    "statementEn": "She likes sports most.",
    "answer": false,
    "explain": "The passage says she likes staying in and dislikes going out — it never mentions sports."
   },
   {
    "type": "tf",
    "context": "王小姐的小猫在我家，我的小猫在我妈妈家。",
    "contextPy": "Wáng xiǎojiě de xiǎo māo zài wǒ jiā, wǒ de xiǎo māo zài wǒ māma jiā.",
    "contextEn": "Miss Wang's cat is at my home; my cat is at my mother's home.",
    "statement": "我有一个小猫。",
    "statementPy": "Wǒ yǒu yí ge xiǎo māo.",
    "statementEn": "I have a cat.",
    "answer": true,
    "explain": "“My cat is at my mother's home” tells us the speaker does own a cat."
   },
   {
    "type": "tf",
    "context": "我不想买桌子，我要买几个新椅子。",
    "contextPy": "Wǒ bù xiǎng mǎi zhuōzi, wǒ yào mǎi jǐ ge xīn yǐzi.",
    "contextEn": "I don't want to buy a table; I want to buy a few new chairs.",
    "statement": "我要去商店买桌子。",
    "statementPy": "Wǒ yào qù shāngdiàn mǎi zhuōzi.",
    "statementEn": "I'm going to the store to buy a table.",
    "answer": false,
    "explain": "The speaker explicitly doesn't want a table — they want chairs."
   },
   {
    "type": "tf",
    "context": "听说你在学做中国菜呢，我们一起做吧。",
    "contextPy": "Tīngshuō nǐ zài xué zuò Zhōngguó cài ne, wǒmen yìqǐ zuò ba.",
    "contextEn": "I heard you're learning to cook Chinese food — let's cook together.",
    "statement": "他们要一起做中国菜。",
    "statementPy": "Tāmen yào yìqǐ zuò Zhōngguó cài.",
    "statementEn": "They want to cook Chinese food together.",
    "answer": true,
    "explain": "“Let's cook together” matches the claim that they'll make Chinese food together."
   },
   {
    "type": "tf",
    "context": "八月北京很热，九月天气好，你来吧。",
    "contextPy": "Bā yuè Běijīng hěn rè, jiǔ yuè tiānqì hǎo, nǐ lái ba.",
    "contextEn": "Beijing is hot in August; the weather is nice in September — do come.",
    "statement": "八月去北京旅游最好。",
    "statementPy": "Bā yuè qù Běijīng lǚyóu zuì hǎo.",
    "statementEn": "August is the best time to travel to Beijing.",
    "answer": false,
    "explain": "September has the nice weather; August is described as hot. So September, not August, is best."
   }
  ],
  "images": {
   "A": "lesson-1-A.jpg",
   "B": "lesson-1-B.jpg",
   "C": "lesson-1-C.jpg",
   "D": "lesson-1-D.jpg",
   "E": "lesson-1-E.jpg",
   "F": "lesson-1-F.jpg"
  }
 },
 {
  "id": 2,
  "zh": "我每天六点起床",
  "pinyin": "Wǒ měi tiān liù diǎn qǐ chuáng",
  "en": "I get up at six every day",
  "questions": [
   {
    "type": "picture",
    "prompt": "麦克先生最不喜欢住院。",
    "pinyin": "Màikè xiānsheng zuì bù xǐhuan zhù yuàn.",
    "en": "Mr. Mike hates being hospitalized most of all.",
    "answer": "F",
    "explain": "“住院” (being in hospital) → the doctor with a patient."
   },
   {
    "type": "picture",
    "prompt": "爸爸每天工作很忙，星期六也不休息。",
    "pinyin": "Bàba měi tiān gōngzuò hěn máng, xīngqīliù yě bù xiūxi.",
    "en": "Dad is busy every day and doesn't even rest on Saturdays.",
    "answer": "C",
    "explain": "“工作很忙” (very busy working) → the man at the cluttered desk."
   },
   {
    "type": "picture",
    "prompt": "我每天下午和同学一起去跑步。",
    "pinyin": "Wǒ měi tiān xiàwǔ hé tóngxué yìqǐ qù pǎo bù.",
    "en": "Every afternoon I go running with my classmates.",
    "answer": "B",
    "explain": "“跑步” (running) → the people running."
   },
   {
    "type": "picture",
    "prompt": "这是一个星期的药，每天早上吃。",
    "pinyin": "Zhè shì yí ge xīngqī de yào, měi tiān zǎoshang chī.",
    "en": "This is a week's medicine; take it each morning.",
    "answer": "E",
    "explain": "“药” (medicine) → the pills in hand."
   },
   {
    "type": "picture",
    "prompt": "妈妈每天早上七点前起床。",
    "pinyin": "Māma měi tiān zǎoshang qī diǎn qián qǐ chuáng.",
    "en": "Mom gets up before seven every morning.",
    "answer": "A",
    "explain": "“起床” (getting up) → the woman waking by the alarm clock."
   },
   {
    "type": "fill",
    "prompt": "我们（___）个星期六都工作。",
    "pinyin": "Wǒmen ___ ge xīngqīliù dōu gōngzuò.",
    "en": "We work ___ Saturday.",
    "options": [
     {
      "k": "A",
      "zh": "出去",
      "py": "chūqù",
      "en": "go out"
     },
     {
      "k": "B",
      "zh": "每",
      "py": "měi",
      "en": "every"
     },
     {
      "k": "C",
      "zh": "忙",
      "py": "máng",
      "en": "busy"
     },
     {
      "k": "D",
      "zh": "知道",
      "py": "zhīdào",
      "en": "know"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "生病",
      "py": "shēng bìng",
      "en": "fall ill"
     }
    ],
    "answer": "B",
    "explain": "每 (měi) — 每个星期六 means “every Saturday.”"
   },
   {
    "type": "fill",
    "prompt": "对不起，我很（___），没时间去看电影。",
    "pinyin": "Duìbuqǐ, wǒ hěn ___, méi shíjiān qù kàn diànyǐng.",
    "en": "Sorry, I'm very ___ — no time to see a movie.",
    "options": [
     {
      "k": "A",
      "zh": "出去",
      "py": "chūqù",
      "en": "go out"
     },
     {
      "k": "B",
      "zh": "每",
      "py": "měi",
      "en": "every"
     },
     {
      "k": "C",
      "zh": "忙",
      "py": "máng",
      "en": "busy"
     },
     {
      "k": "D",
      "zh": "知道",
      "py": "zhīdào",
      "en": "know"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "生病",
      "py": "shēng bìng",
      "en": "fall ill"
     }
    ],
    "answer": "C",
    "explain": "忙 (máng) — “I'm very busy, so there's no time.”"
   },
   {
    "type": "fill",
    "prompt": "他不在家，下午四点（___）买东西了。",
    "pinyin": "Tā bú zài jiā, xiàwǔ sì diǎn ___ mǎi dōngxi le.",
    "en": "He's not home; at 4 p.m. he ___ to buy things.",
    "options": [
     {
      "k": "A",
      "zh": "出去",
      "py": "chūqù",
      "en": "go out"
     },
     {
      "k": "B",
      "zh": "每",
      "py": "měi",
      "en": "every"
     },
     {
      "k": "C",
      "zh": "忙",
      "py": "máng",
      "en": "busy"
     },
     {
      "k": "D",
      "zh": "知道",
      "py": "zhīdào",
      "en": "know"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "生病",
      "py": "shēng bìng",
      "en": "fall ill"
     }
    ],
    "answer": "A",
    "explain": "出去 (chūqù) — “He went out at 4 p.m. to shop.”"
   },
   {
    "type": "fill",
    "prompt": "我的小猫不想吃东西，我觉得它（___）了。",
    "pinyin": "Wǒ de xiǎo māo bù xiǎng chī dōngxi, wǒ juéde tā ___ le.",
    "en": "My kitten doesn't want to eat; I think it ___.",
    "options": [
     {
      "k": "A",
      "zh": "出去",
      "py": "chūqù",
      "en": "go out"
     },
     {
      "k": "B",
      "zh": "每",
      "py": "měi",
      "en": "every"
     },
     {
      "k": "C",
      "zh": "忙",
      "py": "máng",
      "en": "busy"
     },
     {
      "k": "D",
      "zh": "知道",
      "py": "zhīdào",
      "en": "know"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "生病",
      "py": "shēng bìng",
      "en": "fall ill"
     }
    ],
    "answer": "F",
    "explain": "生病 (shēng bìng) — not eating suggests the cat “has fallen ill.”"
   },
   {
    "type": "fill",
    "prompt": "我也不（___）北京的天气，你问问小李，他是北京人。",
    "pinyin": "Wǒ yě bù ___ Běijīng de tiānqì, nǐ wènwen Xiǎo Lǐ, tā shì Běijīng rén.",
    "en": "I don't ___ Beijing's weather either — ask Xiao Li, he's a Beijinger.",
    "options": [
     {
      "k": "A",
      "zh": "出去",
      "py": "chūqù",
      "en": "go out"
     },
     {
      "k": "B",
      "zh": "每",
      "py": "měi",
      "en": "every"
     },
     {
      "k": "C",
      "zh": "忙",
      "py": "máng",
      "en": "busy"
     },
     {
      "k": "D",
      "zh": "知道",
      "py": "zhīdào",
      "en": "know"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "生病",
      "py": "shēng bìng",
      "en": "fall ill"
     }
    ],
    "answer": "D",
    "explain": "知道 (zhīdào) — “I don't know about Beijing's weather either.”"
   },
   {
    "type": "tf",
    "context": "医生说我要住两天院，明天能出院。",
    "contextPy": "Yīshēng shuō wǒ yào zhù liǎng tiān yuàn, míngtiān néng chū yuàn.",
    "contextEn": "The doctor said I need a two-day stay and can leave the hospital tomorrow.",
    "statement": "我今天不能出院。",
    "statementPy": "Wǒ jīntiān bù néng chū yuàn.",
    "statementEn": "I can't leave the hospital today.",
    "answer": true,
    "explain": "Discharge is tomorrow, so leaving today isn't possible — the claim holds."
   },
   {
    "type": "tf",
    "context": "我的小猫生病了，你知道去哪个医院好吗？",
    "contextPy": "Wǒ de xiǎo māo shēng bìng le, nǐ zhīdào qù nǎge yīyuàn hǎo ma?",
    "contextEn": "My cat is sick — do you know which hospital is good?",
    "statement": "我的小猫现在好多了。",
    "statementPy": "Wǒ de xiǎo māo xiànzài hǎo duō le.",
    "statementEn": "My cat is much better now.",
    "answer": false,
    "explain": "The cat is sick right now and they're still looking for a hospital."
   },
   {
    "type": "tf",
    "context": "你星期天也去学校吗？太忙了！",
    "contextPy": "Nǐ xīngqītiān yě qù xuéxiào ma? Tài máng le!",
    "contextEn": "You go to school on Sundays too? So busy!",
    "statement": "他星期天不休息。",
    "statementPy": "Tā xīngqītiān bù xiūxi.",
    "statementEn": "He doesn't rest on Sundays.",
    "answer": true,
    "explain": "Going to school on Sunday means no rest that day — the claim is true."
   },
   {
    "type": "tf",
    "context": "这个药每天中午吃，晚饭后不要吃。",
    "contextPy": "Zhège yào měi tiān zhōngwǔ chī, wǎnfàn hòu búyào chī.",
    "contextEn": "Take this medicine at noon each day; don't take it after dinner.",
    "statement": "每天晚饭后吃药。",
    "statementPy": "Měi tiān wǎnfàn hòu chī yào.",
    "statementEn": "Take the medicine after dinner every day.",
    "answer": false,
    "explain": "It's taken at noon; the text says specifically not to take it after dinner."
   },
   {
    "type": "tf",
    "context": "我儿子不太高，他今年十四岁，一米五几。",
    "contextPy": "Wǒ érzi bú tài gāo, tā jīnnián shísì suì, yì mǐ wǔ jǐ.",
    "contextEn": "My son isn't very tall; he's 14 this year, about 1.5 metres.",
    "statement": "他儿子今年十多岁。",
    "statementPy": "Tā érzi jīnnián shí duō suì.",
    "statementEn": "His son is in his teens (ten-something) this year.",
    "answer": true,
    "explain": "十四岁 (14) falls within 十多岁 (“ten-something”), so the claim is true."
   }
  ],
  "images": {
   "A": "lesson-2-A.jpg",
   "B": "lesson-2-B.jpg",
   "C": "lesson-2-C.jpg",
   "D": "lesson-2-D.jpg",
   "E": "lesson-2-E.jpg",
   "F": "lesson-2-F.jpg"
  }
 },
 {
  "id": 3,
  "zh": "左边那个红色的是我的",
  "pinyin": "Zuǒbian nàge hóngsè de shì wǒ de",
  "en": "The red one on the left is mine",
  "questions": [
   {
    "type": "picture",
    "prompt": "这几块手表都不是我的。",
    "pinyin": "Zhè jǐ kuài shǒubiǎo dōu bú shì wǒ de.",
    "en": "None of these watches are mine.",
    "answer": "E",
    "explain": "“手表” (watches) → the wristwatches."
   },
   {
    "type": "picture",
    "prompt": "你身体不好，多喝水，休息一下吧。",
    "pinyin": "Nǐ shēntǐ bù hǎo, duō hē shuǐ, xiūxi yíxià ba.",
    "en": "You're unwell — drink more water and rest.",
    "answer": "A",
    "explain": "“喝水” (drink water) → the person drinking."
   },
   {
    "type": "picture",
    "prompt": "这个房间不是我的，是丽丽和文文的。",
    "pinyin": "Zhège fángjiān bú shì wǒ de, shì Lìli hé Wénwen de.",
    "en": "This room isn't mine; it's Lili and Wenwen's.",
    "answer": "F",
    "explain": "“房间” (room) → the bedroom."
   },
   {
    "type": "picture",
    "prompt": "他骑着车去送报纸。",
    "pinyin": "Tā qí zhe chē qù sòng bàozhǐ.",
    "en": "He rides a bike to deliver newspapers.",
    "answer": "C",
    "explain": "“骑着车” (riding a bike) → the cyclist."
   },
   {
    "type": "picture",
    "prompt": "前边的这个车是李老师的。",
    "pinyin": "Qiánbian de zhège chē shì Lǐ lǎoshī de.",
    "en": "The car up front is Teacher Li's.",
    "answer": "B",
    "explain": "“车” (car) → the row of cars."
   },
   {
    "type": "fill",
    "prompt": "今天的天气（___）好，我们出去玩儿玩儿吧。",
    "pinyin": "Jīntiān de tiānqì ___ hǎo, wǒmen chūqù wánr wánr ba.",
    "en": "Today's weather is ___ nice — let's go out and have some fun.",
    "options": [
     {
      "k": "A",
      "zh": "送",
      "py": "sòng",
      "en": "give / deliver"
     },
     {
      "k": "B",
      "zh": "真",
      "py": "zhēn",
      "en": "really"
     },
     {
      "k": "C",
      "zh": "一下",
      "py": "yíxià",
      "en": "(a bit / once)"
     },
     {
      "k": "D",
      "zh": "旁边",
      "py": "pángbiān",
      "en": "beside"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "千",
      "py": "qiān",
      "en": "thousand"
     }
    ],
    "answer": "B",
    "explain": "真 (zhēn) — “The weather is really nice today.”"
   },
   {
    "type": "fill",
    "prompt": "我也不知道吃什么，我想（___）。",
    "pinyin": "Wǒ yě bù zhīdào chī shénme, wǒ xiǎng ___.",
    "en": "I don't know what to eat either — let me think ___.",
    "options": [
     {
      "k": "A",
      "zh": "送",
      "py": "sòng",
      "en": "give / deliver"
     },
     {
      "k": "B",
      "zh": "真",
      "py": "zhēn",
      "en": "really"
     },
     {
      "k": "C",
      "zh": "一下",
      "py": "yíxià",
      "en": "(a bit / once)"
     },
     {
      "k": "D",
      "zh": "旁边",
      "py": "pángbiān",
      "en": "beside"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "千",
      "py": "qiān",
      "en": "thousand"
     }
    ],
    "answer": "C",
    "explain": "一下 (yíxià) — 想一下 means “think (it over) a little.”"
   },
   {
    "type": "fill",
    "prompt": "我丈夫在医院呢，我要去给他（___）饭。",
    "pinyin": "Wǒ zhàngfu zài yīyuàn ne, wǒ yào qù gěi tā ___ fàn.",
    "en": "My husband is in hospital; I'm going to ___ him a meal.",
    "options": [
     {
      "k": "A",
      "zh": "送",
      "py": "sòng",
      "en": "give / deliver"
     },
     {
      "k": "B",
      "zh": "真",
      "py": "zhēn",
      "en": "really"
     },
     {
      "k": "C",
      "zh": "一下",
      "py": "yíxià",
      "en": "(a bit / once)"
     },
     {
      "k": "D",
      "zh": "旁边",
      "py": "pángbiān",
      "en": "beside"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "千",
      "py": "qiān",
      "en": "thousand"
     }
    ],
    "answer": "A",
    "explain": "送 (sòng) — 送饭 means “take/deliver a meal to someone.”"
   },
   {
    "type": "fill",
    "prompt": "这块手表一（___）多块钱，我有八百块，你有多少钱？",
    "pinyin": "Zhè kuài shǒubiǎo yì ___ duō kuài qián, wǒ yǒu bā bǎi kuài, nǐ yǒu duōshao qián?",
    "en": "This watch is over a ___ yuan; I have 800, how much do you have?",
    "options": [
     {
      "k": "A",
      "zh": "送",
      "py": "sòng",
      "en": "give / deliver"
     },
     {
      "k": "B",
      "zh": "真",
      "py": "zhēn",
      "en": "really"
     },
     {
      "k": "C",
      "zh": "一下",
      "py": "yíxià",
      "en": "(a bit / once)"
     },
     {
      "k": "D",
      "zh": "旁边",
      "py": "pángbiān",
      "en": "beside"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "千",
      "py": "qiān",
      "en": "thousand"
     }
    ],
    "answer": "F",
    "explain": "千 (qiān) — 一千多块钱 means “over one thousand yuan.”"
   },
   {
    "type": "fill",
    "prompt": "妈妈在做饭呢，爸爸在桌子（___）看报纸呢。",
    "pinyin": "Māma zài zuò fàn ne, bàba zài zhuōzi ___ kàn bàozhǐ ne.",
    "en": "Mom is cooking; Dad is reading the paper ___ the table.",
    "options": [
     {
      "k": "A",
      "zh": "送",
      "py": "sòng",
      "en": "give / deliver"
     },
     {
      "k": "B",
      "zh": "真",
      "py": "zhēn",
      "en": "really"
     },
     {
      "k": "C",
      "zh": "一下",
      "py": "yíxià",
      "en": "(a bit / once)"
     },
     {
      "k": "D",
      "zh": "旁边",
      "py": "pángbiān",
      "en": "beside"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "千",
      "py": "qiān",
      "en": "thousand"
     }
    ],
    "answer": "D",
    "explain": "旁边 (pángbiān) — “beside the table.” It marks a location."
   },
   {
    "type": "tf",
    "context": "这个房间是丽丽的，她喜欢粉色的房间。",
    "contextPy": "Zhège fángjiān shì Lìli de, tā xǐhuan fěnsè de fángjiān.",
    "contextEn": "This room is Lili's; she likes pink rooms.",
    "statement": "丽丽的房间是粉色的。",
    "statementPy": "Lìli de fángjiān shì fěnsè de.",
    "statementEn": "Lili's room is pink.",
    "answer": true,
    "explain": "It's her room and she likes pink rooms, so her room being pink follows."
   },
   {
    "type": "tf",
    "context": "桌子上的报纸是昨天的，今天送报纸的没来。",
    "contextPy": "Zhuōzi shang de bàozhǐ shì zuótiān de, jīntiān sòng bàozhǐ de méi lái.",
    "contextEn": "The paper on the table is yesterday's; today's delivery person didn't come.",
    "statement": "桌子上的报纸不是今天的。",
    "statementPy": "Zhuōzi shang de bàozhǐ bú shì jīntiān de.",
    "statementEn": "The paper on the table isn't today's.",
    "answer": true,
    "explain": "It's stated to be yesterday's paper, so it isn't today's — the claim is true."
   },
   {
    "type": "tf",
    "context": "你的药在房间里，这是爸爸的。",
    "contextPy": "Nǐ de yào zài fángjiān li, zhè shì bàba de.",
    "contextEn": "Your medicine is in the room; this one is Dad's.",
    "statement": "房间里的药是爸爸的。",
    "statementPy": "Fángjiān li de yào shì bàba de.",
    "statementEn": "The medicine in the room is Dad's.",
    "answer": false,
    "explain": "The medicine in the room is “yours”; the one here (not in the room) is Dad's."
   },
   {
    "type": "tf",
    "context": "这块手表是昨天买的，我很喜欢。",
    "contextPy": "Zhè kuài shǒubiǎo shì zuótiān mǎi de, wǒ hěn xǐhuan.",
    "contextEn": "This watch was bought yesterday; I like it a lot.",
    "statement": "我昨天买了一块手表。",
    "statementPy": "Wǒ zuótiān mǎi le yí kuài shǒubiǎo.",
    "statementEn": "I bought a watch yesterday.",
    "answer": true,
    "explain": "“This watch was bought yesterday” directly supports the claim."
   },
   {
    "type": "tf",
    "context": "小王，你喜欢哪个颜色的杯子？给你一个。",
    "contextPy": "Xiǎo Wáng, nǐ xǐhuan nǎge yánsè de bēizi? Gěi nǐ yí ge.",
    "contextEn": "Xiao Wang, which color cup do you like? I'll give you one.",
    "statement": "他要给小王一个红色杯子。",
    "statementPy": "Tā yào gěi Xiǎo Wáng yí ge hóngsè bēizi.",
    "statementEn": "He'll give Xiao Wang a red cup.",
    "answer": false,
    "explain": "He's still asking which color Xiao Wang prefers — no color (red) has been decided."
   }
  ],
  "images": {
   "A": "lesson-3-A.jpg",
   "B": "lesson-3-B.jpg",
   "C": "lesson-3-C.jpg",
   "D": "lesson-3-D.jpg",
   "E": "lesson-3-E.jpg",
   "F": "lesson-3-F.jpg"
  }
 },
 {
  "id": 4,
  "zh": "这个工作是他帮我介绍的",
  "pinyin": "Zhège gōngzuò shì tā bāng wǒ jièshào de",
  "en": "He recommended me for this job",
  "questions": [
   {
    "type": "picture",
    "prompt": "汤姆先生介绍我们认识的。",
    "pinyin": "Tāngmǔ xiānsheng jièshào wǒmen rènshi de.",
    "en": "Mr. Tom is the one who introduced us.",
    "answer": "E",
    "explain": "“介绍…认识” (introduced us) → the handshake."
   },
   {
    "type": "picture",
    "prompt": "爸爸已经回来了，他在看电视呢。",
    "pinyin": "Bàba yǐjīng huílai le, tā zài kàn diànshì ne.",
    "en": "Dad is back already; he's watching TV.",
    "answer": "C",
    "explain": "“看电视” (watching TV) → the person on the sofa facing a TV."
   },
   {
    "type": "picture",
    "prompt": "昨天是我的生日，这是我丈夫送给我的。",
    "pinyin": "Zuótiān shì wǒ de shēngrì, zhè shì wǒ zhàngfu sòng gěi wǒ de.",
    "en": "Yesterday was my birthday; my husband gave me this.",
    "answer": "A",
    "explain": "“生日…送给我的” (a birthday gift) → the wrapped present."
   },
   {
    "type": "picture",
    "prompt": "晚饭是李小姐帮我做的。",
    "pinyin": "Wǎnfàn shì Lǐ xiǎojiě bāng wǒ zuò de.",
    "en": "Miss Li made dinner for me.",
    "answer": "F",
    "explain": "“做（晚饭）” (cooking dinner) → the women cooking."
   },
   {
    "type": "picture",
    "prompt": "张先生非常忙，晚上不能回家。",
    "pinyin": "Zhāng xiānsheng fēicháng máng, wǎnshang bù néng huí jiā.",
    "en": "Mr. Zhang is very busy and can't go home at night.",
    "answer": "B",
    "explain": "“非常忙” (very busy) → the man working late."
   },
   {
    "type": "fill",
    "prompt": "我身体不好，不能去学校，你（___）我给王老师打个电话吧。",
    "pinyin": "Wǒ shēntǐ bù hǎo, bù néng qù xuéxiào, nǐ ___ wǒ gěi Wáng lǎoshī dǎ ge diànhuà ba.",
    "en": "I'm unwell and can't go to school — please ___ me make a call to Teacher Wang.",
    "options": [
     {
      "k": "A",
      "zh": "介绍",
      "py": "jièshào",
      "en": "introduce"
     },
     {
      "k": "B",
      "zh": "帮",
      "py": "bāng",
      "en": "help"
     },
     {
      "k": "C",
      "zh": "给",
      "py": "gěi",
      "en": "to / for"
     },
     {
      "k": "D",
      "zh": "非常",
      "py": "fēicháng",
      "en": "very"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "已经",
      "py": "yǐjīng",
      "en": "already"
     }
    ],
    "answer": "B",
    "explain": "帮 (bāng) — 你帮我打电话 means “you help me make a call.”"
   },
   {
    "type": "fill",
    "prompt": "明天是丽丽的生日，你想送（___）她什么？",
    "pinyin": "Míngtiān shì Lìli de shēngrì, nǐ xiǎng sòng ___ tā shénme?",
    "en": "Tomorrow is Lili's birthday — what do you want to give ___ her?",
    "options": [
     {
      "k": "A",
      "zh": "介绍",
      "py": "jièshào",
      "en": "introduce"
     },
     {
      "k": "B",
      "zh": "帮",
      "py": "bāng",
      "en": "help"
     },
     {
      "k": "C",
      "zh": "给",
      "py": "gěi",
      "en": "to / for"
     },
     {
      "k": "D",
      "zh": "非常",
      "py": "fēicháng",
      "en": "very"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "已经",
      "py": "yǐjīng",
      "en": "already"
     }
    ],
    "answer": "C",
    "explain": "给 (gěi) — 送给她 means “give to her.”"
   },
   {
    "type": "fill",
    "prompt": "这本书（___）好，我们都看了，你也看看吧。",
    "pinyin": "Zhè běn shū ___ hǎo, wǒmen dōu kàn le, nǐ yě kànkan ba.",
    "en": "This book is ___ good — we've all read it; you should take a look too.",
    "options": [
     {
      "k": "A",
      "zh": "介绍",
      "py": "jièshào",
      "en": "introduce"
     },
     {
      "k": "B",
      "zh": "帮",
      "py": "bāng",
      "en": "help"
     },
     {
      "k": "C",
      "zh": "给",
      "py": "gěi",
      "en": "to / for"
     },
     {
      "k": "D",
      "zh": "非常",
      "py": "fēicháng",
      "en": "very"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "已经",
      "py": "yǐjīng",
      "en": "already"
     }
    ],
    "answer": "D",
    "explain": "非常 (fēicháng) — “extremely / very” good."
   },
   {
    "type": "fill",
    "prompt": "医生说你的病（___）好了，明天开始不吃这个药了。",
    "pinyin": "Yīshēng shuō nǐ de bìng ___ hǎo le, míngtiān kāishǐ bù chī zhège yào le.",
    "en": "The doctor says your illness has ___ healed — from tomorrow you'll stop this medicine.",
    "options": [
     {
      "k": "A",
      "zh": "介绍",
      "py": "jièshào",
      "en": "introduce"
     },
     {
      "k": "B",
      "zh": "帮",
      "py": "bāng",
      "en": "help"
     },
     {
      "k": "C",
      "zh": "给",
      "py": "gěi",
      "en": "to / for"
     },
     {
      "k": "D",
      "zh": "非常",
      "py": "fēicháng",
      "en": "very"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "已经",
      "py": "yǐjīng",
      "en": "already"
     }
    ],
    "answer": "F",
    "explain": "已经 (yǐjīng) — 已经好了 means “has already recovered.”"
   },
   {
    "type": "fill",
    "prompt": "你认识李先生吗？能不能给我（___）一下。",
    "pinyin": "Nǐ rènshi Lǐ xiānsheng ma? Néng bu néng gěi wǒ ___ yíxià.",
    "en": "Do you know Mr. Li? Could you ___ him to me?",
    "options": [
     {
      "k": "A",
      "zh": "介绍",
      "py": "jièshào",
      "en": "introduce"
     },
     {
      "k": "B",
      "zh": "帮",
      "py": "bāng",
      "en": "help"
     },
     {
      "k": "C",
      "zh": "给",
      "py": "gěi",
      "en": "to / for"
     },
     {
      "k": "D",
      "zh": "非常",
      "py": "fēicháng",
      "en": "very"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "已经",
      "py": "yǐjīng",
      "en": "already"
     }
    ],
    "answer": "A",
    "explain": "介绍 (jièshào) — 介绍一下 means “(make) an introduction.”"
   },
   {
    "type": "tf",
    "context": "妈妈做晚饭了，晚上我们回家吃饭吧。",
    "contextPy": "Māma zuò wǎnfàn le, wǎnshang wǒmen huí jiā chī fàn ba.",
    "contextEn": "Mom has made dinner — let's go home to eat tonight.",
    "statement": "他们晚上不出去吃饭。",
    "statementPy": "Tāmen wǎnshang bù chūqù chī fàn.",
    "statementEn": "They won't eat out tonight.",
    "answer": true,
    "explain": "Going home to eat means they aren't eating out."
   },
   {
    "type": "tf",
    "context": "下午我睡觉的时候有一个电话，我没接。",
    "contextPy": "Xiàwǔ wǒ shuì jiào de shíhou yǒu yí ge diànhuà, wǒ méi jiē.",
    "contextEn": "A call came while I was napping this afternoon, and I didn't answer.",
    "statement": "我不知道电话是谁打的。",
    "statementPy": "Wǒ bù zhīdào diànhuà shì shéi dǎ de.",
    "statementEn": "I don't know who called.",
    "answer": true,
    "explain": "They didn't pick up, so they couldn't know who it was."
   },
   {
    "type": "tf",
    "context": "明天是你的生日，明天晚上我不工作。",
    "contextPy": "Míngtiān shì nǐ de shēngrì, míngtiān wǎnshang wǒ bù gōngzuò.",
    "contextEn": "Tomorrow is your birthday; tomorrow evening I'm not working.",
    "statement": "他明天晚上没有时间。",
    "statementPy": "Tā míngtiān wǎnshang méiyǒu shíjiān.",
    "statementEn": "He has no time tomorrow evening.",
    "answer": false,
    "explain": "He's taking the evening off, so he does have time."
   },
   {
    "type": "tf",
    "context": "你问一下爸爸什么时候去踢足球。",
    "contextPy": "Nǐ wèn yíxià bàba shénme shíhou qù tī zúqiú.",
    "contextEn": "Ask Dad when he's going to play soccer.",
    "statement": "爸爸要踢足球。",
    "statementPy": "Bàba yào tī zúqiú.",
    "statementEn": "Dad is going to play soccer.",
    "answer": true,
    "explain": "Asking “when” he'll play assumes he is going to."
   },
   {
    "type": "tf",
    "context": "山姆，我给你介绍一下，这是我的大学同学谢力。",
    "contextPy": "Shānmǔ, wǒ gěi nǐ jièshào yíxià, zhè shì wǒ de dàxué tóngxué Xiè Lì.",
    "contextEn": "Sam, let me introduce you — this is my university classmate Xie Li.",
    "statement": "我和谢力是大学的时候认识的。",
    "statementPy": "Wǒ hé Xiè Lì shì dàxué de shíhou rènshi de.",
    "statementEn": "Xie Li and I met during university.",
    "answer": true,
    "explain": "Being university classmates means they met at university."
   }
  ],
  "images": {
   "A": "lesson-4-A.jpg",
   "B": "lesson-4-B.jpg",
   "C": "lesson-4-C.jpg",
   "D": "lesson-4-D.jpg",
   "E": "lesson-4-E.jpg",
   "F": "lesson-4-F.jpg"
  }
 },
 {
  "id": 5,
  "zh": "就买这件吧",
  "pinyin": "Jiù mǎi zhè jiàn ba",
  "en": "Take this one",
  "questions": [
   {
    "type": "picture",
    "prompt": "今天是爸爸的生日，我们就去外面吃饭吧。",
    "pinyin": "Jīntiān shì bàba de shēngrì, wǒmen jiù qù wàimian chī fàn ba.",
    "en": "It's Dad's birthday — let's eat out.",
    "answer": "E",
    "explain": "“去外面吃饭” (eating out) → the group around a full table."
   },
   {
    "type": "picture",
    "prompt": "妈妈做了你最爱吃的菜。",
    "pinyin": "Māma zuòle nǐ zuì ài chī de cài.",
    "en": "Mom made your favorite dish.",
    "answer": "F",
    "explain": "“菜” (dish) → the plate of food."
   },
   {
    "type": "picture",
    "prompt": "我有点儿累，休息一下。",
    "pinyin": "Wǒ yǒudiǎnr lèi, xiūxi yíxià.",
    "en": "I'm a little tired; I'll rest a bit.",
    "answer": "B",
    "explain": "“累…休息” (tired, resting) → the man wiping his brow."
   },
   {
    "type": "picture",
    "prompt": "他这几天要准备考试，我没给他打电话。",
    "pinyin": "Tā zhè jǐ tiān yào zhǔnbèi kǎoshì, wǒ méi gěi tā dǎ diànhuà.",
    "en": "He's been preparing for an exam, so I didn't call him.",
    "answer": "A",
    "explain": "“准备考试” (studying for an exam) → the person at the desk with a book."
   },
   {
    "type": "picture",
    "prompt": "我不喝了，我已经喝了三杯了。",
    "pinyin": "Wǒ bù hē le, wǒ yǐjīng hēle sān bēi le.",
    "en": "I won't drink more; I've already had three cups.",
    "answer": "C",
    "explain": "“喝了三杯” (had three cups) → the woman with a cup."
   },
   {
    "type": "fill",
    "prompt": "王方，你去买一点儿水果（___）。",
    "pinyin": "Wáng Fāng, nǐ qù mǎi yìdiǎnr shuǐguǒ ___.",
    "en": "Wang Fang, go buy some fruit ___.",
    "options": [
     {
      "k": "A",
      "zh": "就",
      "py": "jiù",
      "en": "then / just"
     },
     {
      "k": "B",
      "zh": "吧",
      "py": "ba",
      "en": "(suggestion)"
     },
     {
      "k": "C",
      "zh": "还",
      "py": "hái",
      "en": "still / fairly"
     },
     {
      "k": "D",
      "zh": "对",
      "py": "duì",
      "en": "to / for"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "以后",
      "py": "yǐhòu",
      "en": "after"
     }
    ],
    "answer": "B",
    "explain": "吧 (ba) — a softening particle that turns it into a suggestion."
   },
   {
    "type": "fill",
    "prompt": "我下午四点考试，考试（___）给你打电话。",
    "pinyin": "Wǒ xiàwǔ sì diǎn kǎoshì, kǎoshì ___ gěi nǐ dǎ diànhuà.",
    "en": "I have an exam at 4 p.m.; ___ the exam I'll call you.",
    "options": [
     {
      "k": "A",
      "zh": "就",
      "py": "jiù",
      "en": "then / just"
     },
     {
      "k": "B",
      "zh": "吧",
      "py": "ba",
      "en": "(suggestion)"
     },
     {
      "k": "C",
      "zh": "还",
      "py": "hái",
      "en": "still / fairly"
     },
     {
      "k": "D",
      "zh": "对",
      "py": "duì",
      "en": "to / for"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "以后",
      "py": "yǐhòu",
      "en": "after"
     }
    ],
    "answer": "F",
    "explain": "以后 (yǐhòu) — 考试以后 means “after the exam.”"
   },
   {
    "type": "fill",
    "prompt": "我有两本，你喜欢（___）送给你一本。",
    "pinyin": "Wǒ yǒu liǎng běn, nǐ xǐhuan ___ sòng gěi nǐ yì běn.",
    "en": "I have two; if you like it ___ I'll give you one.",
    "options": [
     {
      "k": "A",
      "zh": "就",
      "py": "jiù",
      "en": "then / just"
     },
     {
      "k": "B",
      "zh": "吧",
      "py": "ba",
      "en": "(suggestion)"
     },
     {
      "k": "C",
      "zh": "还",
      "py": "hái",
      "en": "still / fairly"
     },
     {
      "k": "D",
      "zh": "对",
      "py": "duì",
      "en": "to / for"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "以后",
      "py": "yǐhòu",
      "en": "after"
     }
    ],
    "answer": "A",
    "explain": "就 (jiù) — “then I'll just give you one.”"
   },
   {
    "type": "fill",
    "prompt": "我太忙了，没时间运动，我知道运动（___）身体很好。",
    "pinyin": "Wǒ tài máng le, méi shíjiān yùndòng, wǒ zhīdào yùndòng ___ shēntǐ hěn hǎo.",
    "en": "I'm too busy to exercise; I know exercise is good ___ the body.",
    "options": [
     {
      "k": "A",
      "zh": "就",
      "py": "jiù",
      "en": "then / just"
     },
     {
      "k": "B",
      "zh": "吧",
      "py": "ba",
      "en": "(suggestion)"
     },
     {
      "k": "C",
      "zh": "还",
      "py": "hái",
      "en": "still / fairly"
     },
     {
      "k": "D",
      "zh": "对",
      "py": "duì",
      "en": "to / for"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "以后",
      "py": "yǐhòu",
      "en": "after"
     }
    ],
    "answer": "D",
    "explain": "对 (duì) — 对身体很好 means “good for the body.”"
   },
   {
    "type": "fill",
    "prompt": "今天的菜（___）可以，都是我丈夫做的。",
    "pinyin": "Jīntiān de cài ___ kěyǐ, dōu shì wǒ zhàngfu zuò de.",
    "en": "Today's food is ___ okay — my husband made it all.",
    "options": [
     {
      "k": "A",
      "zh": "就",
      "py": "jiù",
      "en": "then / just"
     },
     {
      "k": "B",
      "zh": "吧",
      "py": "ba",
      "en": "(suggestion)"
     },
     {
      "k": "C",
      "zh": "还",
      "py": "hái",
      "en": "still / fairly"
     },
     {
      "k": "D",
      "zh": "对",
      "py": "duì",
      "en": "to / for"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "以后",
      "py": "yǐhòu",
      "en": "after"
     }
    ],
    "answer": "C",
    "explain": "还 (hái) — 还可以 means “pretty good / not bad.”"
   },
   {
    "type": "tf",
    "context": "三百块钱还可以，你喜欢就买吧。",
    "contextPy": "Sān bǎi kuài qián hái kěyǐ, nǐ xǐhuan jiù mǎi ba.",
    "contextEn": "Three hundred yuan is reasonable — if you like it, buy it.",
    "statement": "她不喜欢这件衣服。",
    "statementPy": "Tā bù xǐhuan zhè jiàn yīfu.",
    "statementEn": "She doesn't like this piece of clothing.",
    "answer": false,
    "explain": "The speaker says to buy it if she likes it — nothing says she dislikes it."
   },
   {
    "type": "tf",
    "context": "我们一起准备晚饭，你做鱼，我做菜。",
    "contextPy": "Wǒmen yìqǐ zhǔnbèi wǎnfàn, nǐ zuò yú, wǒ zuò cài.",
    "contextEn": "Let's make dinner together — you do the fish, I'll do the dishes.",
    "statement": "他们不去外面吃饭。",
    "statementPy": "Tāmen bú qù wàimian chī fàn.",
    "statementEn": "They won't eat out.",
    "answer": true,
    "explain": "Cooking dinner at home means they aren't eating out."
   },
   {
    "type": "tf",
    "context": "昨天的考试读和写不太好。",
    "contextPy": "Zuótiān de kǎoshì dú hé xiě bú tài hǎo.",
    "contextEn": "On yesterday's exam, reading and writing didn't go very well.",
    "statement": "他在想昨天的考试呢。",
    "statementPy": "Tā zài xiǎng zuótiān de kǎoshì ne.",
    "statementEn": "He's thinking about yesterday's exam.",
    "answer": false,
    "explain": "The text reports how the exam went; it doesn't say anyone is thinking about it."
   },
   {
    "type": "tf",
    "context": "我中午有点儿累，喝了两杯咖啡。",
    "contextPy": "Wǒ zhōngwǔ yǒudiǎnr lèi, hē le liǎng bēi kāfēi.",
    "contextEn": "I was a bit tired at noon, so I drank two cups of coffee.",
    "statement": "他累的时候喝咖啡。",
    "statementPy": "Tā lèi de shíhou hē kāfēi.",
    "statementEn": "He drinks coffee when he's tired.",
    "answer": true,
    "explain": "Feeling tired led to drinking coffee, matching the claim."
   },
   {
    "type": "tf",
    "context": "你少喝一点儿吧，喝多了对身体不好。",
    "contextPy": "Nǐ shǎo hē yìdiǎnr ba, hē duō le duì shēntǐ bù hǎo.",
    "contextEn": "Drink a little less — drinking too much is bad for your health.",
    "statement": "他的身体不太好。",
    "statementPy": "Tā de shēntǐ bú tài hǎo.",
    "statementEn": "His health isn't very good.",
    "answer": false,
    "explain": "The advice is about not over-drinking; it doesn't say his health is poor."
   }
  ],
  "images": {
   "A": "lesson-5-A.jpg",
   "B": "lesson-5-B.jpg",
   "C": "lesson-5-C.jpg",
   "D": "lesson-5-D.jpg",
   "E": "lesson-5-E.jpg",
   "F": "lesson-5-F.jpg"
  }
 },
 {
  "id": 6,
  "zh": "你怎么不吃了",
  "pinyin": "Nǐ zěnme bù chī le",
  "en": "Why don't you eat more",
  "questions": [
   {
    "type": "picture",
    "prompt": "你的新家很漂亮，我想去你家玩儿。",
    "pinyin": "Nǐ de xīn jiā hěn piàoliang, wǒ xiǎng qù nǐ jiā wánr.",
    "en": "Your new home is lovely; I'd like to visit.",
    "answer": "B",
    "explain": "“新家” (new home) → the house."
   },
   {
    "type": "picture",
    "prompt": "我和朋友们买的衣服件件都很贵。",
    "pinyin": "Wǒ hé péngyoumen mǎi de yīfu jiànjiàn dōu hěn guì.",
    "en": "Every piece of clothing my friends and I bought is pricey.",
    "answer": "E",
    "explain": "“买的衣服” (shopping for clothes) → the women with shopping bags."
   },
   {
    "type": "picture",
    "prompt": "这个星期天天吃羊肉，我想吃鱼了。",
    "pinyin": "Zhège xīngqī tiāntiān chī yángròu, wǒ xiǎng chī yú le.",
    "en": "I've had mutton all week; I feel like fish now.",
    "answer": "F",
    "explain": "“鱼” (fish) → the piece of fish."
   },
   {
    "type": "picture",
    "prompt": "我每天运动，现在五十公斤了。",
    "pinyin": "Wǒ měi tiān yùndòng, xiànzài wǔshí gōngjīn le.",
    "en": "I exercise daily; I'm fifty kilos now.",
    "answer": "C",
    "explain": "“运动” (exercise) → the person stretching."
   },
   {
    "type": "picture",
    "prompt": "听说李朋和他女朋友去旅游了。",
    "pinyin": "Tīngshuō Lǐ Péng hé tā nǚpéngyou qù lǚyóu le.",
    "en": "I heard Li Peng and his girlfriend went traveling.",
    "answer": "A",
    "explain": "“去旅游” (traveling) → the couple with a backpack."
   },
   {
    "type": "fill",
    "prompt": "昨天下雨了，所以我们都没去（___）篮球。",
    "pinyin": "Zuótiān xià yǔ le, suǒyǐ wǒmen dōu méi qù ___ lánqiú.",
    "en": "It rained yesterday, so none of us went to ___ basketball.",
    "options": [
     {
      "k": "A",
      "zh": "件件",
      "py": "jiàn jiàn",
      "en": "every one"
     },
     {
      "k": "B",
      "zh": "因为",
      "py": "yīnwèi",
      "en": "because"
     },
     {
      "k": "C",
      "zh": "打",
      "py": "dǎ",
      "en": "play"
     },
     {
      "k": "D",
      "zh": "经常",
      "py": "jīngcháng",
      "en": "often"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公斤",
      "py": "gōngjīn",
      "en": "kilogram"
     }
    ],
    "answer": "C",
    "explain": "打 (dǎ) — 打篮球 means “play basketball.”"
   },
   {
    "type": "fill",
    "prompt": "这家商店的衣服（___）都漂亮。",
    "pinyin": "Zhè jiā shāngdiàn de yīfu ___ dōu piàoliang.",
    "en": "The clothes in this shop are ___ all pretty.",
    "options": [
     {
      "k": "A",
      "zh": "件件",
      "py": "jiàn jiàn",
      "en": "every one"
     },
     {
      "k": "B",
      "zh": "因为",
      "py": "yīnwèi",
      "en": "because"
     },
     {
      "k": "C",
      "zh": "打",
      "py": "dǎ",
      "en": "play"
     },
     {
      "k": "D",
      "zh": "经常",
      "py": "jīngcháng",
      "en": "often"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公斤",
      "py": "gōngjīn",
      "en": "kilogram"
     }
    ],
    "answer": "A",
    "explain": "件件 (jiàn jiàn) — “every single piece.”"
   },
   {
    "type": "fill",
    "prompt": "我（___）跟同学们一起学习汉语。",
    "pinyin": "Wǒ ___ gēn tóngxuémen yìqǐ xuéxí Hànyǔ.",
    "en": "I ___ study Chinese together with my classmates.",
    "options": [
     {
      "k": "A",
      "zh": "件件",
      "py": "jiàn jiàn",
      "en": "every one"
     },
     {
      "k": "B",
      "zh": "因为",
      "py": "yīnwèi",
      "en": "because"
     },
     {
      "k": "C",
      "zh": "打",
      "py": "dǎ",
      "en": "play"
     },
     {
      "k": "D",
      "zh": "经常",
      "py": "jīngcháng",
      "en": "often"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公斤",
      "py": "gōngjīn",
      "en": "kilogram"
     }
    ],
    "answer": "D",
    "explain": "经常 (jīngcháng) — “often.”"
   },
   {
    "type": "fill",
    "prompt": "（___）工作很忙，所以我没有时间运动。",
    "pinyin": "___ gōngzuò hěn máng, suǒyǐ wǒ méiyǒu shíjiān yùndòng.",
    "en": "___ work is busy, I have no time to exercise.",
    "options": [
     {
      "k": "A",
      "zh": "件件",
      "py": "jiàn jiàn",
      "en": "every one"
     },
     {
      "k": "B",
      "zh": "因为",
      "py": "yīnwèi",
      "en": "because"
     },
     {
      "k": "C",
      "zh": "打",
      "py": "dǎ",
      "en": "play"
     },
     {
      "k": "D",
      "zh": "经常",
      "py": "jīngcháng",
      "en": "often"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公斤",
      "py": "gōngjīn",
      "en": "kilogram"
     }
    ],
    "answer": "B",
    "explain": "因为 (yīnwèi) — pairs with 所以: “because… therefore…”"
   },
   {
    "type": "fill",
    "prompt": "你知道一（___）苹果多少钱吗？",
    "pinyin": "Nǐ zhīdào yì ___ píngguǒ duōshao qián ma?",
    "en": "Do you know how much one ___ of apples costs?",
    "options": [
     {
      "k": "A",
      "zh": "件件",
      "py": "jiàn jiàn",
      "en": "every one"
     },
     {
      "k": "B",
      "zh": "因为",
      "py": "yīnwèi",
      "en": "because"
     },
     {
      "k": "C",
      "zh": "打",
      "py": "dǎ",
      "en": "play"
     },
     {
      "k": "D",
      "zh": "经常",
      "py": "jīngcháng",
      "en": "often"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公斤",
      "py": "gōngjīn",
      "en": "kilogram"
     }
    ],
    "answer": "F",
    "explain": "公斤 (gōngjīn) — “kilogram.”"
   },
   {
    "type": "tf",
    "context": "我在门外看见小王的自行车了。",
    "contextPy": "Wǒ zài mén wài kànjiàn Xiǎo Wáng de zìxíngchē le.",
    "contextEn": "I saw Xiao Wang's bicycle outside the door.",
    "statement": "小王来了，我看见他了。",
    "statementPy": "Xiǎo Wáng lái le, wǒ kànjiàn tā le.",
    "statementEn": "Xiao Wang came; I saw him.",
    "answer": false,
    "explain": "Only the bicycle was seen — not Xiao Wang himself."
   },
   {
    "type": "tf",
    "context": "天天都吃羊肉，有鸡蛋面条吗？",
    "contextPy": "Tiāntiān dōu chī yángròu, yǒu jīdàn miàntiáo ma?",
    "contextEn": "We eat mutton every day — is there any egg noodles?",
    "statement": "我不想吃羊肉了。",
    "statementPy": "Wǒ bù xiǎng chī yángròu le.",
    "statementEn": "I don't want to eat mutton anymore.",
    "answer": true,
    "explain": "Asking for noodles after “mutton every day” shows they're tired of it."
   },
   {
    "type": "tf",
    "context": "因为昨天下雨，所以我们都没去打篮球。",
    "contextPy": "Yīnwèi zuótiān xià yǔ, suǒyǐ wǒmen dōu méi qù dǎ lánqiú.",
    "contextEn": "Because it rained yesterday, none of us went to play basketball.",
    "statement": "昨天天气不好。",
    "statementPy": "Zuótiān tiānqì bù hǎo.",
    "statementEn": "Yesterday's weather was bad.",
    "answer": true,
    "explain": "Rain means the weather was bad."
   },
   {
    "type": "tf",
    "context": "听说小王去北京看他姐姐了，所以没来学校。",
    "contextPy": "Tīngshuō Xiǎo Wáng qù Běijīng kàn tā jiějie le, suǒyǐ méi lái xuéxiào.",
    "contextEn": "I heard Xiao Wang went to Beijing to see his sister, so he didn't come to school.",
    "statement": "小王现在在北京呢。",
    "statementPy": "Xiǎo Wáng xiànzài zài Běijīng ne.",
    "statementEn": "Xiao Wang is in Beijing now.",
    "answer": true,
    "explain": "He went to Beijing to see his sister, so he's there."
   },
   {
    "type": "tf",
    "context": "爸爸在医院工作，他每天都很忙，所以很少有时间休息。",
    "contextPy": "Bàba zài yīyuàn gōngzuò, tā měi tiān dōu hěn máng, suǒyǐ hěn shǎo yǒu shíjiān xiūxi.",
    "contextEn": "Dad works at a hospital; he's busy every day, so he rarely has time to rest.",
    "statement": "爸爸是大夫，他在医院工作。",
    "statementPy": "Bàba shì dàifu, tā zài yīyuàn gōngzuò.",
    "statementEn": "Dad is a doctor working at a hospital.",
    "answer": false,
    "explain": "He works at a hospital, but the text never says he's a doctor."
   }
  ],
  "images": {
   "A": "lesson-6-A.jpg",
   "B": "lesson-6-B.jpg",
   "C": "lesson-6-C.jpg",
   "D": "lesson-6-D.jpg",
   "E": "lesson-6-E.jpg",
   "F": "lesson-6-F.jpg"
  }
 },
 {
  "id": 7,
  "zh": "你家离公司远吗",
  "pinyin": "Nǐ jiā lí gōngsī yuǎn ma",
  "en": "Do you live far from your company",
  "questions": [
   {
    "type": "picture",
    "prompt": "今天的午饭太好吃了，我还想再来点儿呢。",
    "pinyin": "Jīntiān de wǔfàn tài hǎochī le, wǒ hái xiǎng zài lái diǎnr ne.",
    "en": "Lunch was delicious today; I'd like some more.",
    "answer": "F",
    "explain": "“好吃…再来点儿” (tasty, want more) → the woman happily eating."
   },
   {
    "type": "picture",
    "prompt": "因为下雨，他不能踢足球了，所以有点儿不高兴。",
    "pinyin": "Yīnwèi xià yǔ, tā bù néng tī zúqiú le, suǒyǐ yǒudiǎnr bù gāoxìng.",
    "en": "Rain stopped his soccer, so he's a bit upset.",
    "answer": "C",
    "explain": "“不高兴” (unhappy) → the glum boy."
   },
   {
    "type": "picture",
    "prompt": "我已经到了，你还有多长时间能到这儿？",
    "pinyin": "Wǒ yǐjīng dào le, nǐ hái yǒu duō cháng shíjiān néng dào zhèr?",
    "en": "I've arrived; how long until you get here?",
    "answer": "A",
    "explain": "“已经到了” (arrived at a place) → the woman at the temple."
   },
   {
    "type": "picture",
    "prompt": "我最喜欢的运动是跑步。",
    "pinyin": "Wǒ zuì xǐhuan de yùndòng shì pǎo bù.",
    "en": "My favorite sport is running.",
    "answer": "B",
    "explain": "“跑步” (running) → the runner."
   },
   {
    "type": "picture",
    "prompt": "公司离我家很远，我每天坐出租车去公司。",
    "pinyin": "Gōngsī lí wǒ jiā hěn yuǎn, wǒ měi tiān zuò chūzūchē qù gōngsī.",
    "en": "Work is far away, so I take a taxi there daily.",
    "answer": "E",
    "explain": "“出租车” (taxi) → the TAXI sign."
   },
   {
    "type": "fill",
    "prompt": "我家（___）学校不太远。",
    "pinyin": "Wǒ jiā ___ xuéxiào bú tài yuǎn.",
    "en": "My home isn't very far ___ school.",
    "options": [
     {
      "k": "A",
      "zh": "离",
      "py": "lí",
      "en": "from"
     },
     {
      "k": "B",
      "zh": "教室",
      "py": "jiàoshì",
      "en": "classroom"
     },
     {
      "k": "C",
      "zh": "就",
      "py": "jiù",
      "en": "then / as soon as"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "spend / cross"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公司",
      "py": "gōngsī",
      "en": "company"
     }
    ],
    "answer": "A",
    "explain": "离 (lí) — marks distance “from”: 我家离学校 “my home from school.”"
   },
   {
    "type": "fill",
    "prompt": "北京到上海坐飞机一个多小时（___）到了。",
    "pinyin": "Běijīng dào Shànghǎi zuò fēijī yí ge duō xiǎoshí ___ dào le.",
    "en": "Beijing to Shanghai by plane — in just over an hour you ___ arrive.",
    "options": [
     {
      "k": "A",
      "zh": "离",
      "py": "lí",
      "en": "from"
     },
     {
      "k": "B",
      "zh": "教室",
      "py": "jiàoshì",
      "en": "classroom"
     },
     {
      "k": "C",
      "zh": "就",
      "py": "jiù",
      "en": "then / as soon as"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "spend / cross"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公司",
      "py": "gōngsī",
      "en": "company"
     }
    ],
    "answer": "C",
    "explain": "就 (jiù) — “you arrive in as little as an hour.”"
   },
   {
    "type": "fill",
    "prompt": "晚上十点多了，爸爸还在（___）工作呢。",
    "pinyin": "Wǎnshang shí diǎn duō le, bàba hái zài ___ gōngzuò ne.",
    "en": "It's past 10 p.m. and Dad is still working at the ___.",
    "options": [
     {
      "k": "A",
      "zh": "离",
      "py": "lí",
      "en": "from"
     },
     {
      "k": "B",
      "zh": "教室",
      "py": "jiàoshì",
      "en": "classroom"
     },
     {
      "k": "C",
      "zh": "就",
      "py": "jiù",
      "en": "then / as soon as"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "spend / cross"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公司",
      "py": "gōngsī",
      "en": "company"
     }
    ],
    "answer": "F",
    "explain": "公司 (gōngsī) — “at the company.”"
   },
   {
    "type": "fill",
    "prompt": "明天有考试，大卫还在（___）学习呢。",
    "pinyin": "Míngtiān yǒu kǎoshì, Dàwèi hái zài ___ xuéxí ne.",
    "en": "There's an exam tomorrow; David is still studying in the ___.",
    "options": [
     {
      "k": "A",
      "zh": "离",
      "py": "lí",
      "en": "from"
     },
     {
      "k": "B",
      "zh": "教室",
      "py": "jiàoshì",
      "en": "classroom"
     },
     {
      "k": "C",
      "zh": "就",
      "py": "jiù",
      "en": "then / as soon as"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "spend / cross"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公司",
      "py": "gōngsī",
      "en": "company"
     }
    ],
    "answer": "B",
    "explain": "教室 (jiàoshì) — “in the classroom.”"
   },
   {
    "type": "fill",
    "prompt": "今天是你的生日，你想怎么（___）？",
    "pinyin": "Jīntiān shì nǐ de shēngrì, nǐ xiǎng zěnme ___?",
    "en": "Today is your birthday — how do you want to ___ it?",
    "options": [
     {
      "k": "A",
      "zh": "离",
      "py": "lí",
      "en": "from"
     },
     {
      "k": "B",
      "zh": "教室",
      "py": "jiàoshì",
      "en": "classroom"
     },
     {
      "k": "C",
      "zh": "就",
      "py": "jiù",
      "en": "then / as soon as"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "spend / cross"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "公司",
      "py": "gōngsī",
      "en": "company"
     }
    ],
    "answer": "D",
    "explain": "过 (guò) — 怎么过 means “how to spend / celebrate.”"
   },
   {
    "type": "tf",
    "context": "大卫明天有考试，所以还在教室学习呢。",
    "contextPy": "Dàwèi míngtiān yǒu kǎoshì, suǒyǐ hái zài jiàoshì xuéxí ne.",
    "contextEn": "David has an exam tomorrow, so he's still studying in the classroom.",
    "statement": "大卫不在家。",
    "statementPy": "Dàwèi bú zài jiā.",
    "statementEn": "David isn't at home.",
    "answer": true,
    "explain": "He's in the classroom, so he isn't home."
   },
   {
    "type": "tf",
    "context": "我在去机场的路上呢，还有十分钟就到了。",
    "contextPy": "Wǒ zài qù jīchǎng de lùshang ne, hái yǒu shí fēnzhōng jiù dào le.",
    "contextEn": "I'm on my way to the airport — I'll be there in ten minutes.",
    "statement": "我到机场十分钟了。",
    "statementPy": "Wǒ dào jīchǎng shí fēnzhōng le.",
    "statementEn": "I arrived at the airport ten minutes ago.",
    "answer": false,
    "explain": "There are still ten minutes to go; the speaker hasn't arrived."
   },
   {
    "type": "tf",
    "context": "离我家不远有一个饭馆，走几分钟就到了。",
    "contextPy": "Lí wǒ jiā bù yuǎn yǒu yí ge fànguǎn, zǒu jǐ fēnzhōng jiù dào le.",
    "contextEn": "There's a restaurant not far from my home — a few minutes' walk away.",
    "statement": "饭馆离我家不远。",
    "statementPy": "Fànguǎn lí wǒ jiā bù yuǎn.",
    "statementEn": "The restaurant isn't far from my home.",
    "answer": true,
    "explain": "The text says it's not far and only a few minutes away."
   },
   {
    "type": "tf",
    "context": "坐公共汽车太慢了，我们还是坐出租车吧。",
    "contextPy": "Zuò gōnggòngqìchē tài màn le, wǒmen háishi zuò chūzūchē ba.",
    "contextEn": "The bus is too slow — let's take a taxi instead.",
    "statement": "坐出租车也很慢。",
    "statementPy": "Zuò chūzūchē yě hěn màn.",
    "statementEn": "Taking a taxi is also slow.",
    "answer": false,
    "explain": "The taxi is the faster choice they switch to, not slow."
   },
   {
    "type": "tf",
    "context": "从学校到机场，坐出租车要一个小时，我们八点走，可以吗？",
    "contextPy": "Cóng xuéxiào dào jīchǎng, zuò chūzūchē yào yí ge xiǎoshí, wǒmen bā diǎn zǒu, kěyǐ ma?",
    "contextEn": "School to airport is an hour by taxi — shall we leave at eight?",
    "statement": "他们要坐八点的飞机。",
    "statementPy": "Tāmen yào zuò bā diǎn de fēijī.",
    "statementEn": "They're taking the eight-o'clock flight.",
    "answer": false,
    "explain": "Eight o'clock is when they leave by taxi, not the flight time."
   }
  ],
  "images": {
   "A": "lesson-7-A.jpg",
   "B": "lesson-7-B.jpg",
   "C": "lesson-7-C.jpg",
   "D": "lesson-7-D.jpg",
   "E": "lesson-7-E.jpg",
   "F": "lesson-7-F.jpg"
  }
 },
 {
  "id": 8,
  "zh": "让我想想再告诉你",
  "pinyin": "Ràng wǒ xiǎngxiang zài gàosu nǐ",
  "en": "Let me think and tell you later",
  "questions": [
   {
    "type": "picture",
    "prompt": "我今天很忙，没时间看电影。",
    "pinyin": "Wǒ jīntiān hěn máng, méi shíjiān kàn diànyǐng.",
    "en": "I'm busy today and have no time for a movie.",
    "answer": "E",
    "explain": "“很忙” (very busy) → the person at the piled-up desk."
   },
   {
    "type": "picture",
    "prompt": "外面天气很好，我们一起去运动运动吧。",
    "pinyin": "Wàimian tiānqì hěn hǎo, wǒmen yìqǐ qù yùndòng yùndòng ba.",
    "en": "The weather's nice — let's go exercise.",
    "answer": "A",
    "explain": "“运动” (exercise) → the people walking briskly outdoors."
   },
   {
    "type": "picture",
    "prompt": "王老师让我给张朋打个电话。",
    "pinyin": "Wáng lǎoshī ràng wǒ gěi Zhāng Péng dǎ ge diànhuà.",
    "en": "Teacher Wang asked me to call Zhang Peng.",
    "answer": "F",
    "explain": "“打电话” (make a call) → the man on the phone."
   },
   {
    "type": "picture",
    "prompt": "妈妈生病了，我们去医院看看她吧。",
    "pinyin": "Māma shēng bìng le, wǒmen qù yīyuàn kànkan tā ba.",
    "en": "Mom is ill; let's visit her at the hospital.",
    "answer": "C",
    "explain": "“生病…医院” (sick, hospital) → the nurse with a patient."
   },
   {
    "type": "picture",
    "prompt": "小王告诉我，这个商店的东西有点儿贵。",
    "pinyin": "Xiǎo Wáng gàosu wǒ, zhège shāngdiàn de dōngxi yǒudiǎnr guì.",
    "en": "Xiao Wang says this store's goods are a bit pricey.",
    "answer": "B",
    "explain": "“商店” (store) → the woman shopping in the store."
   },
   {
    "type": "fill",
    "prompt": "我这个星期太忙了，下个星期再（___）时间一起去看电影吧。",
    "pinyin": "Wǒ zhège xīngqī tài máng le, xià ge xīngqī zài ___ shíjiān yìqǐ qù kàn diànyǐng ba.",
    "en": "I'm too busy this week — next week let's ___ time to see a movie together.",
    "options": [
     {
      "k": "A",
      "zh": "等",
      "py": "děng",
      "en": "wait"
     },
     {
      "k": "B",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "C",
      "zh": "再",
      "py": "zài",
      "en": "then / again"
     },
     {
      "k": "D",
      "zh": "事情",
      "py": "shìqing",
      "en": "matter"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "找",
      "py": "zhǎo",
      "en": "find"
     }
    ],
    "answer": "F",
    "explain": "找 (zhǎo) — 找时间 means “find time.”"
   },
   {
    "type": "fill",
    "prompt": "张老师在上课呢，他让你（___）一会儿。",
    "pinyin": "Zhāng lǎoshī zài shàng kè ne, tā ràng nǐ ___ yíhuìr.",
    "en": "Teacher Zhang is teaching; he asks you to ___ a moment.",
    "options": [
     {
      "k": "A",
      "zh": "等",
      "py": "děng",
      "en": "wait"
     },
     {
      "k": "B",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "C",
      "zh": "再",
      "py": "zài",
      "en": "then / again"
     },
     {
      "k": "D",
      "zh": "事情",
      "py": "shìqing",
      "en": "matter"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "找",
      "py": "zhǎo",
      "en": "find"
     }
    ],
    "answer": "A",
    "explain": "等 (děng) — 等一会儿 means “wait a moment.”"
   },
   {
    "type": "fill",
    "prompt": "王老师（___）我告诉你，明天他有事，不能来上课了。",
    "pinyin": "Wáng lǎoshī ___ wǒ gàosu nǐ, míngtiān tā yǒu shì, bù néng lái shàng kè le.",
    "en": "Teacher Wang ___ me tell you he has something on tomorrow and can't teach.",
    "options": [
     {
      "k": "A",
      "zh": "等",
      "py": "děng",
      "en": "wait"
     },
     {
      "k": "B",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "C",
      "zh": "再",
      "py": "zài",
      "en": "then / again"
     },
     {
      "k": "D",
      "zh": "事情",
      "py": "shìqing",
      "en": "matter"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "找",
      "py": "zhǎo",
      "en": "find"
     }
    ],
    "answer": "B",
    "explain": "让 (ràng) — 让我告诉你 means “asked me to tell you.”"
   },
   {
    "type": "fill",
    "prompt": "大卫今天不在家，你明天（___）给他打电话吧。",
    "pinyin": "Dàwèi jīntiān bú zài jiā, nǐ míngtiān ___ gěi tā dǎ diànhuà ba.",
    "en": "David isn't home today — call him again ___ tomorrow.",
    "options": [
     {
      "k": "A",
      "zh": "等",
      "py": "děng",
      "en": "wait"
     },
     {
      "k": "B",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "C",
      "zh": "再",
      "py": "zài",
      "en": "then / again"
     },
     {
      "k": "D",
      "zh": "事情",
      "py": "shìqing",
      "en": "matter"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "找",
      "py": "zhǎo",
      "en": "find"
     }
    ],
    "answer": "C",
    "explain": "再 (zài) — 明天再打电话 means “call again tomorrow.”"
   },
   {
    "type": "fill",
    "prompt": "请问，你找服务员有什么（___）？",
    "pinyin": "Qǐngwèn, nǐ zhǎo fúwùyuán yǒu shénme ___?",
    "en": "Excuse me — what ___ do you need the attendant for?",
    "options": [
     {
      "k": "A",
      "zh": "等",
      "py": "děng",
      "en": "wait"
     },
     {
      "k": "B",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "C",
      "zh": "再",
      "py": "zài",
      "en": "then / again"
     },
     {
      "k": "D",
      "zh": "事情",
      "py": "shìqing",
      "en": "matter"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "找",
      "py": "zhǎo",
      "en": "find"
     }
    ],
    "answer": "D",
    "explain": "事情 (shìqing) — 有什么事情 means “what matter.”"
   },
   {
    "type": "tf",
    "context": "王老师让我给大卫打个电话。",
    "contextPy": "Wáng lǎoshī ràng wǒ gěi Dàwèi dǎ ge diànhuà.",
    "contextEn": "Teacher Wang asked me to give David a call.",
    "statement": "王老师给大卫打电话。",
    "statementPy": "Wáng lǎoshī gěi Dàwèi dǎ diànhuà.",
    "statementEn": "Teacher Wang calls David.",
    "answer": false,
    "explain": "Teacher Wang asked the speaker to call David — he isn't calling himself."
   },
   {
    "type": "tf",
    "context": "今天下午我没时间，明天再去看电影吧。",
    "contextPy": "Jīntiān xiàwǔ wǒ méi shíjiān, míngtiān zài qù kàn diànyǐng ba.",
    "contextEn": "I have no time this afternoon — let's see the movie tomorrow instead.",
    "statement": "今天不能去看电影。",
    "statementPy": "Jīntiān bù néng qù kàn diànyǐng.",
    "statementEn": "We can't go to the movie today.",
    "answer": true,
    "explain": "No time today; they postpone it to tomorrow."
   },
   {
    "type": "tf",
    "context": "这件白的有点儿长，那件黑的有点儿贵。",
    "contextPy": "Zhè jiàn bái de yǒudiǎnr cháng, nà jiàn hēi de yǒudiǎnr guì.",
    "contextEn": "This white one is a bit long; that black one is a bit pricey.",
    "statement": "两件衣服，我都不喜欢。",
    "statementPy": "Liǎng jiàn yīfu, wǒ dōu bù xǐhuan.",
    "statementEn": "I don't like either of the two.",
    "answer": false,
    "explain": "The remarks are about length and price, not about disliking them."
   },
   {
    "type": "tf",
    "context": "今天天气不太好，等天气好的时候再去给你买自行车吧。",
    "contextPy": "Jīntiān tiānqì bú tài hǎo, děng tiānqì hǎo de shíhou zài qù gěi nǐ mǎi zìxíngchē ba.",
    "contextEn": "The weather isn't great today — when it's better we'll go buy you a bike.",
    "statement": "外面正在下雨。",
    "statementPy": "Wàimian zhèngzài xià yǔ.",
    "statementEn": "It's raining outside right now.",
    "answer": false,
    "explain": "“Not great weather” doesn't necessarily mean it's raining."
   },
   {
    "type": "tf",
    "context": "你看，这是我们家的猫，眼睛漂亮吧？是我姐姐送给我的。",
    "contextPy": "Nǐ kàn, zhè shì wǒmen jiā de māo, yǎnjing piàoliang ba? Shì wǒ jiějie sòng gěi wǒ de.",
    "contextEn": "Look, this is our cat — pretty eyes, right? My sister gave it to me.",
    "statement": "猫不是我家的。",
    "statementPy": "Māo bú shì wǒ jiā de.",
    "statementEn": "The cat isn't ours.",
    "answer": false,
    "explain": "The speaker says it is their family's cat."
   }
  ],
  "images": {
   "A": "lesson-8-A.jpg",
   "B": "lesson-8-B.jpg",
   "C": "lesson-8-C.jpg",
   "D": "lesson-8-D.jpg",
   "E": "lesson-8-E.jpg",
   "F": "lesson-8-F.jpg"
  }
 },
 {
  "id": 9,
  "zh": "题太多，我没做完",
  "pinyin": "Tí tài duō, wǒ méi zuò wán",
  "en": "There were too many questions; I didn't finish",
  "questions": [
   {
    "type": "picture",
    "prompt": "非常欢迎你来我们公司上班。",
    "pinyin": "Fēicháng huānyíng nǐ lái wǒmen gōngsī shàng bān.",
    "en": "We warmly welcome you to work at our company.",
    "answer": "E",
    "explain": "“欢迎…上班” (welcoming a new colleague) → the handshake."
   },
   {
    "type": "picture",
    "prompt": "吃完晚饭后，她还要慢跑一个小时。",
    "pinyin": "Chīwán wǎnfàn hòu, tā hái yào màn pǎo yí ge xiǎoshí.",
    "en": "After dinner she still jogs for an hour.",
    "answer": "A",
    "explain": "“慢跑” (jogging) → the woman running."
   },
   {
    "type": "picture",
    "prompt": "考试不难，我都做对了。",
    "pinyin": "Kǎoshì bù nán, wǒ dōu zuòduì le.",
    "en": "The exam wasn't hard; I got everything right.",
    "answer": "F",
    "explain": "“做对了” (got it right) → the hand drawing a check mark."
   },
   {
    "type": "picture",
    "prompt": "我希望能和朋友们一起过生日。",
    "pinyin": "Wǒ xīwàng néng hé péngyoumen yìqǐ guò shēngrì.",
    "en": "I hope to celebrate my birthday with friends.",
    "answer": "B",
    "explain": "“过生日” (a birthday gathering) → the group toasting."
   },
   {
    "type": "picture",
    "prompt": "从我家到学校要坐一个多小时的公共汽车。",
    "pinyin": "Cóng wǒ jiā dào xuéxiào yào zuò yí ge duō xiǎoshí de gōnggòngqìchē.",
    "en": "Home to school is over an hour by bus.",
    "answer": "C",
    "explain": "“公共汽车” (bus) → the double-decker bus."
   },
   {
    "type": "fill",
    "prompt": "我每天（___）八点到十二点都在公司工作。",
    "pinyin": "Wǒ měi tiān ___ bā diǎn dào shí'èr diǎn dōu zài gōngsī gōngzuò.",
    "en": "Every day I work at the company ___ eight until twelve.",
    "options": [
     {
      "k": "A",
      "zh": "上班",
      "py": "shàng bān",
      "en": "go to work"
     },
     {
      "k": "B",
      "zh": "从",
      "py": "cóng",
      "en": "from"
     },
     {
      "k": "C",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     },
     {
      "k": "D",
      "zh": "问题",
      "py": "wèntí",
      "en": "question"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "懂",
      "py": "dǒng",
      "en": "understand"
     }
    ],
    "answer": "B",
    "explain": "从 (cóng) — 从…到… means “from… to….”"
   },
   {
    "type": "fill",
    "prompt": "我家离公司不太远，所以每天走路去（___）。",
    "pinyin": "Wǒ jiā lí gōngsī bú tài yuǎn, suǒyǐ měi tiān zǒu lù qù ___.",
    "en": "My home isn't far from work, so I walk to ___ every day.",
    "options": [
     {
      "k": "A",
      "zh": "上班",
      "py": "shàng bān",
      "en": "go to work"
     },
     {
      "k": "B",
      "zh": "从",
      "py": "cóng",
      "en": "from"
     },
     {
      "k": "C",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     },
     {
      "k": "D",
      "zh": "问题",
      "py": "wèntí",
      "en": "question"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "懂",
      "py": "dǒng",
      "en": "understand"
     }
    ],
    "answer": "A",
    "explain": "上班 (shàng bān) — 走路去上班 means “walk to work.”"
   },
   {
    "type": "fill",
    "prompt": "今天的课你都听（___）了没有？",
    "pinyin": "Jīntiān de kè nǐ dōu tīng ___ le méiyǒu?",
    "en": "Did you ___ everything in today's class?",
    "options": [
     {
      "k": "A",
      "zh": "上班",
      "py": "shàng bān",
      "en": "go to work"
     },
     {
      "k": "B",
      "zh": "从",
      "py": "cóng",
      "en": "from"
     },
     {
      "k": "C",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     },
     {
      "k": "D",
      "zh": "问题",
      "py": "wèntí",
      "en": "question"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "懂",
      "py": "dǒng",
      "en": "understand"
     }
    ],
    "answer": "F",
    "explain": "懂 (dǒng) — 听懂 means “understand (by listening).”"
   },
   {
    "type": "fill",
    "prompt": "你有什么（___）都可以问老师。",
    "pinyin": "Nǐ yǒu shénme ___ dōu kěyǐ wèn lǎoshī.",
    "en": "Whatever ___ you have, you can ask the teacher.",
    "options": [
     {
      "k": "A",
      "zh": "上班",
      "py": "shàng bān",
      "en": "go to work"
     },
     {
      "k": "B",
      "zh": "从",
      "py": "cóng",
      "en": "from"
     },
     {
      "k": "C",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     },
     {
      "k": "D",
      "zh": "问题",
      "py": "wèntí",
      "en": "question"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "懂",
      "py": "dǒng",
      "en": "understand"
     }
    ],
    "answer": "D",
    "explain": "问题 (wèntí) — “question / problem.”"
   },
   {
    "type": "fill",
    "prompt": "我（___）能找到一个好的工作。",
    "pinyin": "Wǒ ___ néng zhǎodào yí ge hǎo de gōngzuò.",
    "en": "I ___ I can find a good job.",
    "options": [
     {
      "k": "A",
      "zh": "上班",
      "py": "shàng bān",
      "en": "go to work"
     },
     {
      "k": "B",
      "zh": "从",
      "py": "cóng",
      "en": "from"
     },
     {
      "k": "C",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     },
     {
      "k": "D",
      "zh": "问题",
      "py": "wèntí",
      "en": "question"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "懂",
      "py": "dǒng",
      "en": "understand"
     }
    ],
    "answer": "C",
    "explain": "希望 (xīwàng) — “hope.”"
   },
   {
    "type": "tf",
    "context": "我女儿已经六岁了，我希望她能跟您学唱歌。",
    "contextPy": "Wǒ nǚ'ér yǐjīng liù suì le, wǒ xīwàng tā néng gēn nín xué chànggē.",
    "contextEn": "My daughter is already six; I hope she can learn singing from you.",
    "statement": "她女儿唱歌非常好。",
    "statementPy": "Tā nǚ'ér chànggē fēicháng hǎo.",
    "statementEn": "Her daughter sings very well.",
    "answer": false,
    "explain": "She hopes the daughter can learn to sing — she isn't already very good."
   },
   {
    "type": "tf",
    "context": "这是他的第一个工作，从下个星期开始上班，希望他能喜欢这个工作。",
    "contextPy": "Zhè shì tā de dì yī ge gōngzuò, cóng xià ge xīngqī kāishǐ shàng bān, xīwàng tā néng xǐhuan zhège gōngzuò.",
    "contextEn": "This is his first job; he starts next week — I hope he likes it.",
    "statement": "他还没有上班呢。",
    "statementPy": "Tā hái méiyǒu shàng bān ne.",
    "statementEn": "He hasn't started work yet.",
    "answer": true,
    "explain": "He starts next week, so he hasn't begun yet."
   },
   {
    "type": "tf",
    "context": "昨天的考试不太难，题很多，我有两个题没有做完。",
    "contextPy": "Zuótiān de kǎoshì bú tài nán, tí hěn duō, wǒ yǒu liǎng ge tí méiyǒu zuò wán.",
    "contextEn": "Yesterday's exam wasn't too hard, but there were many questions and I left two unfinished.",
    "statement": "这次考试题很多，很难。",
    "statementPy": "Zhè cì kǎoshì tí hěn duō, hěn nán.",
    "statementEn": "This exam had many questions and was hard.",
    "answer": false,
    "explain": "There were many questions, but the text says it wasn't too hard."
   },
   {
    "type": "tf",
    "context": "今天是9月20号，再有三天就是爸爸的生日了。我想送他一个新手机。",
    "contextPy": "Jīntiān shì jiǔ yuè èrshí hào, zài yǒu sān tiān jiù shì bàba de shēngrì le. Wǒ xiǎng sòng tā yí ge xīn shǒujī.",
    "contextEn": "Today is Sept 20; in three days it's Dad's birthday. I want to give him a new phone.",
    "statement": "9月23号是我的生日。",
    "statementPy": "Jiǔ yuè èrshísān hào shì wǒ de shēngrì.",
    "statementEn": "September 23rd is my birthday.",
    "answer": false,
    "explain": "September 23rd is Dad's birthday, not the speaker's."
   },
   {
    "type": "tf",
    "context": "我的一个朋友正在找房子，希望离公司近一些，这样他每天七点起床就可以了。",
    "contextPy": "Wǒ de yí ge péngyou zhèngzài zhǎo fángzi, xīwàng lí gōngsī jìn yìxiē, zhèyàng tā měi tiān qī diǎn qǐ chuáng jiù kěyǐ le.",
    "contextEn": "A friend is house-hunting, hoping to be closer to work so he can wake at seven.",
    "statement": "他的朋友现在每天七点起床。",
    "statementPy": "Tā de péngyou xiànzài měi tiān qī diǎn qǐ chuáng.",
    "statementEn": "His friend currently wakes at seven daily.",
    "answer": false,
    "explain": "Waking at seven is the future goal once he moves closer — not the current situation."
   }
  ],
  "images": {
   "A": "lesson-9-A.jpg",
   "B": "lesson-9-B.jpg",
   "C": "lesson-9-C.jpg",
   "D": "lesson-9-D.jpg",
   "E": "lesson-9-E.jpg",
   "F": "lesson-9-F.jpg"
  }
 },
 {
  "id": 10,
  "zh": "别找了，手机在桌子上呢",
  "pinyin": "Bié zhǎo le, shǒujī zài zhuōzi shang ne",
  "en": "Stop looking — your phone is on the desk",
  "questions": [
   {
    "type": "picture",
    "prompt": "我每天早上都看报纸。",
    "pinyin": "Wǒ měi tiān zǎoshang dōu kàn bàozhǐ.",
    "en": "I read the newspaper every morning.",
    "answer": "C",
    "explain": "“看报纸” (reading a newspaper) → the man with the newspaper."
   },
   {
    "type": "picture",
    "prompt": "妈妈正在给我们洗衣服呢。",
    "pinyin": "Māma zhèngzài gěi wǒmen xǐ yīfu ne.",
    "en": "Mom is washing our clothes.",
    "answer": "E",
    "explain": "“洗衣服” (doing laundry) → the laundry basket."
   },
   {
    "type": "picture",
    "prompt": "别玩儿电脑了，看电脑时间长了对眼睛不好。",
    "pinyin": "Bié wánr diànnǎo le, kàn diànnǎo shíjiān cháng le duì yǎnjing bù hǎo.",
    "en": "Stop using the computer — too long is bad for the eyes.",
    "answer": "B",
    "explain": "“对眼睛不好” (bad for the eyes) → the person rubbing their eyes at a screen."
   },
   {
    "type": "picture",
    "prompt": "别工作了，睡觉吧，明天早点儿起床。",
    "pinyin": "Bié gōngzuò le, shuì jiào ba, míngtiān zǎodiǎnr qǐ chuáng.",
    "en": "Stop working and sleep; get up early tomorrow.",
    "answer": "A",
    "explain": "“别工作了，睡觉吧” (stop working, sleep) → the person slumped at the laptop."
   },
   {
    "type": "picture",
    "prompt": "有什么问题，你可以打我的手机。",
    "pinyin": "Yǒu shénme wèntí, nǐ kěyǐ dǎ wǒ de shǒujī.",
    "en": "If you have questions, call my mobile.",
    "answer": "F",
    "explain": "“手机” (mobile phone) → the hand holding a phone."
   },
   {
    "type": "fill",
    "prompt": "明天的（___）我都准备好了，可以睡觉了。",
    "pinyin": "Míngtiān de ___ wǒ dōu zhǔnbèi hǎo le, kěyǐ shuì jiào le.",
    "en": "I've prepared all of tomorrow's ___ — I can go to sleep now.",
    "options": [
     {
      "k": "A",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "B",
      "zh": "正在",
      "py": "zhèngzài",
      "en": "(in the middle of)"
     },
     {
      "k": "C",
      "zh": "课",
      "py": "kè",
      "en": "class"
     },
     {
      "k": "D",
      "zh": "鸡蛋",
      "py": "jīdàn",
      "en": "egg"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "别",
      "py": "bié",
      "en": "don't"
     }
    ],
    "answer": "C",
    "explain": "课 (kè) — 明天的课 means “tomorrow's classes.”"
   },
   {
    "type": "fill",
    "prompt": "大卫是一个喜欢（___）别人的好孩子。",
    "pinyin": "Dàwèi shì yí ge xǐhuan ___ biéren de hǎo háizi.",
    "en": "David is a good kid who likes to ___ others.",
    "options": [
     {
      "k": "A",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "B",
      "zh": "正在",
      "py": "zhèngzài",
      "en": "(in the middle of)"
     },
     {
      "k": "C",
      "zh": "课",
      "py": "kè",
      "en": "class"
     },
     {
      "k": "D",
      "zh": "鸡蛋",
      "py": "jīdàn",
      "en": "egg"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "别",
      "py": "bié",
      "en": "don't"
     }
    ],
    "answer": "A",
    "explain": "帮助 (bāngzhù) — 帮助别人 means “help others.”"
   },
   {
    "type": "fill",
    "prompt": "我每天早上吃一个（___），喝一杯牛奶。",
    "pinyin": "Wǒ měi tiān zǎoshang chī yí ge ___, hē yì bēi niúnǎi.",
    "en": "Every morning I eat one ___ and drink a cup of milk.",
    "options": [
     {
      "k": "A",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "B",
      "zh": "正在",
      "py": "zhèngzài",
      "en": "(in the middle of)"
     },
     {
      "k": "C",
      "zh": "课",
      "py": "kè",
      "en": "class"
     },
     {
      "k": "D",
      "zh": "鸡蛋",
      "py": "jīdàn",
      "en": "egg"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "别",
      "py": "bié",
      "en": "don't"
     }
    ],
    "answer": "D",
    "explain": "鸡蛋 (jīdàn) — “egg.”"
   },
   {
    "type": "fill",
    "prompt": "妈妈睡觉了，我们（___）看电视了。",
    "pinyin": "Māma shuì jiào le, wǒmen ___ kàn diànshì le.",
    "en": "Mom has gone to sleep — let's ___ watch TV.",
    "options": [
     {
      "k": "A",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "B",
      "zh": "正在",
      "py": "zhèngzài",
      "en": "(in the middle of)"
     },
     {
      "k": "C",
      "zh": "课",
      "py": "kè",
      "en": "class"
     },
     {
      "k": "D",
      "zh": "鸡蛋",
      "py": "jīdàn",
      "en": "egg"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "别",
      "py": "bié",
      "en": "don't"
     }
    ],
    "answer": "F",
    "explain": "别 (bié) — 别看电视了 means “don't watch TV (anymore).”"
   },
   {
    "type": "fill",
    "prompt": "哥哥（___）玩儿电脑呢，没时间帮助我。",
    "pinyin": "Gēge ___ wánr diànnǎo ne, méi shíjiān bāngzhù wǒ.",
    "en": "My brother is ___ playing on the computer and has no time to help me.",
    "options": [
     {
      "k": "A",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "B",
      "zh": "正在",
      "py": "zhèngzài",
      "en": "(in the middle of)"
     },
     {
      "k": "C",
      "zh": "课",
      "py": "kè",
      "en": "class"
     },
     {
      "k": "D",
      "zh": "鸡蛋",
      "py": "jīdàn",
      "en": "egg"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "别",
      "py": "bié",
      "en": "don't"
     }
    ],
    "answer": "B",
    "explain": "正在 (zhèngzài) — marks an action in progress: “is playing.”"
   },
   {
    "type": "tf",
    "context": "这本书是我写的，希望能对你有帮助。",
    "contextPy": "Zhè běn shū shì wǒ xiě de, xīwàng néng duì nǐ yǒu bāngzhù.",
    "contextEn": "I wrote this book; I hope it can help you.",
    "statement": "这本书还没写完。",
    "statementPy": "Zhè běn shū hái méi xiě wán.",
    "statementEn": "This book isn't finished yet.",
    "answer": false,
    "explain": "The speaker already wrote it, so it's complete."
   },
   {
    "type": "tf",
    "context": "医生说这个药要饭前吃，吃药后两个小时别喝茶。",
    "contextPy": "Yīshēng shuō zhège yào yào fànqián chī, chī yào hòu liǎng ge xiǎoshí bié hē chá.",
    "contextEn": "The doctor said to take this medicine before meals and avoid tea for two hours after.",
    "statement": "医生说多喝茶对身体好。",
    "statementPy": "Yīshēng shuō duō hē chá duì shēntǐ hǎo.",
    "statementEn": "The doctor said drinking lots of tea is good for you.",
    "answer": false,
    "explain": "The doctor said to avoid tea after the medicine — the opposite."
   },
   {
    "type": "tf",
    "context": "别找了，你的手机在桌子上呢，电脑旁边。",
    "contextPy": "Bié zhǎo le, nǐ de shǒujī zài zhuōzi shang ne, diànnǎo pángbiān.",
    "contextEn": "Stop looking — your phone is on the desk, next to the computer.",
    "statement": "电脑也在桌子上。",
    "statementPy": "Diànnǎo yě zài zhuōzi shang.",
    "statementEn": "The computer is also on the desk.",
    "answer": true,
    "explain": "The phone is on the desk beside the computer, so the computer is on the desk too."
   },
   {
    "type": "tf",
    "context": "那件白色的衣服我帮你洗了，在外面呢。",
    "contextPy": "Nà jiàn báisè de yīfu wǒ bāng nǐ xǐ le, zài wàimian ne.",
    "contextEn": "I washed that white piece of clothing for you — it's outside.",
    "statement": "衣服在外面。",
    "statementPy": "Yīfu zài wàimian.",
    "statementEn": "The clothing is outside.",
    "answer": true,
    "explain": "The text says it's outside."
   },
   {
    "type": "tf",
    "context": "机场离这儿很远，坐公共汽车要一个多小时，坐出租车也要四五十分钟吧。",
    "contextPy": "Jīchǎng lí zhèr hěn yuǎn, zuò gōnggòngqìchē yào yí ge duō xiǎoshí, zuò chūzūchē yě yào sì wǔshí fēnzhōng ba.",
    "contextEn": "The airport is far — over an hour by bus, and 40–50 minutes even by taxi.",
    "statement": "机场离这儿非常远。",
    "statementPy": "Jīchǎng lí zhèr fēicháng yuǎn.",
    "statementEn": "The airport is very far from here.",
    "answer": true,
    "explain": "Long travel times by both bus and taxi confirm it's very far."
   }
  ],
  "images": {
   "A": "lesson-10-A.jpg",
   "B": "lesson-10-B.jpg",
   "C": "lesson-10-C.jpg",
   "D": "lesson-10-D.jpg",
   "E": "lesson-10-E.jpg",
   "F": "lesson-10-F.jpg"
  }
 },
 {
  "id": 11,
  "zh": "他比我大三岁",
  "pinyin": "Tā bǐ wǒ dà sān suì",
  "en": "He is three years older than me",
  "questions": [
   {
    "type": "picture",
    "prompt": "昨天我和朋友们一起去喝咖啡了。",
    "pinyin": "Zuótiān wǒ hé péngyoumen yìqǐ qù hē kāfēi le.",
    "en": "Yesterday I went for coffee with friends.",
    "answer": "E",
    "explain": "“喝咖啡” (having coffee) → the friends with drinks."
   },
   {
    "type": "picture",
    "prompt": "左边那个女孩子比右边的那个大两岁。",
    "pinyin": "Zuǒbian nàge nǚháizi bǐ yòubian de nàge dà liǎng suì.",
    "en": "The girl on the left is two years older than the one on the right.",
    "answer": "B",
    "explain": "“两个女孩子” (two girls compared) → the two girls side by side."
   },
   {
    "type": "picture",
    "prompt": "正在打电话的那个人可能是新来的王老师。",
    "pinyin": "Zhèngzài dǎ diànhuà de nàge rén kěnéng shì xīn lái de Wáng lǎoshī.",
    "en": "The person on the phone may be the new Teacher Wang.",
    "answer": "A",
    "explain": "“打电话” (on the phone) → the woman on the phone."
   },
   {
    "type": "picture",
    "prompt": "多吃水果对身体好，你也来一个吧。",
    "pinyin": "Duō chī shuǐguǒ duì shēntǐ hǎo, nǐ yě lái yí ge ba.",
    "en": "Eating fruit is healthy — have one too.",
    "answer": "F",
    "explain": "“吃水果” (eating fruit) → the woman eating fruit."
   },
   {
    "type": "picture",
    "prompt": "这件衣服300块，比那件便宜50块。",
    "pinyin": "Zhè jiàn yīfu sān bǎi kuài, bǐ nà jiàn piányi wǔshí kuài.",
    "en": "This piece is 300 yuan, 50 cheaper than that one.",
    "answer": "C",
    "explain": "“这件衣服” (a piece of clothing) → the woman holding up clothes."
   },
   {
    "type": "fill",
    "prompt": "昨天25度，今天（___）昨天热一点儿。",
    "pinyin": "Zuótiān èrshíwǔ dù, jīntiān ___ zuótiān rè yìdiǎnr.",
    "en": "Yesterday was 25°; today is a bit hotter ___ yesterday.",
    "options": [
     {
      "k": "A",
      "zh": "唱歌",
      "py": "chànggē",
      "en": "sing"
     },
     {
      "k": "B",
      "zh": "便宜",
      "py": "piányi",
      "en": "cheap"
     },
     {
      "k": "C",
      "zh": "说话",
      "py": "shuōhuà",
      "en": "talk"
     },
     {
      "k": "D",
      "zh": "可能",
      "py": "kěnéng",
      "en": "maybe"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "比",
      "py": "bǐ",
      "en": "than"
     }
    ],
    "answer": "F",
    "explain": "比 (bǐ) — the comparison marker: 今天比昨天热 “today is hotter than yesterday.”"
   },
   {
    "type": "fill",
    "prompt": "每个周末，我都喜欢和朋友们一起去（___）。",
    "pinyin": "Měi ge zhōumò, wǒ dōu xǐhuan hé péngyoumen yìqǐ qù ___.",
    "en": "Every weekend I like to go ___ with my friends.",
    "options": [
     {
      "k": "A",
      "zh": "唱歌",
      "py": "chànggē",
      "en": "sing"
     },
     {
      "k": "B",
      "zh": "便宜",
      "py": "piányi",
      "en": "cheap"
     },
     {
      "k": "C",
      "zh": "说话",
      "py": "shuōhuà",
      "en": "talk"
     },
     {
      "k": "D",
      "zh": "可能",
      "py": "kěnéng",
      "en": "maybe"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "比",
      "py": "bǐ",
      "en": "than"
     }
    ],
    "answer": "A",
    "explain": "唱歌 (chànggē) — 去唱歌 means “go singing.”"
   },
   {
    "type": "fill",
    "prompt": "你认识前边（___）的那两个人吗？",
    "pinyin": "Nǐ rènshi qiánbian ___ de nà liǎng ge rén ma?",
    "en": "Do you know those two people ___ up ahead?",
    "options": [
     {
      "k": "A",
      "zh": "唱歌",
      "py": "chànggē",
      "en": "sing"
     },
     {
      "k": "B",
      "zh": "便宜",
      "py": "piányi",
      "en": "cheap"
     },
     {
      "k": "C",
      "zh": "说话",
      "py": "shuōhuà",
      "en": "talk"
     },
     {
      "k": "D",
      "zh": "可能",
      "py": "kěnéng",
      "en": "maybe"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "比",
      "py": "bǐ",
      "en": "than"
     }
    ],
    "answer": "C",
    "explain": "说话 (shuōhuà) — “the two people talking in front.”"
   },
   {
    "type": "fill",
    "prompt": "天气不太好，我觉得（___）要下雨了。",
    "pinyin": "Tiānqì bú tài hǎo, wǒ juéde ___ yào xià yǔ le.",
    "en": "The weather isn't great; I think it's ___ going to rain.",
    "options": [
     {
      "k": "A",
      "zh": "唱歌",
      "py": "chànggē",
      "en": "sing"
     },
     {
      "k": "B",
      "zh": "便宜",
      "py": "piányi",
      "en": "cheap"
     },
     {
      "k": "C",
      "zh": "说话",
      "py": "shuōhuà",
      "en": "talk"
     },
     {
      "k": "D",
      "zh": "可能",
      "py": "kěnéng",
      "en": "maybe"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "比",
      "py": "bǐ",
      "en": "than"
     }
    ],
    "answer": "D",
    "explain": "可能 (kěnéng) — “maybe / probably.”"
   },
   {
    "type": "fill",
    "prompt": "苹果比西瓜（___），我想多买点儿苹果。",
    "pinyin": "Píngguǒ bǐ xīguā ___, wǒ xiǎng duō mǎi diǎnr píngguǒ.",
    "en": "Apples are ___ than watermelon, so I want to buy more apples.",
    "options": [
     {
      "k": "A",
      "zh": "唱歌",
      "py": "chànggē",
      "en": "sing"
     },
     {
      "k": "B",
      "zh": "便宜",
      "py": "piányi",
      "en": "cheap"
     },
     {
      "k": "C",
      "zh": "说话",
      "py": "shuōhuà",
      "en": "talk"
     },
     {
      "k": "D",
      "zh": "可能",
      "py": "kěnéng",
      "en": "maybe"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "比",
      "py": "bǐ",
      "en": "than"
     }
    ],
    "answer": "B",
    "explain": "便宜 (piányi) — 苹果比西瓜便宜 “apples are cheaper than watermelon.”"
   },
   {
    "type": "tf",
    "context": "左边看报纸的这个人是我姐姐，右边写字的那个人是我哥哥。",
    "contextPy": "Zuǒbian kàn bàozhǐ de zhège rén shì wǒ jiějie, yòubian xiězì de nàge rén shì wǒ gēge.",
    "contextEn": "The one reading on the left is my older sister; the one writing on the right is my older brother.",
    "statement": "他们家可能有三个孩子。",
    "statementPy": "Tāmen jiā kěnéng yǒu sān ge háizi.",
    "statementEn": "Their family may have three children.",
    "answer": true,
    "explain": "An older sister, an older brother and the speaker make at least three children."
   },
   {
    "type": "tf",
    "context": "女儿让我告诉你，她今天晚上和朋友们一起去唱歌，不回来吃晚饭了。",
    "contextPy": "Nǚ'ér ràng wǒ gàosu nǐ, tā jīntiān wǎnshang hé péngyoumen yìqǐ qù chànggē, bù huílai chī wǎnfàn le.",
    "contextEn": "Our daughter asked me to say she's out singing with friends tonight and won't be back for dinner.",
    "statement": "女儿今天在家吃晚饭。",
    "statementPy": "Nǚ'ér jīntiān zài jiā chī wǎnfàn.",
    "statementEn": "Our daughter eats dinner at home today.",
    "answer": false,
    "explain": "She explicitly won't be home for dinner."
   },
   {
    "type": "tf",
    "context": "这是儿子送给我的手表，因为明天是我的生日。",
    "contextPy": "Zhè shì érzi sòng gěi wǒ de shǒubiǎo, yīnwèi míngtiān shì wǒ de shēngrì.",
    "contextEn": "This is the watch my son gave me, because tomorrow is my birthday.",
    "statement": "她送给儿子一块手表。",
    "statementPy": "Tā sòng gěi érzi yí kuài shǒubiǎo.",
    "statementEn": "She gave her son a watch.",
    "answer": false,
    "explain": "It's the son who gave the watch to the speaker, not the reverse."
   },
   {
    "type": "tf",
    "context": "你问的这个问题很好，我要想一想，明天再告诉你，可以吗？",
    "contextPy": "Nǐ wèn de zhège wèntí hěn hǎo, wǒ yào xiǎng yi xiǎng, míngtiān zài gàosu nǐ, kěyǐ ma?",
    "contextEn": "That's a good question — let me think and tell you tomorrow, okay?",
    "statement": "他现在没有回答这个问题。",
    "statementPy": "Tā xiànzài méiyǒu huídá zhège wèntí.",
    "statementEn": "He hasn't answered the question now.",
    "answer": true,
    "explain": "He'll answer tomorrow, so he hasn't answered yet."
   },
   {
    "type": "tf",
    "context": "哥哥的汉语比我好，姐姐的汉语也比我好。",
    "contextPy": "Gēge de Hànyǔ bǐ wǒ hǎo, jiějie de Hànyǔ yě bǐ wǒ hǎo.",
    "contextEn": "My brother's Chinese is better than mine, and my sister's is too.",
    "statement": "我的汉语没有哥哥和姐姐那么好。",
    "statementPy": "Wǒ de Hànyǔ méiyǒu gēge hé jiějie nàme hǎo.",
    "statementEn": "My Chinese isn't as good as my brother's or sister's.",
    "answer": true,
    "explain": "Both siblings are better, so the speaker's Chinese is the weakest."
   }
  ],
  "images": {
   "A": "lesson-11-A.jpg",
   "B": "lesson-11-B.jpg",
   "C": "lesson-11-C.jpg",
   "D": "lesson-11-D.jpg",
   "E": "lesson-11-E.jpg",
   "F": "lesson-11-F.jpg"
  }
 },
 {
  "id": 12,
  "zh": "你穿得太少了",
  "pinyin": "Nǐ chuān de tài shǎo le",
  "en": "You're wearing too little",
  "questions": [
   {
    "type": "picture",
    "prompt": "别离电脑太近，对眼睛不好。",
    "pinyin": "Bié lí diànnǎo tài jìn, duì yǎnjing bù hǎo.",
    "en": "Don't sit too close to the computer; it's bad for your eyes.",
    "answer": "E",
    "explain": "“离电脑太近” (too close to the screen) → the child up against the monitor."
   },
   {
    "type": "picture",
    "prompt": "妻子这几天很忙，所以我洗衣服。",
    "pinyin": "Qīzi zhè jǐ tiān hěn máng, suǒyǐ wǒ xǐ yīfu.",
    "en": "My wife is busy these days, so I do the laundry.",
    "answer": "C",
    "explain": "“洗衣服” (doing laundry) → the man with a laundry basket."
   },
   {
    "type": "picture",
    "prompt": "今天零下十度，比昨天冷多了。你多穿点儿衣服吧。",
    "pinyin": "Jīntiān língxià shí dù, bǐ zuótiān lěng duō le. Nǐ duō chuān diǎnr yīfu ba.",
    "en": "It's −10° today, much colder — put on more clothes.",
    "answer": "A",
    "explain": "“多穿点儿衣服” (bundle up) → the mother dressing the child."
   },
   {
    "type": "picture",
    "prompt": "你唱歌唱得太好了，再来一个吧。",
    "pinyin": "Nǐ chànggē chàng de tài hǎo le, zài lái yí ge ba.",
    "en": "You sing so well — one more, please!",
    "answer": "B",
    "explain": "“唱歌” (singing) → the woman at the microphone."
   },
   {
    "type": "picture",
    "prompt": "今天比昨天起得早，所以我走路去上班。",
    "pinyin": "Jīntiān bǐ zuótiān qǐ de zǎo, suǒyǐ wǒ zǒu lù qù shàng bān.",
    "en": "I rose earlier today, so I'm walking to work.",
    "answer": "F",
    "explain": "“走路去上班” (walking to work) → the man walking with a briefcase."
   },
   {
    "type": "fill",
    "prompt": "他的家比我的家离公司（___）一点儿。",
    "pinyin": "Tā de jiā bǐ wǒ de jiā lí gōngsī ___ yìdiǎnr.",
    "en": "His home is a bit ___ to the office than mine.",
    "options": [
     {
      "k": "A",
      "zh": "穿",
      "py": "chuān",
      "en": "wear"
     },
     {
      "k": "B",
      "zh": "进",
      "py": "jìn",
      "en": "enter"
     },
     {
      "k": "C",
      "zh": "近",
      "py": "jìn",
      "en": "near"
     },
     {
      "k": "D",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     }
    ],
    "answer": "C",
    "explain": "近 (jìn) — “near.” 离公司近一点儿 “a bit closer to the company.”"
   },
   {
    "type": "fill",
    "prompt": "我（___）找一个比现在钱多一点儿的工作。",
    "pinyin": "Wǒ ___ zhǎo yí ge bǐ xiànzài qián duō yìdiǎnr de gōngzuò.",
    "en": "I ___ to find a job that pays a bit more than my current one.",
    "options": [
     {
      "k": "A",
      "zh": "穿",
      "py": "chuān",
      "en": "wear"
     },
     {
      "k": "B",
      "zh": "进",
      "py": "jìn",
      "en": "enter"
     },
     {
      "k": "C",
      "zh": "近",
      "py": "jìn",
      "en": "near"
     },
     {
      "k": "D",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     }
    ],
    "answer": "F",
    "explain": "希望 (xīwàng) — “hope to find.”"
   },
   {
    "type": "fill",
    "prompt": "外面太冷了，快请（___）房间里来吧。",
    "pinyin": "Wàimian tài lěng le, kuài qǐng ___ fángjiān li lái ba.",
    "en": "It's too cold outside — please come ___ the room quickly.",
    "options": [
     {
      "k": "A",
      "zh": "穿",
      "py": "chuān",
      "en": "wear"
     },
     {
      "k": "B",
      "zh": "进",
      "py": "jìn",
      "en": "enter"
     },
     {
      "k": "C",
      "zh": "近",
      "py": "jìn",
      "en": "near"
     },
     {
      "k": "D",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     }
    ],
    "answer": "B",
    "explain": "进 (jìn) — 进房间里来 means “come into the room.”"
   },
   {
    "type": "fill",
    "prompt": "明天有一个新年晚会，我想（___）得漂亮一点儿。",
    "pinyin": "Míngtiān yǒu yí ge xīnnián wǎnhuì, wǒ xiǎng ___ de piàoliang yìdiǎnr.",
    "en": "There's a New Year party tomorrow; I want to ___ a bit nicely.",
    "options": [
     {
      "k": "A",
      "zh": "穿",
      "py": "chuān",
      "en": "wear"
     },
     {
      "k": "B",
      "zh": "进",
      "py": "jìn",
      "en": "enter"
     },
     {
      "k": "C",
      "zh": "近",
      "py": "jìn",
      "en": "near"
     },
     {
      "k": "D",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     }
    ],
    "answer": "A",
    "explain": "穿 (chuān) — 穿得漂亮 means “dress nicely.”"
   },
   {
    "type": "fill",
    "prompt": "大卫生病了，他（___）我告诉王老师。",
    "pinyin": "Dàwèi shēng bìng le, tā ___ wǒ gàosu Wáng lǎoshī.",
    "en": "David is ill; he ___ me tell Teacher Wang.",
    "options": [
     {
      "k": "A",
      "zh": "穿",
      "py": "chuān",
      "en": "wear"
     },
     {
      "k": "B",
      "zh": "进",
      "py": "jìn",
      "en": "enter"
     },
     {
      "k": "C",
      "zh": "近",
      "py": "jìn",
      "en": "near"
     },
     {
      "k": "D",
      "zh": "让",
      "py": "ràng",
      "en": "ask / let"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "希望",
      "py": "xīwàng",
      "en": "hope"
     }
    ],
    "answer": "D",
    "explain": "让 (ràng) — 让我告诉 means “asked me to tell.”"
   },
   {
    "type": "tf",
    "context": "今年没有去年冷，北京到现在还没下雪呢。去年这个时候已经下雪了。",
    "contextPy": "Jīnnián méiyǒu qùnián lěng, Běijīng dào xiànzài hái méi xià xuě ne. Qùnián zhège shíhou yǐjīng xià xuě le.",
    "contextEn": "This year is less cold than last; Beijing hasn't snowed yet, though it had by now last year.",
    "statement": "北京今年比去年冷。",
    "statementPy": "Běijīng jīnnián bǐ qùnián lěng.",
    "statementEn": "Beijing is colder this year than last.",
    "answer": false,
    "explain": "The text says this year is not as cold as last year."
   },
   {
    "type": "tf",
    "context": "你上个月没怎么运动吧？明天和我一起去踢足球怎么样？打篮球也可以。",
    "contextPy": "Nǐ shàng ge yuè méi zěnme yùndòng ba? Míngtiān hé wǒ yìqǐ qù tī zúqiú zěnmeyàng? Dǎ lánqiú yě kěyǐ.",
    "contextEn": "You barely exercised last month, right? How about soccer with me tomorrow? Basketball works too.",
    "statement": "他们可能明天一起运动。",
    "statementPy": "Tāmen kěnéng míngtiān yìqǐ yùndòng.",
    "statementEn": "They may exercise together tomorrow.",
    "answer": true,
    "explain": "The speaker proposes playing a sport together tomorrow."
   },
   {
    "type": "tf",
    "context": "妻子每天睡觉前都要喝一杯牛奶，她说这样可以睡得好一些。",
    "contextPy": "Qīzi měi tiān shuì jiào qián dōu yào hē yì bēi niúnǎi, tā shuō zhèyàng kěyǐ shuì de hǎo yìxiē.",
    "contextEn": "My wife drinks a glass of milk before bed each night, saying it helps her sleep better.",
    "statement": "妻子起床后要喝牛奶。",
    "statementPy": "Qīzi qǐ chuáng hòu yào hē niúnǎi.",
    "statementEn": "His wife drinks milk after getting up.",
    "answer": false,
    "explain": "She drinks the milk before sleeping, not after waking."
   },
   {
    "type": "tf",
    "context": "谢谢您，没有您的帮助，这件事情可能到今天晚上也做不完。",
    "contextPy": "Xièxie nín, méiyǒu nín de bāngzhù, zhè jiàn shìqing kěnéng dào jīntiān wǎnshang yě zuò bu wán.",
    "contextEn": "Thank you — without your help this might not have been finished even by tonight.",
    "statement": "事情已经做完了。",
    "statementPy": "Shìqing yǐjīng zuò wán le.",
    "statementEn": "The task is already done.",
    "answer": true,
    "explain": "The grateful thanks imply the help got it finished."
   },
   {
    "type": "tf",
    "context": "慢一点儿，你走得太快了，我们去那个茶馆喝杯茶好不好？",
    "contextPy": "Màn yìdiǎnr, nǐ zǒu de tài kuài le, wǒmen qù nàge cháguǎn hē bēi chá hǎo bu hǎo?",
    "contextEn": "Slow down, you're walking too fast — shall we get tea at that teahouse?",
    "statement": "他想去喝茶。",
    "statementPy": "Tā xiǎng qù hē chá.",
    "statementEn": "He wants to go drink tea.",
    "answer": true,
    "explain": "He's the one proposing they go for tea."
   }
  ],
  "images": {
   "A": "lesson-12-A.jpg",
   "B": "lesson-12-B.jpg",
   "C": "lesson-12-C.jpg",
   "D": "lesson-12-D.jpg",
   "E": "lesson-12-E.jpg",
   "F": "lesson-12-F.jpg"
  }
 },
 {
  "id": 13,
  "zh": "门开着呢",
  "pinyin": "Mén kāi zhe ne",
  "en": "The door is open",
  "questions": [
   {
    "type": "picture",
    "prompt": "晚上十点了，咖啡店还开着门呢。",
    "pinyin": "Wǎnshang shí diǎn le, kāfēidiàn hái kāizhe mén ne.",
    "en": "It's ten at night and the coffee shop is still open.",
    "answer": "F",
    "explain": "“咖啡店…开着门” (the shop is open) → the café with the “Open” sign."
   },
   {
    "type": "picture",
    "prompt": "老师每天都坐着给学生们上课。",
    "pinyin": "Lǎoshī měi tiān dōu zuòzhe gěi xuéshengmen shàng kè.",
    "en": "The teacher teaches the students sitting down each day.",
    "answer": "C",
    "explain": "“给学生上课” (teaching students) → the teacher with pupils."
   },
   {
    "type": "picture",
    "prompt": "妈妈笑着说：“今天给你们做了很多好吃的东西”。",
    "pinyin": "Māma xiàozhe shuō: “Jīntiān gěi nǐmen zuòle hěn duō hǎochī de dōngxi”.",
    "en": "Smiling, Mom said she'd made lots of tasty food today.",
    "answer": "A",
    "explain": "“做了很多好吃的” (cooking lots of food) → the family cooking."
   },
   {
    "type": "picture",
    "prompt": "学校离我家很近，我每天走着去上课。",
    "pinyin": "Xuéxiào lí wǒ jiā hěn jìn, wǒ měi tiān zǒuzhe qù shàng kè.",
    "en": "School is close, so I walk to class daily.",
    "answer": "B",
    "explain": "“走着去上课” (walking to class) → the person walking with books."
   },
   {
    "type": "picture",
    "prompt": "拿着这么多东西，我们还是坐出租车回家吧。",
    "pinyin": "Názhe zhème duō dōngxi, wǒmen háishi zuò chūzūchē huí jiā ba.",
    "en": "With so much to carry, let's take a taxi home.",
    "answer": "E",
    "explain": "“坐出租车” (taking a taxi) → the TAXI sign."
   },
   {
    "type": "fill",
    "prompt": "妹妹是一个非常爱（___）的女孩儿。",
    "pinyin": "Mèimei shì yí ge fēicháng ài ___ de nǚháir.",
    "en": "My little sister is a girl who loves to ___.",
    "options": [
     {
      "k": "A",
      "zh": "拿",
      "py": "ná",
      "en": "hold"
     },
     {
      "k": "B",
      "zh": "笑",
      "py": "xiào",
      "en": "smile / laugh"
     },
     {
      "k": "C",
      "zh": "长",
      "py": "zhǎng",
      "en": "grow / have"
     },
     {
      "k": "D",
      "zh": "往",
      "py": "wǎng",
      "en": "toward"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "一直",
      "py": "yìzhí",
      "en": "straight"
     }
    ],
    "answer": "B",
    "explain": "笑 (xiào) — 爱笑 means “loves to smile / laugh.”"
   },
   {
    "type": "fill",
    "prompt": "你手里（___）着的是什么东西，我能看看吗？",
    "pinyin": "Nǐ shǒuli ___ zhe de shì shénme dōngxi, wǒ néng kànkan ma?",
    "en": "What's that you're ___ in your hand — may I see it?",
    "options": [
     {
      "k": "A",
      "zh": "拿",
      "py": "ná",
      "en": "hold"
     },
     {
      "k": "B",
      "zh": "笑",
      "py": "xiào",
      "en": "smile / laugh"
     },
     {
      "k": "C",
      "zh": "长",
      "py": "zhǎng",
      "en": "grow / have"
     },
     {
      "k": "D",
      "zh": "往",
      "py": "wǎng",
      "en": "toward"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "一直",
      "py": "yìzhí",
      "en": "straight"
     }
    ],
    "answer": "A",
    "explain": "拿 (ná) — 拿着 means “holding.”"
   },
   {
    "type": "fill",
    "prompt": "从这儿（___）右走，过一个路口，就是北京医院。",
    "pinyin": "Cóng zhèr ___ yòu zǒu, guò yí ge lùkǒu, jiù shì Běijīng Yīyuàn.",
    "en": "From here go ___ the right, cross one intersection, and there's Beijing Hospital.",
    "options": [
     {
      "k": "A",
      "zh": "拿",
      "py": "ná",
      "en": "hold"
     },
     {
      "k": "B",
      "zh": "笑",
      "py": "xiào",
      "en": "smile / laugh"
     },
     {
      "k": "C",
      "zh": "长",
      "py": "zhǎng",
      "en": "grow / have"
     },
     {
      "k": "D",
      "zh": "往",
      "py": "wǎng",
      "en": "toward"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "一直",
      "py": "yìzhí",
      "en": "straight"
     }
    ],
    "answer": "D",
    "explain": "往 (wǎng) — 往右走 means “go to the right.”"
   },
   {
    "type": "fill",
    "prompt": "你们班有没有一个（___）着大眼睛、爱穿红衣服的学生？",
    "pinyin": "Nǐmen bān yǒu méiyǒu yí ge ___ zhe dà yǎnjing, ài chuān hóng yīfu de xuésheng?",
    "en": "Is there a student in your class who ___ big eyes and loves wearing red?",
    "options": [
     {
      "k": "A",
      "zh": "拿",
      "py": "ná",
      "en": "hold"
     },
     {
      "k": "B",
      "zh": "笑",
      "py": "xiào",
      "en": "smile / laugh"
     },
     {
      "k": "C",
      "zh": "长",
      "py": "zhǎng",
      "en": "grow / have"
     },
     {
      "k": "D",
      "zh": "往",
      "py": "wǎng",
      "en": "toward"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "一直",
      "py": "yìzhí",
      "en": "straight"
     }
    ],
    "answer": "C",
    "explain": "长 (zhǎng) — 长着大眼睛 means “has big eyes.”"
   },
   {
    "type": "fill",
    "prompt": "从这个路口（___）走，就能看到你们学校了。",
    "pinyin": "Cóng zhège lùkǒu ___ zǒu, jiù néng kàndào nǐmen xuéxiào le.",
    "en": "Go ___ from this intersection and you'll see your school.",
    "options": [
     {
      "k": "A",
      "zh": "拿",
      "py": "ná",
      "en": "hold"
     },
     {
      "k": "B",
      "zh": "笑",
      "py": "xiào",
      "en": "smile / laugh"
     },
     {
      "k": "C",
      "zh": "长",
      "py": "zhǎng",
      "en": "grow / have"
     },
     {
      "k": "D",
      "zh": "往",
      "py": "wǎng",
      "en": "toward"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "一直",
      "py": "yìzhí",
      "en": "straight"
     }
    ],
    "answer": "F",
    "explain": "一直 (yìzhí) — 一直走 means “go straight.”"
   },
   {
    "type": "tf",
    "context": "大卫不是找到新工作了吗？怎么还天天在家玩儿电脑？",
    "contextPy": "Dàwèi bú shì zhǎodào xīn gōngzuò le ma? Zěnme hái tiāntiān zài jiā wánr diànnǎo?",
    "contextEn": "Didn't David find a new job? Why is he still at home on the computer every day?",
    "statement": "大卫每天工作。",
    "statementPy": "Dàwèi měi tiān gōngzuò.",
    "statementEn": "David works every day.",
    "answer": false,
    "explain": "He's home on the computer daily, which suggests he isn't working."
   },
   {
    "type": "tf",
    "context": "我的一个朋友正在找房子，他希望住得离公司近一些。",
    "contextPy": "Wǒ de yí ge péngyou zhèngzài zhǎo fángzi, tā xīwàng zhù de lí gōngsī jìn yìxiē.",
    "contextEn": "A friend of mine is house-hunting; he hopes to live closer to the office.",
    "statement": "他家离公司很远。",
    "statementPy": "Tā jiā lí gōngsī hěn yuǎn.",
    "statementEn": "His home is far from the office.",
    "answer": true,
    "explain": "Wanting to move closer implies his current place is far."
   },
   {
    "type": "tf",
    "context": "妈妈告诉我说，不要开着车听音乐。",
    "contextPy": "Māma gàosu wǒ shuō, bú yào kāizhe chē tīng yīnyuè.",
    "contextEn": "Mom told me not to listen to music while driving.",
    "statement": "开着车听音乐不好。",
    "statementPy": "Kāizhe chē tīng yīnyuè bù hǎo.",
    "statementEn": "Listening to music while driving is bad.",
    "answer": true,
    "explain": "Mom warns against it, so it's treated as not good."
   },
   {
    "type": "tf",
    "context": "从我家到北京，坐火车就5个小时，比坐飞机便宜多了。所以我明天准备坐火车去北京。",
    "contextPy": "Cóng wǒ jiā dào Běijīng, zuò huǒchē jiù wǔ ge xiǎoshí, bǐ zuò fēijī piányi duō le. Suǒyǐ wǒ míngtiān zhǔnbèi zuò huǒchē qù Běijīng.",
    "contextEn": "Home to Beijing is just five hours by train and far cheaper than flying, so I'll take the train tomorrow.",
    "statement": "我正在坐火车去北京。",
    "statementPy": "Wǒ zhèngzài zuò huǒchē qù Běijīng.",
    "statementEn": "I'm on the train to Beijing right now.",
    "answer": false,
    "explain": "The trip is planned for tomorrow — not happening now."
   },
   {
    "type": "tf",
    "context": "李哥，你手里拿着的是电影票吗？我也想跟你一起去看电影。",
    "contextPy": "Lǐ gē, nǐ shǒuli názhe de shì diànyǐngpiào ma? Wǒ yě xiǎng gēn nǐ yìqǐ qù kàn diànyǐng.",
    "contextEn": "Brother Li, are those movie tickets in your hand? I'd like to go to the movies with you.",
    "statement": "李哥可能有电影票。",
    "statementPy": "Lǐ gē kěnéng yǒu diànyǐngpiào.",
    "statementEn": "Brother Li may have movie tickets.",
    "answer": true,
    "explain": "Asking whether he's holding tickets implies he possibly has them."
   }
  ],
  "images": {
   "A": "lesson-13-A.jpg",
   "B": "lesson-13-B.jpg",
   "C": "lesson-13-C.jpg",
   "D": "lesson-13-D.jpg",
   "E": "lesson-13-E.jpg",
   "F": "lesson-13-F.jpg"
  }
 },
 {
  "id": 14,
  "zh": "你看过这个电影吗",
  "pinyin": "Nǐ kàn guo zhège diànyǐng ma",
  "en": "Have you seen this movie",
  "questions": [
   {
    "type": "picture",
    "prompt": "长城很漂亮，我已经去过三次了。",
    "pinyin": "Chángchéng hěn piàoliang, wǒ yǐjīng qùguo sān cì le.",
    "en": "The Great Wall is beautiful; I've been three times.",
    "answer": "C",
    "explain": "“长城” (the Great Wall) → the photo of the Wall."
   },
   {
    "type": "picture",
    "prompt": "来中国以后，我已经得过两次病了。",
    "pinyin": "Lái Zhōngguó yǐhòu, wǒ yǐjīng déguo liǎng cì bìng le.",
    "en": "Since coming to China I've fallen ill twice.",
    "answer": "E",
    "explain": "“得病” (falling ill) → the person who is sick."
   },
   {
    "type": "picture",
    "prompt": "虽然是晴天，但是很冷。",
    "pinyin": "Suīrán shì qíngtiān, dànshì hěn lěng.",
    "en": "Though sunny, it's very cold.",
    "answer": "A",
    "explain": "“晴天…很冷” (sunny but cold) → the bundled-up girl by the snowman."
   },
   {
    "type": "picture",
    "prompt": "不下雨了，天晴了。",
    "pinyin": "Bú xià yǔ le, tiān qíng le.",
    "en": "It's stopped raining; the sky has cleared.",
    "answer": "F",
    "explain": "“天晴了” (sky clearing) → the woman with the umbrella as it clears."
   },
   {
    "type": "picture",
    "prompt": "我们已经学过这个汉字了。",
    "pinyin": "Wǒmen yǐjīng xuéguo zhège Hànzì le.",
    "en": "We've already learned this character.",
    "answer": "B",
    "explain": "“汉字” (Chinese characters) → the teacher at the board with characters."
   },
   {
    "type": "fill",
    "prompt": "老师的话是什么（___），我没听懂。",
    "pinyin": "Lǎoshī de huà shì shénme ___, wǒ méi tīngdǒng.",
    "en": "What was the ___ of what the teacher said? I didn't catch it.",
    "options": [
     {
      "k": "A",
      "zh": "有意思",
      "py": "yǒu yìsi",
      "en": "interesting"
     },
     {
      "k": "B",
      "zh": "但是",
      "py": "dànshì",
      "en": "but"
     },
     {
      "k": "C",
      "zh": "意思",
      "py": "yìsi",
      "en": "meaning"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "(experience)"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "听说",
      "py": "tīngshuō",
      "en": "heard that"
     }
    ],
    "answer": "C",
    "explain": "意思 (yìsi) — 什么意思 means “what (it) means.”"
   },
   {
    "type": "fill",
    "prompt": "我（___）这本书非常好看，但是我还没看过。",
    "pinyin": "Wǒ ___ zhè běn shū fēicháng hǎokàn, dànshì wǒ hái méi kànguo.",
    "en": "I ___ this book is excellent, but I haven't read it yet.",
    "options": [
     {
      "k": "A",
      "zh": "有意思",
      "py": "yǒu yìsi",
      "en": "interesting"
     },
     {
      "k": "B",
      "zh": "但是",
      "py": "dànshì",
      "en": "but"
     },
     {
      "k": "C",
      "zh": "意思",
      "py": "yìsi",
      "en": "meaning"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "(experience)"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "听说",
      "py": "tīngshuō",
      "en": "heard that"
     }
    ],
    "answer": "F",
    "explain": "听说 (tīngshuō) — “heard that.”"
   },
   {
    "type": "fill",
    "prompt": "那个电影太（___）了，我已经看过两次了。",
    "pinyin": "Nàge diànyǐng tài ___ le, wǒ yǐjīng kànguo liǎng cì le.",
    "en": "That movie is so ___ — I've already watched it twice.",
    "options": [
     {
      "k": "A",
      "zh": "有意思",
      "py": "yǒu yìsi",
      "en": "interesting"
     },
     {
      "k": "B",
      "zh": "但是",
      "py": "dànshì",
      "en": "but"
     },
     {
      "k": "C",
      "zh": "意思",
      "py": "yìsi",
      "en": "meaning"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "(experience)"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "听说",
      "py": "tīngshuō",
      "en": "heard that"
     }
    ],
    "answer": "A",
    "explain": "有意思 (yǒu yìsi) — 太有意思了 means “so interesting.”"
   },
   {
    "type": "fill",
    "prompt": "虽然工作很忙，（___）我每个星期都要运动。",
    "pinyin": "Suīrán gōngzuò hěn máng, ___ wǒ měi ge xīngqī dōu yào yùndòng.",
    "en": "Although work is busy, ___ I exercise every week.",
    "options": [
     {
      "k": "A",
      "zh": "有意思",
      "py": "yǒu yìsi",
      "en": "interesting"
     },
     {
      "k": "B",
      "zh": "但是",
      "py": "dànshì",
      "en": "but"
     },
     {
      "k": "C",
      "zh": "意思",
      "py": "yìsi",
      "en": "meaning"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "(experience)"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "听说",
      "py": "tīngshuō",
      "en": "heard that"
     }
    ],
    "answer": "B",
    "explain": "但是 (dànshì) — pairs with 虽然: “although… but….”"
   },
   {
    "type": "fill",
    "prompt": "我已经去（___）北京好几次了，但是还想再去玩儿玩儿。",
    "pinyin": "Wǒ yǐjīng qù ___ Běijīng hǎo jǐ cì le, dànshì hái xiǎng zài qù wánrwanr.",
    "en": "I've already been ___ Beijing several times, but I still want to visit again.",
    "options": [
     {
      "k": "A",
      "zh": "有意思",
      "py": "yǒu yìsi",
      "en": "interesting"
     },
     {
      "k": "B",
      "zh": "但是",
      "py": "dànshì",
      "en": "but"
     },
     {
      "k": "C",
      "zh": "意思",
      "py": "yìsi",
      "en": "meaning"
     },
     {
      "k": "D",
      "zh": "过",
      "py": "guò",
      "en": "(experience)"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "听说",
      "py": "tīngshuō",
      "en": "heard that"
     }
    ],
    "answer": "D",
    "explain": "过 (guò) — marks past experience: 去过 “have been to.”"
   },
   {
    "type": "tf",
    "context": "昨天和朋友们在外面玩儿了一个晚上，很累，但是非常高兴。",
    "contextPy": "Zuótiān hé péngyoumen zài wàimian wánrle yí ge wǎnshang, hěn lèi, dànshì fēicháng gāoxìng.",
    "contextEn": "I spent last evening out with friends — tiring, but a lot of fun.",
    "statement": "昨天玩儿得不好。",
    "statementPy": "Zuótiān wánr de bù hǎo.",
    "statementEn": "Yesterday wasn't fun.",
    "answer": false,
    "explain": "“Very happy” shows they had a good time."
   },
   {
    "type": "tf",
    "context": "他做的菜比我做的好吃，但是因为工作忙，他很少做。",
    "contextPy": "Tā zuò de cài bǐ wǒ zuò de hǎochī, dànshì yīnwèi gōngzuò máng, tā hěn shǎo zuò.",
    "contextEn": "His cooking is tastier than mine, but he rarely cooks because work keeps him busy.",
    "statement": "他不会做菜。",
    "statementPy": "Tā bú huì zuò cài.",
    "statementEn": "He can't cook.",
    "answer": false,
    "explain": "He cooks well — he just does it rarely."
   },
   {
    "type": "tf",
    "context": "我和朋友们去过这家商店，还在这儿买过两次东西。",
    "contextPy": "Wǒ hé péngyoumen qùguo zhè jiā shāngdiàn, hái zài zhèr mǎiguo liǎng cì dōngxi.",
    "contextEn": "My friends and I have been to this store and shopped here twice.",
    "statement": "这个商店他去过两次。",
    "statementPy": "Zhège shāngdiàn tā qùguo liǎng cì.",
    "statementEn": "He has been to this store twice.",
    "answer": false,
    "explain": "It was “my friends and I,” and shopping twice isn't the same as visiting twice."
   },
   {
    "type": "tf",
    "context": "从学校到机场，坐出租车要一个小时，我们10点的飞机，8点从学校走可以吗？",
    "contextPy": "Cóng xuéxiào dào jīchǎng, zuò chūzūchē yào yí ge xiǎoshí, wǒmen shí diǎn de fēijī, bā diǎn cóng xuéxiào zǒu kěyǐ ma?",
    "contextEn": "School to airport is an hour by taxi; our flight is at ten — can we leave school at eight?",
    "statement": "他们要坐8点的飞机。",
    "statementPy": "Tāmen yào zuò bā diǎn de fēijī.",
    "statementEn": "They're taking the eight-o'clock flight.",
    "answer": false,
    "explain": "The flight is at ten; eight is when they leave school."
   },
   {
    "type": "tf",
    "context": "小李说这个电影很有意思，但是我没看过。",
    "contextPy": "Xiǎo Lǐ shuō zhège diànyǐng hěn yǒu yìsi, dànshì wǒ méi kànguo.",
    "contextEn": "Xiao Li says this movie is interesting, but I haven't seen it.",
    "statement": "小李看过这个电影。",
    "statementPy": "Xiǎo Lǐ kànguo zhège diànyǐng.",
    "statementEn": "Xiao Li has seen this movie.",
    "answer": true,
    "explain": "Xiao Li's comment on the movie implies he has seen it."
   }
  ],
  "images": {
   "A": "lesson-14-A.jpg",
   "B": "lesson-14-B.jpg",
   "C": "lesson-14-C.jpg",
   "D": "lesson-14-D.jpg",
   "E": "lesson-14-E.jpg",
   "F": "lesson-14-F.jpg"
  }
 },
 {
  "id": 15,
  "zh": "新年就要到了",
  "pinyin": "Xīnnián jiù yào dào le",
  "en": "The New Year is coming",
  "questions": [
   {
    "type": "picture",
    "prompt": "小王怎么还没来？都快十点了。",
    "pinyin": "Xiǎo Wáng zěnme hái méi lái? Dōu kuài shí diǎn le.",
    "en": "Why isn't Xiao Wang here yet? It's almost ten.",
    "answer": "B",
    "explain": "“还没来…快十点了” (waiting, late) → the man checking his watch."
   },
   {
    "type": "picture",
    "prompt": "妹妹还没睡觉，正在看电视呢。",
    "pinyin": "Mèimei hái méi shuì jiào, zhèngzài kàn diànshì ne.",
    "en": "My little sister isn't asleep; she's watching TV.",
    "answer": "C",
    "explain": "“看电视” (watching TV) → the girl lounging by the screen."
   },
   {
    "type": "picture",
    "prompt": "你都玩儿了一个多小时的手机了，快点儿工作吧。",
    "pinyin": "Nǐ dōu wánr le yí ge duō xiǎoshí de shǒujī le, kuàidiǎnr gōngzuò ba.",
    "en": "You've been on your phone over an hour — get to work.",
    "answer": "E",
    "explain": "“手机” (mobile phone) → the hand on the phone."
   },
   {
    "type": "picture",
    "prompt": "非常欢迎你来我们公司工作。",
    "pinyin": "Fēicháng huānyíng nǐ lái wǒmen gōngsī gōngzuò.",
    "en": "We warmly welcome you to work at our company.",
    "answer": "A",
    "explain": "“欢迎…公司工作” (welcoming to the company) → the office team."
   },
   {
    "type": "picture",
    "prompt": "我觉得你姐姐比你妹妹更漂亮。",
    "pinyin": "Wǒ juéde nǐ jiějie bǐ nǐ mèimei gèng piàoliang.",
    "en": "I think your older sister is prettier than your younger one.",
    "answer": "F",
    "explain": "“姐姐…妹妹” (two sisters compared) → the two sisters."
   },
   {
    "type": "fill",
    "prompt": "天（___）了，可能要下雨了，我们快点儿回家吧。",
    "pinyin": "Tiān ___ le, kěnéng yào xià yǔ le, wǒmen kuài diǎnr huí jiā ba.",
    "en": "The sky has turned ___ — it may rain; let's hurry home.",
    "options": [
     {
      "k": "A",
      "zh": "新年",
      "py": "xīnnián",
      "en": "New Year"
     },
     {
      "k": "B",
      "zh": "更",
      "py": "gèng",
      "en": "even more"
     },
     {
      "k": "C",
      "zh": "大家",
      "py": "dàjiā",
      "en": "everyone"
     },
     {
      "k": "D",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "阴",
      "py": "yīn",
      "en": "cloudy"
     }
    ],
    "answer": "F",
    "explain": "阴 (yīn) — 天阴了 means “the sky has clouded over.”"
   },
   {
    "type": "fill",
    "prompt": "我喜欢吃苹果，但是我（___）喜欢吃西瓜。",
    "pinyin": "Wǒ xǐhuan chī píngguǒ, dànshì wǒ ___ xǐhuan chī xīguā.",
    "en": "I like apples, but I like watermelon ___.",
    "options": [
     {
      "k": "A",
      "zh": "新年",
      "py": "xīnnián",
      "en": "New Year"
     },
     {
      "k": "B",
      "zh": "更",
      "py": "gèng",
      "en": "even more"
     },
     {
      "k": "C",
      "zh": "大家",
      "py": "dàjiā",
      "en": "everyone"
     },
     {
      "k": "D",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "阴",
      "py": "yīn",
      "en": "cloudy"
     }
    ],
    "answer": "B",
    "explain": "更 (gèng) — 更喜欢 means “like even more.”"
   },
   {
    "type": "fill",
    "prompt": "听说北京很漂亮，（___）都想去北京旅行。",
    "pinyin": "Tīngshuō Běijīng hěn piàoliang, ___ dōu xiǎng qù Běijīng lǚxíng.",
    "en": "I hear Beijing is beautiful; ___ wants to travel there.",
    "options": [
     {
      "k": "A",
      "zh": "新年",
      "py": "xīnnián",
      "en": "New Year"
     },
     {
      "k": "B",
      "zh": "更",
      "py": "gèng",
      "en": "even more"
     },
     {
      "k": "C",
      "zh": "大家",
      "py": "dàjiā",
      "en": "everyone"
     },
     {
      "k": "D",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "阴",
      "py": "yīn",
      "en": "cloudy"
     }
    ],
    "answer": "C",
    "explain": "大家 (dàjiā) — 大家都想去 means “everyone wants to go.”"
   },
   {
    "type": "fill",
    "prompt": "谢谢大家这一年对我的（___）。",
    "pinyin": "Xièxie dàjiā zhè yì nián duì wǒ de ___.",
    "en": "Thank you all for your ___ to me this year.",
    "options": [
     {
      "k": "A",
      "zh": "新年",
      "py": "xīnnián",
      "en": "New Year"
     },
     {
      "k": "B",
      "zh": "更",
      "py": "gèng",
      "en": "even more"
     },
     {
      "k": "C",
      "zh": "大家",
      "py": "dàjiā",
      "en": "everyone"
     },
     {
      "k": "D",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "阴",
      "py": "yīn",
      "en": "cloudy"
     }
    ],
    "answer": "D",
    "explain": "帮助 (bāngzhù) — 对我的帮助 means “help to me.”"
   },
   {
    "type": "fill",
    "prompt": "今天是12月28号了，（___）快要到了。",
    "pinyin": "Jīntiān shì shí'èr yuè èrshíbā hào le, ___ kuài yào dào le.",
    "en": "Today is December 28th — the ___ is almost here.",
    "options": [
     {
      "k": "A",
      "zh": "新年",
      "py": "xīnnián",
      "en": "New Year"
     },
     {
      "k": "B",
      "zh": "更",
      "py": "gèng",
      "en": "even more"
     },
     {
      "k": "C",
      "zh": "大家",
      "py": "dàjiā",
      "en": "everyone"
     },
     {
      "k": "D",
      "zh": "帮助",
      "py": "bāngzhù",
      "en": "help"
     },
     {
      "k": "E",
      "zh": "贵",
      "py": "guì",
      "en": "expensive"
     },
     {
      "k": "F",
      "zh": "阴",
      "py": "yīn",
      "en": "cloudy"
     }
    ],
    "answer": "A",
    "explain": "新年 (xīnnián) — 新年快要到了 means “New Year is almost here.”"
   },
   {
    "type": "tf",
    "context": "我看过那个电影，还不错，但是我更喜欢今天这个电影，太有意思了。",
    "contextPy": "Wǒ kànguo nàge diànyǐng, hái bú cuò, dànshì wǒ gèng xǐhuan jīntiān zhège diànyǐng, tài yǒu yìsi le.",
    "contextEn": "I've seen that movie — not bad — but I prefer today's; it's so interesting.",
    "statement": "今天的电影更好。",
    "statementPy": "Jīntiān de diànyǐng gèng hǎo.",
    "statementEn": "Today's movie is better.",
    "answer": true,
    "explain": "The speaker likes today's movie more, so they rate it higher."
   },
   {
    "type": "tf",
    "context": "我弟弟在一家电脑公司找了个工作。今天是他第一天上班，他早上六点就起床了。",
    "contextPy": "Wǒ dìdi zài yì jiā diànnǎo gōngsī zhǎole ge gōngzuò. Jīntiān shì tā dì yī tiān shàng bān, tā zǎoshang liù diǎn jiù qǐ chuáng le.",
    "contextEn": "My brother got a job at a computer company. Today is his first day, and he was up at six.",
    "statement": "弟弟今天开始上班。",
    "statementPy": "Dìdi jīntiān kāishǐ shàng bān.",
    "statementEn": "My brother starts work today.",
    "answer": true,
    "explain": "It's stated to be his first day on the job."
   },
   {
    "type": "tf",
    "context": "我每天早上都出去跑步。昨天天气不太好，是阴天。等我跑回家时，天晴了。",
    "contextPy": "Wǒ měi tiān zǎoshang dōu chūqù pǎo bù. Zuótiān tiānqì bú tài hǎo, shì yīntiān. Děng wǒ pǎo huí jiā shí, tiān qíng le.",
    "contextEn": "I run every morning. Yesterday was overcast, but by the time I ran home it had cleared up.",
    "statement": "昨天下雨了。",
    "statementPy": "Zuótiān xià yǔ le.",
    "statementEn": "It rained yesterday.",
    "answer": false,
    "explain": "Yesterday was cloudy and then cleared — no rain is mentioned."
   },
   {
    "type": "tf",
    "context": "火车站前面有个“一元店”，在那儿一块钱就可以买一件东西。我都去过很多次了。",
    "contextPy": "Huǒchēzhàn qiánmian yǒu ge “Yì Yuán Diàn”, zài nàr yí kuài qián jiù kěyǐ mǎi yí jiàn dōngxi. Wǒ dōu qùguo hěn duō cì le.",
    "contextEn": "There's a “One-Yuan Store” by the station where one yuan buys an item; I've been many times.",
    "statement": "“一元店”的东西很贵。",
    "statementPy": "“Yì Yuán Diàn” de dōngxi hěn guì.",
    "statementEn": "The One-Yuan Store's goods are expensive.",
    "answer": false,
    "explain": "One yuan an item means the goods are cheap, not expensive."
   },
   {
    "type": "tf",
    "context": "我来北京已经三个多月了，下个月我就要回国了。",
    "contextPy": "Wǒ lái Běijīng yǐjīng sān ge duō yuè le, xià ge yuè wǒ jiù yào huí guó le.",
    "contextEn": "I've been in Beijing over three months; next month I'll go back to my country.",
    "statement": "他可能在北京住四个月。",
    "statementPy": "Tā kěnéng zài Běijīng zhù sì ge yuè.",
    "statementEn": "He may stay in Beijing about four months.",
    "answer": true,
    "explain": "Over three months now plus leaving next month works out to roughly four."
   }
  ],
  "images": {
   "A": "lesson-15-A.jpg",
   "B": "lesson-15-B.jpg",
   "C": "lesson-15-C.jpg",
   "D": "lesson-15-D.jpg",
   "E": "lesson-15-E.jpg",
   "F": "lesson-15-F.jpg"
  }
 }
];
