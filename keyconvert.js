const fs = require('fs');
const key = fs.readFileSync('./ticketbari-projects-firebase-adminsdk-fbsvc-1d8b29239b.json', 'utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)