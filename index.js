const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_U}:${process.env.DB_P}@cluster0.jqukbua.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
    if (error) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decode = decode;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("carDoctoDB").collection("services");
    const bookingCollection = client.db("carDoctoDB").collection("bookings");

    // jwt
    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token })
    })

    // services

    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, service_id: 1, price: 1, img: 1, description: 1, },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result)
    })

    // booking url

    app.post('/bookings', async (req, res) => {
      const booking = req.body
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
    })

    app.get('/bookings', verifyJWT, async (req, res) => {
      const decode = req.decode
      console.log(decode);

      if (decode.email !== req.query.email) {
        return res.status(403).send({ error: 1, message: 'forbidden access' })
      }
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/bookings', async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })

    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) };
      const updateBookings = req.body
      const updateDoc = {
        $set: {
          plot: updateBookings.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)

    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query)
      res.send(result)

    })


    // app.get('', async(req, res)=>{

    // })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('doctor is running')
})
app.listen(port, () => {
  console.log('car doctor is dourer opore');
})