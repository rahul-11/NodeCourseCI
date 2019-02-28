jest.setTimeout(10000);     // How long Jest will wait to fail a test if no response 
require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {useMongoClient : true});
