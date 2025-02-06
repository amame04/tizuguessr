import { useEffect, useState } from 'react';
import './App.css'
import { getPref, getRandomCrossing, reverseGeo, toFormatedName } from './osm';
import { Map } from './components/map';
import { Answer, ReloadButton } from './components/answer';

function App() {
  const placeObj = {
    lat: 0,
    lng: 0,
    name: '',
    formatedName: '',
    pref: '',
    isCorrect: false,
    isAnswered: false
  }

  const [place, setPlace] = useState(placeObj)
  const [error, setError] = useState(false)

  useEffect(() => {
    let ignore = false;

      getRandomCrossing(setError).then(latlng => {
        const lat = parseFloat(latlng.elements[0].lat)
        const lon = parseFloat(latlng.elements[0].lon)
        reverseGeo(lat, lon, setError).then(name => {
          if (!ignore) {
            setPlace({
              lat: lat,
              lng: lon,
              name: name.display_name,
              formatedName: toFormatedName(name.display_name),
              pref: getPref(name.display_name),
              isCorrect: false,
              isAnswered: false
            });
          }
        })
      });

    return () => {
      ignore = true;
    };
  },[]);

  function answerButton(selected: string) {
    if (selected == '') {
      return;
    }

    setPlace({
      ...place,
      isAnswered: true,
      isCorrect: place.pref != '不明' && place.pref == selected
    });
  }

  if (place.lat == 0 && place.lng == 0 && place.name == '') {
    return (
      <div className="App">
        <h1 id='logo'>地図げっさー</h1>
        <div className='loader'></div>
        <div className={error ? '' : 'none'}>
          <p>エラーが発生しました。</p>
          <ReloadButton />
        </div>
      </div>
    );
  } else if (place.isAnswered) {
    return (
      <div className="App">
        <h1 id='logo'>地図げっさー</h1>
        <div className={place.isCorrect ? 'result correct' : 'result'}>
          {place.isCorrect ? '★ 正解 ★' : '♡不正解♡'}
        </div>
        <div className='detail'>{place.formatedName}</div>
        <Map lat={place.lat} lng={place.lng} isAnswered={place.isAnswered}/>
        <Answer answerButton={answerButton} disabled={true} />
      </div>
    );
  } else {
    return (
      <div className="App">
        <h1 id='logo'>地図げっさー</h1>
        <Map lat={place.lat} lng={place.lng} isAnswered={place.isAnswered}/>
        <Answer answerButton={answerButton} disabled={false} />
      </div>
    )
  }
}

export default App;
