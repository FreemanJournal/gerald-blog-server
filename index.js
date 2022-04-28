require('dotenv').config()
const express = require("express");
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
// const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());

// verify jwt token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access." })
    }
    const token = authHeader.split(" ")[1]
    // verify a token symmetric
    jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY, function (err, decoded) {
      if(err){
        return res.status(403).send({ message: "Forbidden Access." })
      }
      req.decoded = decoded
      next();
    });
   
}

// connect with mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3rgm8.mongodb.net/nodeBasicDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const blogCollection = client.db("BlogApplication").collection("geraldBlog");
        const userCollection = client.db("BlogApplication").collection("userInfo");

        // Blog Collection Api

        // get all the data 
        app.get('/blog', async (req, res) => {
            const cursor = blogCollection.find({});
            const blogs = await cursor.toArray();
            res.send(blogs)
        })
        // get one article
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            // Query for a blog post that has the same id
            const query = { _id: ObjectId(id) };
            const user = await blogCollection.findOne(query)
            res.send(user)
        })
        // post article
        app.post('/blog', async (req, res) => {
            const newArticle = req.body;
            const result = await blogCollection.insertOne(newArticle);
            res.send(result);
        })
        // update article
        app.put('/blog/:id', async (req, res) => {
            const id = req.params.id
            const updatedArticle = req.body;
            const filter = { _id: ObjectId(id) };
            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: true };

            const updateArticle = {
                $set: updatedArticle
            };
            const result = await blogCollection.updateOne(filter, updateArticle, options)
            res.send(result);
        })
        // delete article
        app.delete('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await blogCollection.deleteOne(query)
            res.send({ result, query })
        })

        // User collection api

        app.post("/user", async (req, res) => {
            const userData = req.body
            const result = await userCollection.insertOne(userData);
            res.send(result)
        })
        app.post("/user/update", async (req, res) => {
            const userData = req.body
            userData._id && delete userData._id
            // create a filter for a user to update
            const filter = { email_address: userData.email_address };
            // this option instructs the method to create a user if no user match the filter
            const options = { upsert: true };
            // create a user
            const updateDoc = {
                $set: { ...userData }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)

        })

        let count = 0

        app.get("/user", verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email
            const { email } = req.query
            if(decodedEmail !== email){
                res.status(403).send({ message: "Forbidden Access." });
                return;
            }
            const query = { email_address: email };
            const result = await userCollection.findOne(query);
            res.send(result)
        })

        // auth api
        app.post('/login', (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '1d' })
            res.send({ accessToken })

        })

    } finally {

    }

}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Running server at 5000...')
})

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
})

