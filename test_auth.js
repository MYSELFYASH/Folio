const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}
test();
