export async function getRandomCrossing() {
  const response = await fetch('./data/crossing.txt');
  const text = await response.text();
  const crossings = text.split('\n');

  const random = Math.floor(Math.random() * crossings.length - 1);

  const query = `
    node(${crossings[random]});
    out;
  `
  return await sendQuery(query);
}

async function sendQuery(query: string) {
  const overpass = 'https://overpass-api.de/api/interpreter';
  const url = overpass + '?data=[out:json][timeout:30];' + query;

  const data = await fetch(url)
    .then((response) => {
        return response.json()
    })
    .catch((e) => {
        console.log(e)
    });
  
  return data;
}
