import { useEffect, useState } from 'react';
import './App.css';
import { getRandomCrossing } from './crossings';
import type { Crossing } from './crossings';
import { Map } from './components/map';
import { Answer, NextQuestionButton } from './components/answer';

function App() {
  const [place, setPlace] = useState<Crossing | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [question, setQuestion] = useState(0);

  useEffect(() => {
    let ignore = false;
    getRandomCrossing().then(crossing => {
      if (!ignore) setPlace(crossing);
    }).catch(error => {
      if (!ignore) {
        console.error(error);
        setError(true);
      }
    });
    return () => { ignore = true; };
  }, [question]);

  function nextQuestion() {
    setPlace(null);
    setSelected(null);
    setError(false);
    setQuestion(current => current + 1);
  }

  function answerButton(answer: string) {
    if (answer !== '' && place && selected === null) setSelected(answer);
  }

  if (!place) {
    return (
      <div className="App">
        <h1 id="logo">地図げっさー</h1>
        {error ? (
          <div role="alert">
            <p>問題を読み込めませんでした。</p>
            <NextQuestionButton onClick={nextQuestion} label="再試行" />
          </div>
        ) : <div className="loader" />}
      </div>
    );
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === place.pref;
  return (
    <div className="App">
      <h1 id="logo">地図げっさー</h1>
      {isAnswered && (
        <>
          <div className={isCorrect ? 'result correct' : 'result'}>
            {isCorrect ? '★ 正解 ★' : '♡不正解♡'}
          </div>
          <div className="detail">
            {place.pref}（{place.lat.toFixed(7)}, {place.lng.toFixed(7)}）
          </div>
        </>
      )}
      <Map key={`${question}-${isAnswered}`} lat={place.lat} lng={place.lng} isAnswered={isAnswered} />
      <Answer key={question} answerButton={answerButton} disabled={isAnswered} onNext={nextQuestion} />
    </div>
  );
}

export default App;
