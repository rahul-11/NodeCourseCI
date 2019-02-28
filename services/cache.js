const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function(options = {}){
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}


mongoose.Query.prototype.exec = async function(){
  if(!this.useCache){
    return exec.apply(this,arguments);
  }

  const key = JSON.stringify(
    Object.assign({},this.getQuery(), {
      collection : this.mongooseCollection.name
    })
  );

  // See if we have the value key in cache already
  const cacheValue = await client.hget(this.hashKey, key);

  // If Yes, then return that
  if(cacheValue){
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
    ? doc.map( d => new this.model(d))
    : new this.model(doc)
  }

  //If no, Issue the query to Mongo and save it to cache and return value
  const result = await exec.apply(this,arguments);
  client.hset(this.hashKey, key, JSON.stringify(result));

  return exec.apply(this,arguments);
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stingify(hashKey));
  }
}
