const axios = require('axios');
async function test() {
  const q = 'harry potter';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8`;
  try {
    const { data } = await axios.get(url);
    console.log(data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
