require('dotenv').config()
const express = require("express");
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());

// connect with mongodb


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3rgm8.mongodb.net/nodeBasicDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const blogCollection = client.db("BlogApplication").collection("geraldBlog");
        // get all the data 
        app.get('/blogs', async (req, res) => {
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
        app.put('/blog/:id',async (req,res)=>{
            const id = req.params.id
            const updatedArticle = req.body;
            const filter = { _id: ObjectId(id) };
            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: true };

            const updateArticle = {
                $set: updatedArticle
              };
            const result = await blogCollection.updateOne(filter,updateArticle,options)
            res.send(result);
        })
        // delete article
        app.delete('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await blogCollection.deleteOne(query)
            res.send({result,query})
        })





    } finally {

    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running server...')
})

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
})

