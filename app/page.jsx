"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AFFILIATE_LINKS } from "../lib/affiliates";

const STORAGE_KEY = "kanpe-cards-v1";
const FONT_KEY = "kanpe-font";
const HINT_KEY = "kanpe-hint-dismissed";

const CARD_COLORS = ["#6366f1", "#34d399", "#fbbf24", "#f472b6", "#38bdf8"];

const DEFAULT_CARDS = [
  { title: "自己紹介（1分）", body: "・名前、現職/現状\n・これまでの経験の要約\n・今日伝えたいこと一言" },
  { title: "志望動機", body: "・なぜこの会社か\n・なぜこの職種か\n・入社後にやりたいこと" },
  { title: "強み・弱み", body: "強み：〇〇（具体エピソード）\n弱み：〇〇（改善のためにしていること）" },
  { title: "逆質問", body: "・入社後最初の3ヶ月で期待される役割は？\n・チームの雰囲気や働き方について\n・活躍している人の共通点は？" },
];

function withColors(cards) {
  return cards.map((c, i) => ({
    ...c,
    color: c.color || CARD_COLORS[i % CARD_COLORS.length],
  }));
}

export default function Home() {
  const [cards, setCards] = useState(null); // null = 読み込み前
  const [hintVisible, setHintVisible] = useState(true);
  const [pipOpen, setPipOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });

  const pipRef = useRef(null);
  const pipRenderRef = useRef(null);
  const cardsRef = useRef([]);
  const toastTimer = useRef(null);

  // ---------- 読み込み ----------
  useEffect(() => {
    let loaded = DEFAULT_CARDS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) loaded = parsed;
      }
    } catch (e) {}
    setCards(withColors(loaded));
    setHintVisible(localStorage.getItem(HINT_KEY) !== "1");
  }, []);

  // ---------- 保存 & PiP同期 ----------
  useEffect(() => {
    if (!cards) return;
    cardsRef.current = cards;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    if (pipRenderRef.current) pipRenderRef.current();
  }, [cards]);

  const showToast = useCallback((msg, duration = 1200) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), duration);
  }, []);

  const update = (i, patch) => {
    setCards(cs => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    showToast("保存しました ✓");
  };

  const move = (i, dir) => {
    setCards(cs => {
      const next = [...cs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return cs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    showToast("保存しました ✓");
  };

  const remove = (i) => {
    const name = cards[i].title || "無題";
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setCards(cs => cs.filter((_, j) => j !== i));
    showToast("削除しました");
  };

  const addCard = () => {
    setCards(cs => [
      ...cs,
      { title: "", body: "", color: CARD_COLORS[cs.length % CARD_COLORS.length] },
    ]);
    showToast("カードを追加しました");
  };

  const cycleColor = (i) => {
    const cur = CARD_COLORS.indexOf(cards[i].color);
    update(i, { color: CARD_COLORS[(cur + 1) % CARD_COLORS.length] });
  };

  const dismissHint = () => {
    setHintVisible(false);
    localStorage.setItem(HINT_KEY, "1");
  };

  // ---------- PiP（最前面小窓） ----------
  const togglePip = async () => {
    if (pipRef.current && !pipRef.current.closed) {
      pipRef.current.close();
      pipRef.current = null;
      pipRenderRef.current = null;
      setPipOpen(false);
      return;
    }

    if ("documentPictureInPicture" in window) {
      try {
        const win = await window.documentPictureInPicture.requestWindow({ width: 360, height: 520 });
        pipRef.current = win;
        buildPip(win);
        win.addEventListener("pagehide", () => {
          pipRef.current = null;
          pipRenderRef.current = null;
          setPipOpen(false);
        });
        setPipOpen(true);
      } catch (e) {
        console.error("PiP失敗:", e);
        showToast("最前面小窓を開けませんでした。Chrome / Edge の通常ウィンドウで開いてください。", 4000);
      }
    } else {
      const win = window.open("", "kanpe", "width=360,height=520,resizable=yes");
      if (win) {
        pipRef.current = win;
        buildPip(win);
        setPipOpen(true);
      }
      showToast("このブラウザは最前面固定に未対応です。Chrome / Edge をおすすめします。", 4000);
    }
  };

  const buildPip = (win) => {
    const doc = win.document;
    doc.head.innerHTML = `<meta charset="UTF-8"><title>カンペ</title>`;
    const style = doc.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #0b0d13;
        color: #e8eaf2;
        font-family: "Noto Sans JP", "Segoe UI", "Hiragino Sans", "Yu Gothic UI", sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .bar {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 8px;
        overflow-x: auto;
        flex-shrink: 0;
        background: #12141d;
        border-bottom: 1px solid #262b3d;
        scrollbar-width: thin;
      }
      .chip {
        flex-shrink: 0;
        background: #1d2130;
        color: #cdd3e8;
        border: none;
        border-left: 3px solid var(--c, #6366f1);
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
      }
      .chip:hover { background: #262b3d; }
      .fontbtn {
        flex-shrink: 0;
        background: #171a26;
        color: #8a90a5;
        border: 1px solid #2c3550;
        border-radius: 6px;
        width: 26px;
        height: 26px;
        font-size: 13px;
        cursor: pointer;
        padding: 0;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 12px 14px 40px;
        scrollbar-width: thin;
      }
      h2 {
        font-size: 0.85em;
        color: var(--c, #6366f1);
        margin: 18px 0 6px;
        border-bottom: 1px solid #262b3d;
        padding-bottom: 4px;
      }
      h2:first-child { margin-top: 0; }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        font-size: 1em;
        line-height: 1.85;
        margin: 0;
      }
    `;
    doc.head.append(style);

    doc.body.innerHTML = `
      <div class="bar">
        <button class="fontbtn" id="fMinus">−</button>
        <button class="fontbtn" id="fPlus">＋</button>
      </div>
      <div class="content" id="content"></div>
    `;

    let fontSize = parseInt(localStorage.getItem(FONT_KEY) || "15", 10);
    const content = doc.getElementById("content");
    const bar = doc.querySelector(".bar");

    const applyFont = () => {
      content.style.fontSize = fontSize + "px";
      localStorage.setItem(FONT_KEY, String(fontSize));
    };
    doc.getElementById("fMinus").onclick = () => { fontSize = Math.max(11, fontSize - 1); applyFont(); };
    doc.getElementById("fPlus").onclick = () => { fontSize = Math.min(28, fontSize + 1); applyFont(); };

    const renderPip = () => {
      const list = cardsRef.current;
      content.innerHTML = "";
      list.forEach((card, i) => {
        const h = doc.createElement("h2");
        h.id = "sec-" + i;
        h.textContent = card.title || "無題";
        h.style.setProperty("--c", card.color);
        const p = doc.createElement("pre");
        p.textContent = card.body;
        content.append(h, p);
      });
      bar.querySelectorAll(".chip").forEach(c => c.remove());
      list.forEach((card, i) => {
        const chip = doc.createElement("button");
        chip.className = "chip";
        chip.textContent = card.title || "無題";
        chip.style.setProperty("--c", card.color);
        chip.onclick = () => doc.getElementById("sec-" + i).scrollIntoView({ behavior: "smooth" });
        bar.append(chip);
      });
    };

    pipRenderRef.current = renderPip;
    applyFont();
    renderPip();
  };

  // textarea の高さを内容に合わせる
  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  if (!cards) return null;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark">🎤</div>
            <div className="logo-text">
              <h1>面接カンペ</h1>
              <p>オンライン面接のカンペを最前面に</p>
            </div>
          </div>
          <button className="btn" onClick={addCard}>＋ カード追加</button>
          <button
            className={`btn btn-primary${pipOpen ? " is-open" : ""}`}
            onClick={togglePip}
          >
            {pipOpen ? "✕ 小窓を閉じる" : "📌 カンペを最前面に表示"}
          </button>
        </div>
      </header>

      <main className="main">
        {hintVisible && (
          <div className="hint">
            <button className="hint-close" onClick={dismissHint} title="閉じる">✕</button>
            <b>使い方：</b>カードにカンペを書いて「📌 カンペを最前面に表示」を押すと、小窓がZoomより手前に常に浮かびます（Chrome / Edge対応）。内容は自動保存されます。
            <br />
            <b>⚠ 画面共有の注意：</b>Zoomで共有するときは「画面全体」ではなく<b>特定のウィンドウだけ</b>を共有すれば、カンペは相手に見えません。小窓はカメラの近くに置くと目線のブレが少なくなります。
          </div>
        )}

        {cards.map((card, i) => (
          <div className="card" key={i} style={{ "--card-color": card.color }}>
            <div className="card-head">
              <button
                className="color-dot"
                onClick={() => cycleColor(i)}
                title="色を変更"
                style={{ "--card-color": card.color }}
              />
              <input
                className="card-title"
                value={card.title}
                placeholder="タイトル"
                onChange={(e) => update(i, { title: e.target.value })}
              />
              <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="上へ">↑</button>
              <button className="icon-btn" disabled={i === cards.length - 1} onClick={() => move(i, 1)} title="下へ">↓</button>
              <button className="icon-btn danger" onClick={() => remove(i)} title="削除">✕</button>
            </div>
            <textarea
              className="card-body"
              value={card.body}
              placeholder="カンペの内容…"
              onChange={(e) => { update(i, { body: e.target.value }); autoResize(e.target); }}
              ref={(el) => { if (el) autoResize(el); }}
            />
          </div>
        ))}

        <button className="add-card" onClick={addCard}>＋ カードを追加</button>

        {AFFILIATE_LINKS.length > 0 && (
          <div className="services">
            <h2>💼 面接対策に役立つサービス</h2>
            <p className="note">
              ※ 以下は紹介リンク（アフィリエイト）を含みます。リンク経由で登録されると運営者に報酬が入り、アプリの無料公開の支えになります。
            </p>
            <div>
              {AFFILIATE_LINKS.map((s, i) => (
                <a
                  key={i}
                  className="service-link"
                  href={s.url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                >
                  <div className="name">{s.name} →</div>
                  <div className="desc">{s.desc}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        カンペの内容はお使いのブラウザ内（localStorage）にのみ保存され、サーバーには送信されません。
        <br />
        <a href="/privacy">プライバシーポリシー</a>
      </footer>

      <div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
    </>
  );
}
