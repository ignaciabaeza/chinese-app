import HubPage from "@/components/HubPage";

export const metadata = { title: "Library · 汉语学习" };

export default function LibraryPage() {
  return (
    <HubPage
      title="Library"
      subtitle="Look things up and read at your own pace"
      items={[
        { href: "/vocab",   hanzi: "词", title: "Dictionary", sub: "Every HSK word with meanings, examples, audio and stroke order" },
        { href: "/reader",  hanzi: "读", title: "Reader",     sub: "Tap-to-read lesson texts or paste your own" },
        { href: "/grammar", hanzi: "法", title: "Grammar",    sub: "Grammar points by level, with sentence-building drills" },
      ]}
    />
  );
}
