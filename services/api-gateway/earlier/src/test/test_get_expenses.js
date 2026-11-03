import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

dotenv.config({ path: './.env' });
const token = jwt.sign({ sub: String(1) }, process.env.JWT_SECRET, { expiresIn: '1h' });

async function main() {
  const res = await fetch('http://127.0.0.1:5000/api/expenses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
