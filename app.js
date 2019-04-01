const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cassandra= require('cassandra-driver');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('file-system');
const app = express();
const mime  = require('mime-lookup');
const PORT  = process.env.PORT || 80;

const client = new cassandra.Client({contactPoints:['127.0.0.1:9042'],  localDataCenter: 'datacenter1', keyspace: 'hw5'})
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Step 4: Create a POST form target
// /deposit { filename: (type=text), contents: (type=file) }
// Uploaded files should be deposited into hw5/imgs in Cassandra


app.get('/',(req,res,next)=>{

   res.send(`<form method="POST"  action="/deposit" enctype="multipart/form-data" >
   Filename:<br>
   <input type="text" name="filename" required><br>
    Contents:<br>
   <input type="file" name="contents" accept="image/*" required>
   <input type=submit name="submit">
 </form>`)  
    
});

app.post('/deposit',upload.single('contents'),(req,res,next)=>{
    
  console.log(req.file.path);
  console.log(req.file.mimetype);
  var img = new Buffer(fs.readFileSync(req.file.path));
 
    //prepare query 
    var  query = "INSERT INTO imgs(filename,contents) VALUES(?,?)";
    console.log("DEPOSIT" + query);
    //insert data into imgs table
    client.execute(query,[req.body.filename,img],function(err, result) {
        if(err) return res.send({status:"error",error:err});
        console.log('Success' + result);
        res.status(200).send("ok");
       
      });

});


// // Step 5: Create a GET service
// // /retrieve { filename: }
// // to get the previously uploaded image (make sure to respond with the appropriate image/… content type)

app.get('/retrieve',(req,res,next)=>{
    if(!req.query.filename) return res.send({status:"error",error:"error"});
    const filename = req.query.filename;
    console.log("RETRIEVE "+ filename);
    var query= "SELECT * FROM imgs WHERE filename= ? ";
    //execute select stmt to find file
    client.execute(query,[filename],function(err, result) {
        if(err) return res.send({status:"error",error:err});
        res.writeHead(200, {
          'Content-Type': 'image/'+result.rows[0].filename.split(".")[1]
      });
        res.end(result.rows[0].contents);
    });
      

});

app.listen(PORT);
console.log(`listening on ${PORT}`);
