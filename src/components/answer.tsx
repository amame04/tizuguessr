import { useState } from "react"
import { prefectures } from "../crossings";

interface AnswerProps {
  answerButton: (selected: string) => void;
  disabled: boolean;
  onNext: () => void;
}

export function Answer({ answerButton, disabled, onNext } : AnswerProps) {
  const [selected, setSelected] = useState('');

  return <div className="answer">
    <select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={disabled}>
        <option value="">未選択</option>

        {prefectures.map((prefecture) => {
          return <option key={prefecture} value={prefecture}>{prefecture}</option>;
        })}
      </select>
      <button onClick={() => {answerButton(selected)}} disabled={disabled}>回答</button>
      <NextQuestionButton onClick={onNext} label={disabled ? '次の問題' : '別の問題'} />
    </div>
}

export function NextQuestionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="nextQuestionButton" onClick={onClick}>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style={{width: '1rem', height: '1rem', verticalAlign: '-1px', marginRight: '0.4rem'}} fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
      </svg>
      {label}
    </button>
  );
}
