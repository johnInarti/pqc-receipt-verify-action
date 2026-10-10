import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {ROOT,workspace,runAction} from './support/runner.mjs';
const receipt=JSON.parse(fs.readFileSync(ROOT+'/test/vectors/genuine-fe62b072.json'));
const directory=JSON.parse(fs.readFileSync(ROOT+'/test/vectors/key-directory-epoch3.json'));
test('spec at original URL relocates to fixed same-origin legacy path, with original pins', async()=>{
 const seen=[]; const server=http.createServer((req,res)=>{seen.push(req.url);res.setHeader('content-type','application/json');res.end(JSON.stringify(req.url==='/.well-known/fractalai-key-directory'?directory:{spec:'x402-receipt-key-directory/1',url:'https://attacker.invalid/keys'}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const result=await runAction(workspace({'receipt.json':receipt}),{receipt:'receipt.json','key-directory':`http://127.0.0.1:${server.address().port}/.well-known/x402-receipt-keys`});assert.equal(result.code,0,result.log);assert.equal(result.out.valid,'true');assert.equal(result.out['trust-basis'],'pinned-root');assert.deepEqual(seen,['/.well-known/x402-receipt-keys','/.well-known/fractalai-key-directory']);}
 finally{server.closeAllConnections();server.close();}
});
test('wrong legacy format is rejected, never treated as a pinned epoch',async()=>{
 const server=http.createServer((req,res)=>res.end(JSON.stringify({spec:'x402-receipt-key-directory/1'})));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const result=await runAction(workspace({'receipt.json':receipt}),{receipt:'receipt.json','key-directory':`http://127.0.0.1:${server.address().port}/.well-known/x402-receipt-keys`});assert.equal(result.out.valid,'false');assert.equal(result.code,1);}
 finally{server.closeAllConnections();server.close();}
});
