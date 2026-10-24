// Generates scripts/content/word-readings.json: the common reading of every
// multi-reading complete-hsk.json entry (pinyin-pro's polyphone dictionary),
// plus the curated OVERRIDES below. Read by scripts/lib/word-forms.ts when
// 02-build-vocab-db.ts picks each word's reading (lessons still win).
//
// pinyin-pro is deliberately not a project dependency:
//   npm i --no-save pinyin-pro@3.26.0 && node scripts/content/gen-word-readings.cjs
const { pinyin } = require("pinyin-pro");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const data = JSON.parse(fs.readFileSync(`${root}/data/sources/complete-hsk.json`, "utf8"));
const norm = (p) => p.normalize("NFC").toLowerCase().replace(/[\s'’\-·]/g, "");
const toneless = (p) => norm(p).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/g, "u");

// Curated: neutral-tone pairs pinyin-pro can't tell apart, and entries with
// several forms of the same pinyin (English picks the right one).
const OVERRIDES = {
  本事: ["běn shi", "ability; skill"], 大方: ["dà fang", "generous"], 大爷: ["dà ye", "uncle; grandpa"],
  地方: ["dì fang", "place; area"], 故事: ["gù shi", "story"], 好处: ["hǎo chu", "benefit; advantage"],
  精神: ["jīng shén", "spirit; mind"], 老公: ["lǎo gōng", "husband"], 女人: ["nǚ rén", "woman"],
  人家: ["rén jia", "other people"], 生意: ["shēng yi", "business"], 土地: ["tǔ dì", "land; territory"],
  台: ["tái", "platform; stage; Taiwan; classifier for machines"], 钟: ["zhōng", "clock; bell; o'clock"],
  筑: ["zhù", "to build; to construct"], 咸: ["xián", "salty"], 余: ["yú", "surplus; remainder; extra"],
  于: ["yú", "in; at; to; from"], 项: ["xiàng", "item; classifier for items"], 当: ["dāng", "to be; to act as; should; when"],
  关: ["guān", "to close; to shut; to turn off; relationship"], 表: ["biǎo", "watch; meter; table; to express"],
  场: ["chǎng", "large place; field; classifier for events"], 话: ["huà", "words; speech; talk"],
  回: ["huí", "to return; to go back; time (classifier)"], 叫: ["jiào", "to call; to be called"],
  局: ["jú", "office; bureau; game"], 考: ["kǎo", "to take an exam; test"], 困: ["kùn", "sleepy; tired; difficult"],
  伙: ["huǒ", "companion; partner; group"], 准: ["zhǔn", "accurate; standard; to allow"], 证: ["zhèng", "certificate; proof"],
  系: ["xì", "department; system; to be"], 团: ["tuán", "group"], 刮: ["guā", "to blow (of the wind); to scrape"],
  怪: ["guài", "strange; odd; to blame"], 包: ["bāo", "bag; package; to wrap"], 解: ["jiě", "to untie; to solve; to explain"],
  经: ["jīng", "to pass through; to undergo; classics"], 修: ["xiū", "to repair; to build"], 单: ["dān", "single; list"],
  朝: ["cháo", "towards; facing"], 汤: ["tāng", "soup"], 露: ["lù", "dew; to reveal"], 面: ["miàn", "face; side; noodles; flour"],
  只: ["zhǐ", "only; just"], 云: ["yún", "cloud"], 教: ["jiāo", "to teach"], 录: ["lù", "to record; to write down"],
  卡: ["kǎ", "card"], 切: ["qiē", "to cut; to slice"], 应: ["yīng", "should; ought to"], 种: ["zhǒng", "kind; type; sort"],
  周: ["zhōu", "week"], 奶: ["nǎi", "milk"], 才: ["cái", "only then; just"], 工夫: ["gōng fu", "time; effort"],
  划: ["huá", "to row; to paddle"],
  便: ["biàn", "convenient; handy"], 嗯: ["en", "yes; OK"], 地道: ["dì dao", "authentic; genuine"],
  出息: ["chū xi", "prospects; promising"], 分量: ["fèn liàng", "weight; amount"], 家伙: ["jiā huo", "guy; fellow"],
  面子: ["miàn zi", "face; reputation; prestige"], 口音: ["kǒu yin", "accent"], 夹: ["jiā", "to press; to clip; to squeeze"],
  拧: ["nǐng", "to twist; to screw"], 拟: ["nǐ", "to draft; to plan"], 蒙: ["méng", "to cover; ignorant"],
  把手: ["bǎ shou", "handle; grip"], 啦: ["la", "particle"], 望: ["wàng", "to look; to hope; to expect"],
  闲: ["xián", "idle; leisure"], 愿: ["yuàn", "to wish; willing"], 戏: ["xì", "play; drama; show"], 同: ["tóng", "same; together"],
  说法: ["shuō fa", "way of saying; statement; version"], 台风: ["tái fēng", "typhoon"], 为人: ["wéi rén", "to conduct oneself"],
  正当: ["zhèng dàng", "proper; legitimate"], 钻: ["zuān", "to drill; to bore"], 琢磨: ["zuó mo", "to ponder; to think over"],
  闸: ["zhá", "floodgate; brake"],
  张: ["zhāng", "classifier for flat objects; to open"], 次: ["cì", "time (classifier); order; second"],
};

const out = {};
let fromLib = 0, unmatched = [];
for (const e of data) {
  if (!e.simplified || (e.forms?.length ?? 0) < 2) continue;
  const p = pinyin(e.simplified);
  const forms = e.forms.map((f) => f.transcriptions?.pinyin ?? "");
  if (forms.some((f) => norm(f) === norm(p)) || forms.some((f) => toneless(f) === toneless(p))) { out[e.simplified] = { pinyin: p }; fromLib++; }
  else unmatched.push(`${e.simplified}:${p}[${forms.join("|")}]`);
}
for (const [w, [p, en]] of Object.entries(OVERRIDES)) out[w] = { pinyin: p, english: en };
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b, "zh")));
fs.writeFileSync(`${root}/scripts/content/word-readings.json`, JSON.stringify(sorted, null, 1) + "\n");
console.log("entries:", Object.keys(sorted).length, "from pinyin-pro:", fromLib, "overrides:", Object.keys(OVERRIDES).length);
console.log("pinyin-pro reading not among forms:", unmatched.length, unmatched.slice(0, 30).join(" "));
