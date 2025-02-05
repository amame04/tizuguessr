import { useEffect, useState } from 'react';
import './App.css'
import { getRandomCrossing } from './Overpass';
import { Map } from "./components/Map";

function App() {
  const [data, setData] = useState([null, null])

  useEffect(() => {
    getRandomCrossing().then(data => {
      const lat = data.elements[0].lat
      const lon = data.elements[0].lon
      setData([lat, lon]);
    });
  },[]);

  if (data[0] == null) {
    return (
      <div className="App">
        loading...
      </div>
    );
  } else {
    return (
      <div className="App">
        <Map lat={data[0]} lng={data[1]}/>
      </div>
    );
  }
}

export default App;
