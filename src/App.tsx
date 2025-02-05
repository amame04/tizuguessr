import { useEffect, useState } from 'react';
import './App.css'
import { getPref, getRandomCrossing, reverseGeo, toFormatedName } from './osm';
import { Map } from './components/map';
import { Answer } from './components/answer';

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

  useEffect(() => {
    let ignore = false;

      getRandomCrossing().then(latlng => {
        const lat = parseFloat(latlng.elements[0].lat)
        const lon = parseFloat(latlng.elements[0].lon)
        reverseGeo(lat, lon).then(name => {
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
        <div>loading...</div>
      </div>
    );
  } else if (place.isAnswered) {
    return (
      <div className="App">
        <h1 id='logo'>地図げっさー</h1>
        <div>{place.isCorrect ? '正解！' : '不正解！'}</div>
        <div>{place.formatedName}</div>
        <Map lat={place.lat} lng={place.lng} isAnswered={place.isAnswered}/>
        <Answer answerButton={answerButton} disabled={true} />
        <button onClick={() => {location.reload()}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
          </svg>
        </button>
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
