// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

const BUTTONS = [
  "C", "(", ")", "⌫",
  "7", "8", "9", "/",
  "4", "5", "6", "*",
  "1", "2", "3", "-",
  "0", ".", "=", "+"
];

export default function App() {
  const [expr, setExpr] = useState("");      // current expression string
  const [result, setResult] = useState("");  // last evaluated result or error
  const displayRef = useRef(null);

  // Focus handling for keyboard input
  useEffect(() => {
    const onKey = (e) => {
      handleKeyInput(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expr]);

  function appendChar(ch) {
    // Basic guard: don't allow two operators in a row except minus for negative numbers
    const ops = "+-*/";
    const last = expr.slice(-1);
    if (ops.includes(last) && ops.includes(ch)) {
      // allow a minus after an operator only if building negative number (e.g. 5 * -3)
      if (!(ch === "-" && last !== "-")) return;
    }
    setExpr((s) => s + ch);
  }

  function clearAll() {
    setExpr("");
    setResult("");
  }

  function deleteLast() {
    setExpr((s) => s.slice(0, -1));
  }

  function safeEvaluate(s) {
    // Trim whitespace
    const trimmed = s.trim();
    if (trimmed === "") return "";
    // Validate allowed characters only
    // allowed: digits, +-*/(). whitespace and decimal point
    const allowed = /^[0-9+\-*/().\s]+$/;
    if (!allowed.test(trimmed)) {
      throw new Error("Invalid characters in expression.");
    }
    // Simple further checks: balanced parentheses
    let depth = 0;
    for (let ch of trimmed) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth < 0) throw new Error("Mismatched parentheses.");
    }
    if (depth !== 0) throw new Error("Mismatched parentheses.");

    // Evaluate safely using Function (not eval)
    // This will still evaluate JS; previous regex forbids letters so risk is limited.
    // For safety-critical apps use a math parser library instead.
    // Use parentheses and arithmetic only.
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${trimmed});`);
    const value = fn();
    if (!isFinite(value)) throw new Error("Result is not finite.");
    return value;
  }

  function handleEquals() {
    try {
      const val = safeEvaluate(expr);
      setResult(String(val));
      setExpr(String(val));
    } catch (err) {
      setResult(err.message);
    }
  }

  function handleButton(b) {
    if (b === "C") clearAll();
    else if (b === "⌫") deleteLast();
    else if (b === "=") handleEquals();
    else appendChar(b);
    // keep focus for keyboard
    displayRef.current?.focus();
  }

  function handleKeyInput(e) {
    const key = e.key;
    if ((key >= "0" && key <= "9") || "+-*/().".includes(key)) {
      e.preventDefault();
      appendChar(key);
    } else if (key === "Enter") {
      e.preventDefault();
      handleEquals();
    } else if (key === "Backspace") {
      e.preventDefault();
      deleteLast();
    } else if (key === "Escape") {
      e.preventDefault();
      clearAll();
    }
  }

  return (
    <div className="calc-root" role="application" aria-label="Calculator">
      <div className="calc-window">
        <div className="display" tabIndex={0} ref={displayRef} aria-live="polite">
          <div className="expr">{expr || "0"}</div>
          <div className="result">{result ? `= ${result}` : ""}</div>
        </div>

        <div className="keypad" role="group" aria-label="Calculator keypad">
          {BUTTONS.map((b) => (
            <button
              key={b}
              className={`key ${b === "=" ? "key-eq" : ""}`}
              onClick={() => handleButton(b)}
              aria-label={`Button ${b}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
