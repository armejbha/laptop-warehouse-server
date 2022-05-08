const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(404).send({ massage: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ massage: 'Forbidden access' });
        }
        req.decoded = decoded;
        console.log(decoded);
        next()
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xpxnl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const itemsCollection = client.db('warehouse').collection('items');
        // token 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '20d' });
            res.send({ accessToken });
        })

        // find all data 
        app.get('/items', async (req, res) => {
            const query = {};
            const cursor = itemsCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

        // find single data 
        app.get('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemsCollection.findOne(query);
            res.send(item);
        })

        // myItem 
        app.get('/myitems', verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req?.query?.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = itemsCollection.find(query);
                const myitems = await cursor.toArray();
                console.log(myitems);
                res.send(myitems);
            } else {
                return res.status(403).send({ massage: 'Forbiddens access' })
            }
        })

        // post data from ui 
        app.post('/items', async (req, res) => {
            const newItem = req.body;
            const item = await itemsCollection.insertOne(newItem);
            res.send(item);
        })

        // delete data
        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemsCollection.deleteOne(query);
            res.send(item);
        })

        // update quantity 
        app.put('/items/:id', async (req, res) => {
            const id = req.params.id;
            const add = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: add,
            };
            const result = await itemsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server running');
})

app.listen(port, () => {
    console.log('listening to port', port);
})