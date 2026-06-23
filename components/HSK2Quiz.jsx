'use client';

import { useState } from 'react';
import styles from './HSK2Quiz.module.css';
import { LESSONS } from '@/data/quizData';

/**
 * Self-contained HSK 2 reading quiz.
 *
 * Props:
 *   imageBase - public URL path where the lesson images live.
 *               Defaults to "/hsk2/images" (i.e. files under public/hsk2/images/).
 *
 * Usage:
 *   import HSK2Quiz from '@/components/HSK2Quiz';
 *   <HSK2Quiz />
 */
export default function HSK2Quiz({ imageBase = '/hsk2/images' }) {
  const [view, setView] = useState('home'); // 'home' | 'quiz' | 'results'
  const [lesson, setLesson] = useState(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState(null); // letter (fill/picture) or boolean (tf)
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);

  const scrollTop = () =>
    typeof window !== 'undefined' && window.scrollTo({ top: 0 });

  function startLesson(L) {
    setLesson(L);
    setIdx(0);
    setScore(0);
    setAnswered(false);
    setChosen(null);
    setView('quiz');
    scrollTop();
  }

  function pick(value, q) {
    if (answered) return;
    setChosen(value);
    setAnswered(true);
    if (value === q.answer) setScore((s) => s + 1);
  }

  function advance() {
    if (!answered) return;
    if (idx + 1 < lesson.questions.length) {
      setIdx((i) => i + 1);
      setAnswered(false);
      setChosen(null);
      scrollTop();
    } else {
      setView('results');
    }
  }

  function backToMenu() {
    setView('home');
    scrollTop();
  }

  /* ---------------- Home ---------------- */
  if (view === 'home') {
    return (
      <div className={styles.root}>
        <div className={styles.wrap}>
          <Header
            showPinyin={showPinyin}
            showEnglish={showEnglish}
            onTogglePinyin={() => setShowPinyin((v) => !v)}
            onToggleEnglish={() => setShowEnglish((v) => !v)}
          />
          <p className={styles.eyebrow}>Choose a lesson</p>
          <div className={styles.lessons}>
            {LESSONS.map((L) => {
              const has = L.questions.length > 0;
              return (
                <button
                  key={L.id}
                  className={styles.lesson}
                  disabled={!has}
                  onClick={() => has && startLesson(L)}
                >
                  <span className={styles.num}>{L.id}</span>
                  <div className={styles.zh}>{L.zh}</div>
                  <div className={styles.en}>{L.en}</div>
                  <div className={`${styles.meta} ${has ? '' : styles.soon}`}>
                    {has ? `${L.questions.length} questions` : 'Coming soon'}
                  </div>
                </button>
              );
            })}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  const n = lesson.questions.length;
  const q = lesson.questions[idx];

  /* ---------------- Results ---------------- */
  if (view === 'results') {
    const pct = Math.round((score / n) * 100);
    let msg;
    if (pct === 100) msg = 'Perfect score. 太棒了！';
    else if (pct >= 80) msg = 'Strong work — almost there.';
    else if (pct >= 60) msg = 'Solid. A review of the misses will lock it in.';
    else msg = 'Worth another pass — repetition is how this sticks.';
    return (
      <div className={styles.root}>
        <div className={styles.wrap}>
          <div className={styles.card}>
            <div className={styles.results}>
              <div className={styles.scoreseal}>
                <div>
                  <div className={styles.pct}>{pct}%</div>
                  <div className={styles.of}>
                    {score} / {n}
                  </div>
                </div>
              </div>
              <h2>{lesson.zh}</h2>
              <p>{msg}</p>
              <div className={styles.resbtns}>
                <button
                  className={styles.btnOutline}
                  onClick={() => startLesson(lesson)}
                >
                  Try this lesson again
                </button>
                <button
                  className={`${styles.next} ${styles.ready}`}
                  onClick={backToMenu}
                >
                  Choose another lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Quiz ---------------- */
  const progress = (idx / n) * 100;

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <div className={styles.quizhead}>
          <div>
            <button className={styles.back} onClick={backToMenu}>
              ← All lessons
            </button>
            <div style={{ marginTop: 8 }}>
              <span className={styles.qnum}>第 {lesson.id} 课</span>
            </div>
          </div>
          <div className={styles.toolbar}>
            <Toggle on={showPinyin} onClick={() => setShowPinyin((v) => !v)}>
              Pinyin
            </Toggle>
            <Toggle on={showEnglish} onClick={() => setShowEnglish((v) => !v)}>
              English
            </Toggle>
          </div>
        </div>

        <h2 className={styles.qh2}>{lesson.zh}</h2>
        <div className={styles.qen}>{lesson.en}</div>

        <div className={styles.progressbar}>
          <div className={styles.progressfill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progresstext}>
          <span>
            Question {idx + 1} of {n}
          </span>
          <span>Score {score}</span>
        </div>

        <div className={styles.card}>
          <Question
            q={q}
            lesson={lesson}
            imageBase={imageBase}
            showPinyin={showPinyin}
            showEnglish={showEnglish}
            answered={answered}
            chosen={chosen}
            onPick={(v) => pick(v, q)}
          />

          {answered && (
            <div className={styles.explain}>
              <span
                className={`${styles.verdict} ${
                  chosen === q.answer ? styles.ok : styles.no
                }`}
              >
                {chosen === q.answer ? 'Correct.' : 'Not quite.'}
              </span>
              {q.explain}
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={`${styles.next} ${answered ? styles.ready : ''}`}
              onClick={advance}
            >
              {idx + 1 < n ? 'Next question →' : 'See results →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Question (3 types) ---------------- */
function Question({
  q,
  lesson,
  imageBase,
  showPinyin,
  showEnglish,
  answered,
  chosen,
  onPick,
}) {
  // option state helper: returns 'correct' | 'wrong' | '' for an option value
  const stateOf = (value) => {
    if (!answered) return '';
    if (value === q.answer) return 'correct';
    if (value === chosen) return 'wrong';
    return '';
  };

  if (q.type === 'fill') {
    const [before, after] = q.prompt.split('___');
    const correctWord = q.options.find((o) => o.k === q.answer)?.zh;
    return (
      <>
        <div className={styles.qtype}>
          <span className={styles.badge}>词语填空</span> Fill in the blank
        </div>
        {showPinyin && <div className={styles.pinyin}>{q.pinyin}</div>}
        <div className={styles.sentence}>
          {before}
          <span className={`${styles.blank} ${answered ? styles.blankFilled : ''}`}>
            {answered ? correctWord : '？'}
          </span>
          {after}
        </div>
        {showEnglish && <div className={styles.english}>{q.en}</div>}
        <div className={styles.options}>
          {q.options.map((o) => {
            const st = stateOf(o.k);
            return (
              <button
                key={o.k}
                className={`${styles.opt} ${st ? styles[st] : ''}`}
                disabled={answered}
                onClick={() => onPick(o.k)}
              >
                <span className={styles.key}>{o.k}</span>
                <span className={styles.label}>
                  {o.zh}
                  {showPinyin && <span className={styles.lpy}>{o.py}</span>}
                  <span className={styles.len}>{o.en}</span>
                </span>
                <span className={styles.mark}>
                  {st === 'correct' ? '✓' : st === 'wrong' ? '✗' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (q.type === 'picture') {
    const imgs = lesson.images || {};
    return (
      <>
        <div className={styles.qtype}>
          <span className={styles.badge}>看图片</span> Match the picture
        </div>
        {showPinyin && <div className={styles.pinyin}>{q.pinyin}</div>}
        <div className={styles.sentence}>{q.prompt}</div>
        {showEnglish && <div className={styles.english}>{q.en}</div>}
        <div className={styles.picgrid}>
          {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => {
            const st = stateOf(k);
            return (
              <button
                key={k}
                className={`${styles.opt} ${styles.picopt} ${st ? styles[st] : ''}`}
                disabled={answered}
                onClick={() => onPick(k)}
              >
                <span className={styles.plabel}>{k}</span>
                {/* plain <img>: source is a static file under /public */}
                <img src={`${imageBase}/${imgs[k]}`} alt={`Picture ${k}`} loading="lazy" />
                <span className={styles.mark}>
                  {st === 'correct' ? '✓' : st === 'wrong' ? '✗' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // true / false
  const TF = [
    { value: true, key: '✓', label: '对 · True' },
    { value: false, key: '✗', label: '错 · False' },
  ];
  return (
    <>
      <div className={styles.qtype}>
        <span className={styles.badge}>判断对错</span> True or false
      </div>
      {showPinyin && <div className={styles.pinyin}>{q.contextPy}</div>}
      <div className={styles.sentence}>{q.context}</div>
      {showEnglish && <div className={styles.english}>{q.contextEn}</div>}
      <div className={styles.sentence} style={{ marginTop: 16 }}>
        <span className={styles.star}>★</span>
        {q.statement}
      </div>
      {showPinyin && (
        <div className={styles.pinyin} style={{ marginTop: 4 }}>
          {q.statementPy}
        </div>
      )}
      {showEnglish && <div className={styles.english}>{q.statementEn}</div>}
      <div className={styles.tf}>
        {TF.map((t) => {
          const st = stateOf(t.value);
          return (
            <button
              key={String(t.value)}
              className={`${styles.opt} ${st ? styles[st] : ''}`}
              disabled={answered}
              onClick={() => onPick(t.value)}
            >
              <span className={styles.key}>{t.key}</span>
              <span className={styles.label}>{t.label}</span>
              <span className={styles.mark}>
                {st === 'correct' ? '✓' : st === 'wrong' ? '✗' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Small pieces ---------------- */
function Header({ showPinyin, showEnglish, onTogglePinyin, onToggleEnglish }) {
  return (
    <header className={styles.appHeader}>
      <div className={styles.brandrow}>
        <div className={styles.seal}>课</div>
        <div>
          <h1 className={styles.titleH1}>HSK 2 Workbook — Reading Quiz</h1>
          <p className={styles.titleP}>
            <span className={styles.subtitle}>标准教程 2 · 练习册</span> · 15 lessons,
            225 questions
          </p>
        </div>
      </div>
      <div className={styles.toolbar}>
        <Toggle on={showPinyin} onClick={onTogglePinyin}>
          Pinyin
        </Toggle>
        <Toggle on={showEnglish} onClick={onToggleEnglish}>
          English
        </Toggle>
      </div>
    </header>
  );
}

function Toggle({ on, onClick, children }) {
  return (
    <button className={styles.toggle} aria-pressed={on} onClick={onClick}>
      <span className={styles.dot} />
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer className={styles.appFooter}>
      Listening sections are omitted (no audio in the source). The basketball photo
      (option D) is the workbook&apos;s worked example and is never an answer. Answers
      are derived from the text — the workbook ships no official key.
    </footer>
  );
}
