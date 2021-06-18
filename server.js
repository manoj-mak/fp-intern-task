var express = require('express');

var app = express();
var MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const {check,validationResult} = require('express-validator');
const session = require('express-session');
app.set('view engine', 'ejs');
const path = require('path');
app.use(express.static(path.join(__dirname,'public')))
app.use(session({secret: 'manoj',saveUninitialized: true,resave: true}));
app.use(function(req, res, next) {
  res.locals.req = req;
  res.locals.sess = req.session;
  next();
});


var url = process.env.MONGODB_URI || "mongodb://localhost:27017/manoj";

MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});




app.get('/', function(req, res) {
    res.render('pages/register');
});



app.post('/signup_check', urlencodedParser ,  [
    check('name', 'Enter your Fullname')
        .trim()
        .exists()
        .isLength({ min: 1 }),


    check('email').notEmpty().withMessage('Email Address required').normalizeEmail().isEmail().withMessage('must be a valid email'),


   check('pass').trim().notEmpty().withMessage('Password required')
  .isLength({ min: 5 }).withMessage('password must be minimum 5 length')
  .matches(/(?=.*?[A-Z])/).withMessage('At least one Uppercase')
  .matches(/(?=.*?[a-z])/).withMessage('At least one Lowercase')
  .matches(/(?=.*?[0-9])/).withMessage('At least one Number')
  .not().matches(/^$|\s+/).withMessage('White space not allowed')
  .matches(/(?=.*?[#?!@$%^&*-])/).withMessage('At least one special character'),


], (req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) 
    {
        const alert = errors.array()
        res.render('pages/register', {
            alert,
            data: req.body
        })


    }

   
    else{


                MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) {
                  if (err) throw err;
                  var dbo = db.db("manoj");

                   dbo.collection("users").findOne({email: req.body.email}).then(function(result)
                {
                     if( result !== null )
                     {
                          
                          const alert2 = "email not exist"
                          res.render('pages/signup',{
                                 msg:'Email already exists',
                                 alert2,
                                 data: req.body
                            })
                     }

                     else
                     {
                        sess = req.session;
                        
                        var myobj = {  
                                 name: req.body.name, 
                                 email: req.body.email, 
                                 password: req.body.pass
                              };

                          sess.email = req.body.email;
                          sess.name = req.body.name;
                          
                         

                           dbo.collection("users").insertOne(myobj, function(err, res) {
                             if (err) throw err;
                             console.log("1 user inserted into databse");
                              db.close();
                           });
                           res.render("pages/prod")
                    }
                     
                });


                 
                });
                
    }
    

});





app.post('/login_submit', urlencodedParser , function(req, res) {
    
   
    sess = req.session
    var email = req.body.email
    var password = req.body.pass
    
    

    MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) 
       {
                  if (err) throw err;
                  var dbo = db.db("manoj");
                     
                  

                     
              dbo.collection("users").findOne({email: email, password: password },function(err,result)
              {
                     if( result !== null )
                     {
                          console.log('user successfully logged in')
                          sess = req.session;
                          sess.email = email;
                          sess.name = result.name;
                          res.redirect("/prod")
                      }

                     
                     else{
                        console.log('wrong email/password entered')
                        const lalert2 = "wrong email/password entered"
                        res.render('pages/register',{
                                 lmsg:'wrong email/password entered',
                                 lalert2,
                                 data: req.body
                            })
                     }

                     db.close()
                     
                });

                     
                 
        });
});




app.get('/prod',(req,res)=>{
  res.render("pages/prod")
})




app.post('/product',urlencodedParser , function(req, res) {


var sess = req.session;

var pname = req.body.pname
var price = req.body.price


MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) {
                  if (err) throw err;
                  var dbo = db.db("manoj");

                  var myobj = {  

                                 user_name: sess.name,
                                 user_email: sess.email,
                                 product_name: pname, 
                                 product_price: price,
                                 Date: Date(),
                                 Status: "Confirmed"
                                 
                              };



                           dbo.collection("transactions").insertOne(myobj, function(err, res) {
                             if (err) throw err;
                             console.log("1 product inserted into databse");
                              db.close();
                           });
                           res.redirect("/prod")


                 
                });

})


app.get("/purchase",(req,res)=>{
  MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) {
                 
 var dbo = db.db("manoj");

  dbo.collection("transactions").find({user_email:sess.email , user_name: sess.name}).toArray(function(err,result)

 {

    var order_date  =  []
    var order_product  =  []
    var order_price  =  []

    var total_rows = result.length


    for(i=0;i<total_rows;i++)
      {
       
        order_date.push(result[i].Date)
        order_product.push(result[i].product_name)
        order_price.push(result[i].product_price)
        
      }
      
     
     sess.total_rows  = total_rows
     sess.order_date  =  order_date
     sess.order_product  =  order_product
     sess.order_price  =  order_price
   

    res.render("pages/purchase",{
      total_rows, order_date, order_product , order_price
    })

 })

})
 
})

const PORT = process.env.PORT || 8080
app.listen(PORT, console.log(`server is starting at ${PORT}`));