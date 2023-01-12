const mongoose = require('mongoose');

class MongooseConnection {
    connect() {
        return new Promise(async (resolve, reject) => {
            try {
                const client = await mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                resolve(client);
            } catch(error) {
                reject(error);
            }
        });
    }
}

module.exports = new MongooseConnection();
