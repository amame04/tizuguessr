import { useState } from "react"
import { prefectures } from "../crossings";

// 都道府県コード順の一覧を地方別に区切る（三重県は近畿）。
const regions = [
  { name: '北海道', prefectures: prefectures.slice(0, 1) },
  { name: '東北', prefectures: prefectures.slice(1, 7) },
  { name: '関東', prefectures: prefectures.slice(7, 14) },
  { name: '中部', prefectures: prefectures.slice(14, 23) },
  { name: '近畿', prefectures: prefectures.slice(23, 30) },
  { name: '中国', prefectures: prefectures.slice(30, 35) },
  { name: '四国', prefectures: prefectures.slice(35, 39) },
  { name: '九州・沖縄', prefectures: prefectures.slice(39, 47) },
];

interface AnswerProps {
  answerButton: (selected: string) => void;
  disabled: boolean;
  onNext: () => void;
}

export function Answer({ answerButton, disabled, onNext } : AnswerProps) {
  const [selected, setSelected] = useState('');

  return <div className="answer">
    <select aria-label="都道府県" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={disabled}>
        <option value="">未選択</option>

        {regions.map(region => (
          <optgroup key={region.name} label={region.name}>
            {region.prefectures.map(prefecture => (
              <option key={prefecture} value={prefecture}>{prefecture}</option>
            ))}
          </optgroup>
        ))}
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
