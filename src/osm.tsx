export async function getRandomCrossing(setError: Function) {
  const text = await fetch('./data/crossing.txt')
    .then((response) => {
      return response.text();
    })
    .catch((e) => {
      console.log(e);
      setError(true);
      return '';
    });

  const crossings = text.split('\n');

  const random = Math.floor(Math.random() * crossings.length - 1);

  const query = `
    node(${crossings[random]});
    out;
  `
  return await sendQuery(query, setError);
}

async function sendQuery(query: string, setError: Function) {
  const overpass = 'https://overpass-api.de/api/interpreter';
  const url = overpass + '?data=[out:json][timeout:30];' + query;

  const data = await fetch(url)
    .then((response) => {
      return response.json();
    })
    .catch((e) => {
      console.log(e);
      setError(true);
    });
  
  return data;
}

export async function reverseGeo(lat: number, lng: number, setError: Function) {
  const nominatim = 'https://nominatim.openstreetmap.org/reverse'
  const url = nominatim + '?format=json&lat=' + lat + '&lon=' + lng

  const data = await fetch(url)
    .then((response) => {
      return response.json();
    })
    .catch((e) => {
      console.log(e);
      setError(true);
    });

  return data;
}

export function getPref(name: string) {
  const splitedName = String(name).split(", ");
  let pref = '不明';

  if (splitedName.length >= 3) {
    pref = splitedName[splitedName.length - 3];
  }

  return pref;
}

export function toFormatedName(name: string) {
  const splitedName = String(name).split(", ");
  let formatedName = '';

  if (splitedName.length >= 3) {
    for (let i = splitedName.length - 3; i >= 0; i--) {
      formatedName += splitedName[i];
    }
  } else {
    for (let i = splitedName.length - 1; i >= 0; i--) {
      formatedName += splitedName[i];
    }
  }

  return formatedName;
}
