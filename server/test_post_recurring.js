import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

dotenv.config({ path: './.env' });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('No JWT_SECRET in env');
  process.exit(1);
}

const token = jwt.sign({ sub: String(1) }, jwtSecret, { expiresIn: '1h' });

const payload = {
  title: 'Test recurring',
  amount: 12.5,
  category: 'utilities',
  frequency: 'monthly',
  intervalValue: 1,
  startDate: new Date().toISOString().split('T')[0],
  endType: 'forever',
};

async function main() {
  const res = await fetch('http://127.0.0.1:5000/api/recurring-expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
