const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParsar = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId, ReturnDocument } = require('mongodb');
require('dotenv').config();
const app =express();
const port = process.env.PORT || 5000;


//middlewere

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParsar());




console.log(process.env.NAME);
console.log(process.env.PASS);



const logger = async(req,res,next ) =>{
  console.log("called", req.host , req.originalUrl);
  next();
}

const verifyToken = async(req,res, next)=> {

  const token = req.cookies?.token;
  console.log('value of token', token);
  if(!token){
    return res.status(401).send({ message: 'Not Authorizes'})

  }

  jwt.verify(token, process.env.S_Token, (err,decode) =>{
    //error
    if(err){
      console.log(err);
      return res.status(401).send({ message: 'Not Authorizes'})
    }
    //decode
    console.log('value of token:', decode);
    req.user= decode;
    next();
  })
  

}



const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASS}@cluster0.ennn1mj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const serviceCollection = client.db('carDoctor').collection("Services");
const orderCollection = client.db('carDoctor').collection("orders");

//auth api

app.post('/jwt', async(req,res) =>{
  const user = req.body;
  console.log(user);

  const token = jwt.sign(user, process.env.S_Token, {expiresIn: '1h'})
  res
  .cookie('token', token,{
    httpOnly: true,
    secure: false
  
  })
  .send({success: true})
})




//client api
app.get('/services', logger, async(req,res)=>{
    const cursor = serviceCollection.find();
    const result = await cursor.toArray();
    res.send(result);
})


app.get('/services/:id', logger, async(req,res) =>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id)}
    const result = await serviceCollection.findOne(query);
    res.send(result)
})

//bookings

app.post('/orders', async (req,res) =>{
    const order = req.body;
    console.log(order);
    const result = await orderCollection.insertOne(order)
    res.send(result);
})

app.get('/orders', verifyToken, logger, async (req,res) =>{

    let query= {};
  

    if(req.query?.email){
        query = {email: req.query.email}
    }
    console.log("token", req.cookies.token);
    console.log('user in token', req.user);
    if(req.query.email !== req.user.email){
      return res.status(403).send({ message: 'Forbidden access'})
    }



    const result = await orderCollection.find().toArray();
    res.send(result);
})
app.get('/orders/:id', async(req,res) =>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id)}
    const result = await orderCollection.findOne(query);
    res.send(result)
})


app.delete('/orders/:id', async (req,res) =>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id)}

    const result = await orderCollection.deleteOne(query)
    res.send(result);
})

app.patch('/orders/:id', async (req,res) =>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const updateStatus = req.body;
    console.log(updateStatus);

    const updateDoc = {

        $set: {
  
          status: updateStatus.status
  
        },
    }

    const result = await orderCollection.updateOne(filter,updateDoc);
    res.send(result)

})




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('doctor is running')
})
app.listen(port , () => {
    console.log(`car doctor is running on port ${port}`);
})

//get single service


