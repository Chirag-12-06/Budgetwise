import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://127.0.0.1:5000/api/debug-routes');
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
