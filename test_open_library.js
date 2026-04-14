const axios = require('axios');
async function test() {
  const q = 'harry potter';
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8`;
  try {
    const { data } = await axios.get(url);
    console.log(data.docs[0]);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
