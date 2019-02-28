const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user)=>{
  const sessionObject = {
    passport :{
      user : user._id.toString()   // the ._id is an object so we need to get string of the id
    }
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
  const sig = keygrip.sign('session='+session);

  return {session, sig};
}
