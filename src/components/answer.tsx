import { useState } from "react"
import { prefectures } from "../osm";

export function Answer({ answerButton, disabled } : any) {
  const [selected, setSelected] = useState('');

  return <div className="answer">
    <select value={selected} onChange={(e:any) => setSelected(e.target.value)} disabled={disabled}>
        <option value="">未選択</option>

        {prefectures.map((prefecture, _) => {
          return <option key={prefecture} value={prefecture}>{prefecture}</option>;
        })}
      </select>
      <button onClick={() => {answerButton(selected)}} disabled={disabled}>回答</button>
      <ReloadButton />
    </div>
}

export function ReloadButton() {
  return (
    <button className="reloadButton" onClick={() => {location.reload()}}>
      <svg xmlns="http://www.w3.org/2000/svg" style={{width: '1rem', height: '1rem', verticalAlign: '-1px'}} fill="currentColor" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
      </svg>
    </button>
  );
}
