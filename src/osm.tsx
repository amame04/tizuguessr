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
  let pref = null;

  if (splitedName.length >= 3) {
    pref = splitedName[splitedName.length - 3];
    
    if (!prefectures.includes(pref)) {
      pref == null
    }
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

export const prefectures = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県'
];
