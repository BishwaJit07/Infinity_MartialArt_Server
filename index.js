const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

// const verifyJwt =(req,res, next)=>{
//     const authorization = req.headers.authorization;
//     if(!authorization){
//       return res.status(401).send({error: true, message: 'unauthorized access'});
//     }
//  //jwt token
//  const token = authorization.split(' ')[1];

//  jwt.verify(token, process.env.JwtAccess_Token,(err,decoded)=>{
//    if(err){
//      return res.status(401).send({error: true, message: 'unauthorized access'})
//    }
//    req.decoded = decoded;
//    next();
//  })
// }

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.gq6gqcm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db('InfinityMarttialArts').collection('users');


    // app.post('/jwt', (req,res)=>{
    //     const user = req.body;
    //     const token = jwt.sign(user, process.env.JwtAccess_Token,{ expiresIn: '1h' })
    //     res.send({token})
    //   })



    //  users realated api is here
    
    app.post('/users', async(req,res)=>{
        const user = req.body;
        const query = {email: user.email};
        const excitingUser = await usersCollection.findOne(query);
        console.log("existing User", excitingUser);
  
        if(excitingUser){
          return res.send ({message: 'user exists'})
        }
        const result = await usersCollection.insertOne(user);
      return res.send(result)
    })



    // class realated api 
    



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send("SummerCamp running")
})

app.listen(port,()=>{
    console.log(`Summer Camp port ${port}`);
})