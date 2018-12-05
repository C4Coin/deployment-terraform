const Web3 = require('web3')
const web3 = new Web3(Web3.givenProvider || 'http://34623e56-c488-4287-b25f-f8eeb2b75c3b.cloudapp.net:80')
const Tx = require('ethereumjs-tx')
const fs = require('fs');

// Addrs
tokenAddr = '0xc9c76954b55c7c6cb4c8f2128d3c217722b9d81f'
bsbAddr = '0xb46ca35ba31528c24e680c44ee1eeb3e00c11bb5'
qdAddr  = '0x71d646e45e69e00cbef1a7daf0859802c6acec7d'

// ABIs
const qdAbi  = JSON.parse( fs.readFileSync('../build/contracts/QueueDelegate.json') ).abi
const tknAbi = JSON.parse( fs.readFileSync('../build/contracts/BurnableERC20.json') ).abi
// Contracts
const token = new web3.eth.Contract(tknAbi, tokenAddr)
const qd    = new web3.eth.Contract(qdAbi, qdAddr);


(async () => {
   const password = fs.readFileSync('./pw.txt')
   const acct = getDecryptedAccount('./moc.key', password)

   // Check account balance
   //console.log( await web3.eth.getBalance(acct.address) )

   // Mint
   const data = token.methods.mint(acct.address, '100').encodeABI()
   console.log( await sendRawTx(acct, tokenAddr, 0, 100000, 1000000000, data) )
   console.log('Minting complete...')

   // Approve
   const data2 = await token.methods.approve(bsbAddr, 100).encodeABI()
   console.log( await sendRawTx(acct, tokenAddr, 0, 100000, 1000000000, data2) )
   console.log('Approve complete...')

   // Join stakers
   const data3 = await qd.methods.join(100, web3.utils.fromAscii('test')).encodeABI()
   console.log( await sendRawTx(acct, qdAddr, 0, 6700000, 1000000000, data3) )
   console.log('Join complete!')
})();

function getDecryptedAccount(path, password) {
   //logger.debug("getDecryptedAccount(), path: " + path);
   const key = JSON.parse( fs.readFileSync(path) )
   const decryptedAccount = web3.eth.accounts.decrypt(key, password);
   //logger.info('decryptedAccount.address: ' + decryptedAccount.address);
   return decryptedAccount;
}

async function sendRawTx(decryptedAccount, to, value, gas, gasPrice, data) {
    const privateKeyHex = Buffer.from(decryptedAccount.privateKey.replace('0x', ''), 'hex');
    const nonce = await web3.eth.getTransactionCount(decryptedAccount.address);
    let rawTransaction = {
        "from": decryptedAccount.address,
        "to": to,
        "value": web3.utils.toHex(value),
        "gas": web3.utils.toHex(gas),
        "gasPrice": web3.utils.toHex(gasPrice),
        "nonce": nonce,
        "data": data
    };
    console.log("rawTransaction: " + JSON.stringify(rawTransaction));
    let tx = new Tx(rawTransaction);
    tx.sign(privateKeyHex);
    let serializedTx = '0x' + tx.serialize().toString('hex');
    return web3.eth.sendSignedTransaction(serializedTx);
}
