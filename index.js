const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.Pay_KEY)
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "access unauthorized" });
  }
  //jwt token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.JwtAccess_Token, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ error: true, message: "access unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.gq6gqcm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client
      .db("InfinityMarttialArts")
      .collection("users");
    const classesCollection = client
      .db("InfinityMarttialArts")
      .collection("class");
    const selectedCollection = client
      .db("InfinityMarttialArts")
      .collection("selected");
    const paymentCollection = client
      .db("InfinityMarttialArts")
      .collection("payment");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const jwtToken = jwt.sign(user, process.env.JwtAccess_Token, {
        expiresIn: "24h",
      });
      res.send({ jwtToken });
    });

    //  users realated api is here
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      return res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(id);
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      return res.send(result);
    });
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role1: "instructor",
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      return res.send(result);
    });

    app.post("/users",  async (req, res) => {
      const user = req.body;
      const query = { email: user.email };

      const excitingUser = await usersCollection.findOne(query);
      console.log("existing User", excitingUser);

      if (excitingUser) {
        return res.send({ message: "user exists" });
      }
      const result = await usersCollection.insertOne(user);
      return res.send(result);
    });

    app.get('/users/admin/:email',verifyJwt, async(req,res)=>{
      const email = req.params.email;

      if(req.decoded.email!== email){
        res.send({admin:false})
      }

      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin:user?.role==='admin'}
      res.send(result)
    })

    app.get('/users/instructor/:email', verifyJwt, async(req,res)=>{
      const email = req.params.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {instructor:user?.role1==='instructor'}
      res.send(result)
    })

    // user sellection
    app.get("/selected",verifyJwt, async (req, res) => {
      const email = req.query.email;
      console.log(email);

      if (!email) {
        res.send([]);
      }
 
      const decodedEmail= req.decoded?.email;
      if(email!== decodedEmail){
        return res.status(404).send({error:true, message:'access forbidden'})
      }

      const query = { email: email };
      const result = await selectedCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/selected", async (req, res) => {
      const selectedClass = req.body;
      console.log(selectedClass);
      const result = await selectedCollection.insertOne(selectedClass);
      return res.send(result);
    });
    app.delete('/selected/:id',  async(req,res)=>{
      const id= req.params.id;
      const query= {$or:[{_id:new ObjectId(id)},{_id:id}]}; 
      const result = await selectedCollection.deleteOne(query);
      return res.send(result);
 })

    // class realated api
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      return res.send(result);
    });

    app.patch("/classes/:id", async (req, res) => {
      const { id, feedback, status ,enrolled} = req.body;
    
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedback,
          status: status,
          enrolled:enrolled,
        },
      };
    
      const result = await classesCollection.updateOne(query, updateDoc);
      return res.send(result);
    });
    
    app.post("/classes", async (req, res) => {
      const newClass = req.body;
      console.log(newClass);
      const result = await classesCollection.insertOne(newClass);
      return res.send(result);
    });

// payment related api 

app.post("/create-payment-intent",verifyJwt, async (req, res) => {
  const { price } = req.body;
  const amount = price*100;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types:['card']
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

  app.post('/payment', verifyJwt, async(req,res)=>{
    const payment = req.body;
    const inresult = await paymentCollection.insertOne(payment);
  
    return res.send(inresult);
  })  

   app.get("/payment", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      return res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SummerCamp running");
});

app.listen(port, () => {
  console.log(`Summer Camp port ${port}`);
});
