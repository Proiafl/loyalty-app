const https = require('https');
const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = 'sbp_cb832bab7fa3ded82f33e0fdbd8d97155a95a215';
const PROJECT_REF = 'qcrdbhbxcyqeyxwwhaiv';

function deployFunction(slug, codePath, verifyJwt) {
  return new Promise((resolve, reject) => {
    const code = fs.readFileSync(codePath, 'utf8');
    const boundary = 'FormBoundary' + Date.now();

    const metaPart = [
      '--' + boundary,
      'Content-Disposition: form-data; name="metadata"',
      'Content-Type: application/json',
      '',
      JSON.stringify({ entrypoint_path: 'index.ts', verify_jwt: verifyJwt }),
    ].join('\r\n');

    const filePart = [
      '--' + boundary,
      'Content-Disposition: form-data; name="file"; filename="index.ts"',
      'Content-Type: application/typescript',
      '',
      code,
    ].join('\r\n');

    const body = metaPart + '\r\n' + filePart + '\r\n--' + boundary + '--\r\n';
    const buf = Buffer.from(body, 'utf8');

    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + PROJECT_REF + '/functions/' + slug,
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': buf.length,
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => {
        console.log('[' + slug + '] HTTP ' + res.statusCode);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('[' + slug + '] ✅ Deployed successfully to ' + PROJECT_REF);
        } else {
          console.log('[' + slug + '] ❌ Error:', data.substring(0, 300));
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error('[' + slug + '] Request error:', e.message);
      reject(e);
    });

    req.write(buf);
    req.end();
  });
}

async function main() {
  console.log('Deploying Edge Functions to project: ' + PROJECT_REF);
  await deployFunction(
    'mp-checkout',
    path.join(__dirname, '../supabase/functions/mp-checkout/index.ts'),
    true
  );
  await deployFunction(
    'mp-webhook',
    path.join(__dirname, '../supabase/functions/mp-webhook/index.ts'),
    false
  );
  console.log('Done.');
}

main().catch(console.error);
