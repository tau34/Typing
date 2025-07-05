import { useEffect, useState } from "react";
import words from "./data/words.json";

const K2R: Record<string, string[]> = {
  // 母音
  あ: ["a"], い: ["i"], う: ["u"], え: ["e"], お: ["o"],
  // か行
  か: ["ka"], き: ["ki"], く: ["ku"], け: ["ke"], こ: ["ko"],
  // が行
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  // さ行
  さ: ["sa"], し: ["shi", "si"], す: ["su"], せ: ["se"], そ: ["so"],
  // ざ行
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  // た行
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  // だ行
  だ: ["da"], ぢ: ["ji", "di"], づ: ["zu", "du"], で: ["de"], ど: ["do"],
  // な行
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  // は行
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  // ば行
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  // ぱ行
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  // ま行
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  // や行
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  // ら行
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  // わ行
  わ: ["wa"], を: ["wo", "o"], ん: ["n", "nn"],

  // 拗音
  きゃ: ["kya"], きゅ: ["kyu"], きょ: ["kyo"],
  しゃ: ["sha", "sya"], しゅ: ["shu", "syu"], しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya"], ちゅ: ["chu", "tyu"], ちょ: ["cho", "tyo"],
  にゃ: ["nya"], にゅ: ["nyu"], にょ: ["nyo"],
  ひゃ: ["hya"], ひゅ: ["hyu"], ひょ: ["hyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りゅ: ["ryu"], りょ: ["ryo"],
  ぎゃ: ["gya"], ぎゅ: ["gyu"], ぎょ: ["gyo"],
  じゃ: ["ja", "jya", "zya"], じゅ: ["ju", "jyu", "zyu"], じょ: ["jo", "jyo", "zyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
  ふぁ: ["fa"], ふぃ: ["fi"], ふぇ: ["fe"], ふぉ: ["fo"],
  でゃ: ["dha"], でぃ: ["dhi"], でゅ: ["dhu"], でぇ: ["dhe"], でょ: ["dho"],
  てゃ: ["tha"], てぃ: ["thi"], てゅ: ["thu"], てぇ: ["the"], てょ: ["tho"],

  // 特殊
  っ: [], ー: ["-"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"]
};

type Mode = "30s" | "60s" | "120s" | "30" | "50" | "100";

const kanaToRomajis = (kana: string): string[] => {
  if (kana.length === 0) return [""];
  const out: string[] = [];

  if (kana[0] === "っ") {
    kanaToRomajis(kana.slice(1)).forEach((tail) => {
      if (tail) out.push(tail[0] + tail);
    });
    return [...new Set(out)];
  }

  if (/^[a-zA-Z]+$/.test(kana[0])) {
    kanaToRomajis(kana.slice(1)).forEach((tail) => {
      out.push(kana[0] + tail);
    });
    return [...new Set(out)];
  }

  if (kana[0] === "ん") {
    kanaToRomajis(kana.slice(1)).forEach((tail) => {
      if (tail === "" || tail.startsWith("n")) {
        out.push("nn" + tail);
      } else {
        out.push("n" + tail);
        out.push("nn" + tail);
      }
    });
    return [...new Set(out)];
  }

  const two = kana.slice(0, 2);
  if (K2R[two]) {
    kanaToRomajis(kana.slice(2)).forEach((tail) => {
      K2R[two].forEach((head) => out.push(head + tail));
    });
  }

  const one = kana[0];
  if (K2R[one]) {
    kanaToRomajis(kana.slice(1)).forEach((tail) => {
      K2R[one].forEach((head) => out.push(head + tail));
    });
  }

  return [...new Set(out)];
};

const Typing = () => {
  const [phase, setPhase] = useState<"start" | "countdown" | "typing" | "result">("start");
  const [count, setCount] = useState(3);
  const [mode, setMode] = useState<Mode>("60s");
  const [wordCount, setWordCount] = useState(0);
  const [countTime, setCountTime] = useState(Date.now());
  const [typed, setTyped] = useState(0);

  const [kanaWord, setKanaWord] = useState("");
  const [romaCandidates, setRomaCandidates] = useState<string[]>([]);
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [lastSpeed, setLastSpeed] = useState<number | null>(null);
  const [prevWord, setPrevWord] = useState<string | null>(null);
  const [prevRoma, setPrevRoma] = useState<string | null>(null);

  const pickNewWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setKanaWord(word.display);

    let romajis = kanaToRomajis(word.reading);
    if (word.reading.endsWith("ん")) {
      romajis = romajis
        .map((r) => {
          if (r.endsWith("n") && !r.endsWith("nn")) {
            return r.slice(0, -1) + "nn";
          }
          return r;
        })
        .filter((r) => r.endsWith("nn"));
    }

    setRomaCandidates(romajis);
    setTypedText("");
    setStartTime(Date.now());
  };

  useEffect(() => {
    pickNewWord();
  }, []);

  const handleKey = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const nextTyped = typedText + key;
    const match = romaCandidates.find((r) => r.startsWith(nextTyped));
    if (!match) return;
    if (phase !== "typing") return;

    setTypedText(nextTyped);

    if (romaCandidates.includes(nextTyped)) {
      const time = (Date.now() - startTime) / 1000;
      setLastDuration(time);
      setLastSpeed(nextTyped.length / time);
      setPrevWord(kanaWord);
      setPrevRoma(romaCandidates[0]);
      setWordCount(wordCount + 1);
      setTyped(typed + nextTyped.length);
      switch (mode) {
        case "30":
          if (wordCount >= 30) {
            handleCountLimit();
          }
          break;
        case "50":
          if (wordCount >= 50) {
            handleCountLimit();
          }
          break;
        case "100":
          if (wordCount >= 100) {
            handleCountLimit();
          }
          break;
      }
      pickNewWord();
    }
  };

  const handleTimeLimit = () => {
    setPhase("result");
  }

  const handleCountLimit = () => {
    setPhase("result");
  }

  useEffect(() => {
    const startListener = (e: KeyboardEvent) => {
      if (phase === "start" && e.code === "Space") {
        setPhase("countdown");
        setCount(3);
      }
    };
    window.addEventListener("keydown", startListener);
    return () => window.removeEventListener("keydown", startListener);
  }, [phase]);

  useEffect(() => {
    if (phase === "countdown") {
      if (count > 0) {
        const timer = setTimeout(() => setCount((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => {
          setPhase("typing");
          switch (mode) {
            case "30s":
              setTimeout(() => {
                handleTimeLimit();
              }, 30000);
              break;
            case "60s":
              setTimeout(() => {
                handleTimeLimit();
              }, 60000);
              break;
            case "120s":
              setTimeout(() => {
                handleTimeLimit();
              }, 120000);
              break;
          }
          setCountTime(Date.now());
          pickNewWord();
        }, 1000);
      }
    }
  }, [phase, count]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [typedText, romaCandidates]);

  const renderRomaji = () => {
    if (romaCandidates.length === 0) return null;
    const candidate = romaCandidates.find((r) => r.startsWith(typedText)) || romaCandidates[0];
    const done = typedText.length;
    return (
      <>
        <span className="text-green-600">{candidate.slice(0, done)}</span>
        <span className="text-blue-600">{candidate[done] || ""}</span>
        <span className="text-gray-400">{candidate.slice(done + 1)}</span>
      </>
    );
  };

  const renderResult = () => {
    let modeName = "";
    let isTimeBased = false;
    switch (mode) {
      case "30s":
        modeName = "30秒";
        isTimeBased = true;
        break;
      case "60s":
        modeName = "60秒";
        isTimeBased = true;
        break;
      case "120s":
        modeName = "120秒";
        isTimeBased = true;
        break;
      case "30":
        modeName = "30語";
        break;
      case "50":
        modeName = "50語";
        break;
      case "100":
        modeName = "100語";
        break;
    }
    return (
      <div className="space-y-4">
        <div className="text-2xl">Result</div>
        <p>Mode: {modeName}</p>
        {isTimeBased ? <p>Words: {wordCount}</p> :
          <p>Time: {((Date.now() - countTime) / 1000).toFixed(2)} 秒</p>}
        <p>Speed: {(typed / (Date.now() - countTime) * 1000).toFixed(2)} タイプ/秒</p>
        <button onClick={() => {
          setLastDuration(null);
          setLastSpeed(null);
          setPrevWord(null);
          setPrevRoma(null);
          setPhase("start");
        }}>Retry</button>
      </div>)
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      {phase === "start" && (
        <div className="space-y-4">
          <select
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="30s">30秒</option>
            <option value="60s">60秒</option>
            <option value="120s">120秒</option>
            <option value="30">30語</option>
            <option value="50">50語</option>
            <option value="100">100語</option>
          </select>
          <div className="text-2xl">スペースキーで開始</div>
        </div>
      )}
      {phase === "countdown" && (
        <div className="text-5xl font-bold">
          {count > 0 ? count : "GO!"}
        </div>
      )}
      {phase === "typing" && (
        <>
          <div className="text-4xl mb-4">{kanaWord}</div>
          <div className="text-xl font-mono">{renderRomaji()}</div>
          {lastDuration !== null && lastSpeed !== null &&
            prevWord !== null && prevRoma !== null && (
              <div className="fixed bottom-2 right-4 text-sm text-gray-700 text-right">
                <p>{prevWord}</p>
                <p>{prevRoma}</p>
                <p>Time: {lastDuration.toFixed(2)} 秒</p>
                <p>Speed: {lastSpeed.toFixed(2)} タイプ/秒</p>
              </div>
            )}
        </>
      )}
      {phase === "result" && renderResult()}
    </div>
  );
};

export default Typing;
