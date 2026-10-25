// Static "how to use the app" guide. Linked from Home and the Library hub.
// Box intervals come from lib/leitner-rules.ts so the guide can't drift
// from the scheduler.

import Link from "next/link";
import { BOX_DAYS, BOX_NAMES, MASTERED_DAYS } from "@/lib/leitner-rules";

export const metadata = { title: "How to use · 汉语学习" };

const muted = { color: "var(--text-muted)", fontFamily: "Spectral, serif" };
const heading = { color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" };

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl" style={{ ...heading, letterSpacing: "0.08em" }}>How to use 汉语学习</h1>
        <p className="text-sm mt-2" style={muted}>
          Learn a lesson, then let the app tell you what to review each day.
        </p>
      </div>

      <Contents />

      <Section id="idea" n={1} hanzi="道" title="The idea in one minute">
        <p>The app has three parts, one per tab:</p>
        <ul className="space-y-2 mt-2">
          <Bullet><b>Course</b>: the HSK lessons, in order. This is where new words and grammar come from.</Bullet>
          <Bullet><b>Practice</b>: everything that trains your memory (review, writing, listening, shadowing, flashcards).</Bullet>
          <Bullet><b>Library</b>: things to look up whenever you want (dictionary, reader, grammar).</Bullet>
        </ul>
        <p className="mt-3">
          A good day looks like this: clear the cards that are due in <b>Review</b>, then do a lesson or a drill if you have time.
        </p>
        <Callout>
          <Link href="/auth" style={{ color: "var(--accent-gold)" }}>Sign in</Link> to save your progress.
          Without an account you can use everything, but nothing is remembered.
        </Callout>
      </Section>

      <Section id="course" n={2} hanzi="课" title="Do a lesson">
        <p>
          Open <b>Course</b>, choose a level, then a lesson. Each lesson is a short guided path. Tap <b>Continue</b> to move through it:
        </p>
        <ol className="mt-3 space-y-2">
          <Step n={1} title="Listen">Hear the lesson dialogues before reading them.</Step>
          <Step n={2} title="Read">Read the dialogues with pinyin and translation.</Step>
          <Step n={3} title="Vocab">The lesson&apos;s new words. Tap <b>Add to deck</b> to start studying them in Review.</Step>
          <Step n={4} title="Grammar">The grammar points, with examples and pattern tables.</Step>
          <Step n={5} title="Practice">Exercises, pronunciation, characters and culture notes.</Step>
          <Step n={6} title="Done">Your summary for the lesson.</Step>
        </ol>
        <Callout>
          The HSK 1 and HSK 2 words are already waiting as New words when you sign in. <b>Add to deck</b> is useful
          for words from other levels or to make sure a lesson&apos;s words are included.
        </Callout>
      </Section>

      <Section id="leitner" n={3} hanzi="盒" title="How review works">
        <p>
          Every word is a card, and every card has a stage that says how well you know it. The further along
          the stage, the longer the app waits before showing you that word again. This is the <b>Leitner method</b>:
          you spend your time on the words you&apos;re forgetting, not on the ones you already know.
        </p>

        <BoxDiagram />

        <p className="mt-4">Each time you see a card, you answer honestly:</p>
        <ul className="space-y-2 mt-2">
          <Bullet>
            <b style={{ color: "var(--accent-gold)" }}>Know it</b>: the card moves <b>one stage forward</b> and comes back later.
            A new word you already know goes straight to {BOX_NAMES[2]}.
          </Bullet>
          <Bullet>
            <b style={{ color: "var(--accent-rose)" }}>Don&apos;t know</b>: the card goes <b>back to {BOX_NAMES[1]}</b> and you&apos;ll see it again today.
          </Bullet>
          <Bullet>
            <b>{BOX_NAMES[5]}</b> is the last stage. If you still know the word, it stays there and is checked every {MASTERED_DAYS} days.
          </Bullet>
          <Bullet>
            Answering <b>Know it</b> on a card that isn&apos;t due yet (for example in Flashcards) doesn&apos;t move it. Only due cards move forward.
          </Bullet>
        </ul>

        <Example />

        <p className="mt-4">
          After each answer you&apos;ll see a short line like <Mono>长 · {BOX_NAMES[2]} → {BOX_NAMES[3]}</Mono> so you always know where the card went.
          The Home page shows how many of your words are in each stage.
        </p>

        <p className="mt-4">Each word has three separate cards, because knowing a word in one way doesn&apos;t mean you know it in the others:</p>
        <ul className="space-y-2 mt-2">
          <Bullet><b>Recognition</b>: see the characters and remember the meaning (Review, Flashcards).</Bullet>
          <Bullet><b>Listening</b>: hear the word and recognize it (Review in listening mode, Tone drill).</Bullet>
          <Bullet><b>Writing</b>: write the characters stroke by stroke (Writing).</Bullet>
        </ul>
        <Callout>
          The days follow your own time zone, so &quot;due today&quot; means today where you are.
        </Callout>
      </Section>

      <Section id="daily" n={4} hanzi="日" title="Your daily routine">
        <ol className="space-y-2">
          <Step n={1} title="Review">
            Open <Link href="/review" style={{ color: "var(--accent-gold)" }}>Review</Link>. Look at the card, try to remember it,
            then tap <b>Reveal</b> and answer honestly. Due cards come first, then a few new words.
          </Step>
          <Step n={2} title="Writing">
            In <Link href="/writing" style={{ color: "var(--accent-gold)" }}>Writing</Link>, draw each character. The app shows the stroke order if you get stuck.
          </Step>
          <Step n={3} title="Listening">
            In <Link href="/listening" style={{ color: "var(--accent-gold)" }}>Listening</Link>, the tone drill updates your listening progress;
            dictation trains your ear with full sentences.
          </Step>
          <Step n={4} title="Something new">
            If you still have energy, do the next lesson in <Link href="/course" style={{ color: "var(--accent-gold)" }}>Course</Link>.
          </Step>
        </ol>
        <Callout>
          Short and daily works better than long and occasional. Ten minutes of Review every day beats an hour once a week.
        </Callout>
      </Section>

      <Section id="decks" n={5} hanzi="卡" title="Study your own words">
        <p>You can make decks with the words you care about and study only those.</p>
        <ol className="mt-3 space-y-2">
          <Step n={1} title="Create a deck">
            Go to <Link href="/flashcards" style={{ color: "var(--accent-gold)" }}>Flashcards</Link> and tap <b>New deck</b>.
          </Step>
          <Step n={2} title="Add words">
            Search the dictionary and add words. If a word isn&apos;t in the dictionary, add it as a <b>custom</b> word with your own meaning.
          </Step>
          <Step n={3} title="Pick it anywhere">
            In Review, Writing, Listening and Flashcards, use the <b>Study from</b> selector at the top and choose your deck.
          </Step>
        </ol>
        <Callout>
          Your deck words share the same progress as everything else: a word you learn in your deck also counts as learned in HSK practice.
          Custom words have no audio, so they don&apos;t appear in listening practice.
        </Callout>
      </Section>

      <Section id="tools" n={6} hanzi="具" title="Every tool, briefly">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Tool href="/review" hanzi="复" title="Review" sub="Today's due cards. Recognition or listening mode." />
          <Tool href="/writing" hanzi="写" title="Writing" sub="Stroke-order practice, with its own progress." />
          <Tool href="/listening" hanzi="听" title="Listening" sub="Tone drill (saves progress) and sentence dictation." />
          <Tool href="/shadowing" hanzi="说" title="Shadowing" sub="Listen, record yourself, compare your pronunciation." />
          <Tool href="/flashcards" hanzi="卡" title="Flashcards" sub="Shuffle a deck freely. Answers on due cards count as review." />
          <Tool href="/vocab" hanzi="词" title="Dictionary" sub="Every HSK word with examples, audio and stroke order." />
          <Tool href="/reader" hanzi="读" title="Reader" sub="Tap any word in a text to see its meaning. Paste your own texts." />
          <Tool href="/grammar" hanzi="法" title="Grammar" sub="All grammar points by level, with sentence-building drills." />
        </div>
      </Section>

      <Section id="keys" n={7} hanzi="键" title="Keyboard shortcuts">
        <p>On a computer you can study without the mouse:</p>
        <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          <Key k="Space" what="Reveal the answer (Review)" />
          <Key k="1" what="Don't know" />
          <Key k="2" what="Know it" />
          <Key k="R" what="Play the audio again (listening cards)" />
          <Key k="← →" what="Previous / next card (Flashcards)" />
        </div>
      </Section>

      <div className="text-center pb-4">
        <Link href="/review" className="btn-gold inline-block px-6 py-3 rounded-xl">Start reviewing →</Link>
      </div>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  ["idea", "The idea"],
  ["course", "Do a lesson"],
  ["leitner", "How review works"],
  ["daily", "Daily routine"],
  ["decks", "Your own words"],
  ["tools", "Every tool"],
  ["keys", "Shortcuts"],
] as const;

function Contents() {
  return (
    <nav className="flex flex-wrap justify-center gap-2">
      {SECTIONS.map(([id, label]) => (
        <a key={id} href={`#${id}`} className="badge-gold">{label}</a>
      ))}
    </nav>
  );
}

function Section({ id, n, hanzi, title, children }: {
  id: string; n: number; hanzi: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl p-5 scroll-mt-24" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-display text-3xl shrink-0" style={{ color: "var(--ink)" }}>{hanzi}</span>
        <h2 className="text-lg sm:text-xl" style={heading}>
          <span style={{ color: "var(--text-muted)" }}>{n}.</span> {title}
        </h2>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span style={{ color: "var(--accent-gold)" }}>·</span>
      <span>{children}</span>
    </li>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)" }}
      >
        {n}
      </span>
      <span><b style={heading}>{title}</b> · {children}</span>
    </li>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg px-4 py-3 text-xs leading-relaxed" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.3)", ...muted }}>
      {children}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="badge-gold whitespace-nowrap">{children}</span>;
}

const STAGE_MEANINGS = [
  "",
  "Just met it, or forgot it. You'll see it again tomorrow.",
  "You remembered it once. It starts to stick.",
  "You remember it most of the time.",
  "You remember it easily, even after a week.",
  "You know it. Checked now and then so it stays that way.",
];

/** The five stages with their intervals and what each one means. */
function BoxDiagram() {
  const boxes = BOX_DAYS.slice(1);
  return (
    <div className="mt-4 space-y-1.5">
      {boxes.map((days, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}>
          <div className="shrink-0 w-20">
            <div
              className="text-base font-bold leading-tight"
              style={{ color: i === 0 ? "var(--accent-rose)" : i === boxes.length - 1 ? "var(--ink)" : "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}
            >
              {BOX_NAMES[i + 1]}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {i === boxes.length - 1 ? `every ${days}–${MASTERED_DAYS} days` : days === 1 ? "every day" : `every ${days} days`}
            </div>
          </div>
          <div className="text-xs" style={muted}>{STAGE_MEANINGS[i + 1]}</div>
        </div>
      ))}
      <div className="text-[11px] pt-1" style={muted}>
        <span style={{ color: "var(--accent-gold)" }}>Know it</span> moves a word one step down this list.{" "}
        <span style={{ color: "var(--accent-rose)" }}>Don&apos;t know</span> sends it back to {BOX_NAMES[1]}.
      </div>
    </div>
  );
}

/** One word's path through the boxes, with real intervals. */
function Example() {
  const rows: [string, string][] = [
    ["Day 1", `You see 长 for the first time and know it → ${BOX_NAMES[2]}, back in ${BOX_DAYS[2]} days.`],
    [`Day ${1 + BOX_DAYS[2]}`, `You still know it → ${BOX_NAMES[3]}, back in ${BOX_DAYS[3]} days.`],
    [`Day ${1 + BOX_DAYS[2] + BOX_DAYS[3]}`, `You forgot it → ${BOX_NAMES[1]}, you see it again today.`],
    [`Day ${2 + BOX_DAYS[2] + BOX_DAYS[3]}`, `You know it again → ${BOX_NAMES[2]}, and it moves forward again.`],
  ];
  return (
    <div className="mt-4 rounded-lg p-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}>
      <div className="text-xs uppercase tracking-widest mb-2" style={{ ...muted, fontFamily: "Cormorant Garamond, serif" }}>Example</div>
      <ul className="space-y-1.5 text-xs">
        {rows.map(([day, text]) => (
          <li key={day} className="flex gap-3">
            <span className="shrink-0 w-14" style={{ color: "var(--accent-gold)" }}>{day}</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tool({ href, hanzi, title, sub }: { href: string; hanzi: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}>
      <span className="font-display text-2xl shrink-0 w-8 text-center" style={{ color: "var(--ink)" }}>{hanzi}</span>
      <div className="min-w-0">
        <div className="font-semibold" style={heading}>{title}</div>
        <div className="text-xs" style={muted}>{sub}</div>
      </div>
    </Link>
  );
}

function Key({ k, what }: { k: string; what: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 text-sm" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <span className="badge-gold shrink-0 w-14 text-center">{k}</span>
      <span style={muted}>{what}</span>
    </div>
  );
}
