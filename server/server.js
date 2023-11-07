const express= require('express');
const path = require('path');
const bodyParser= require('body-parser');
const multer = require('multer');



const app = express();
app.use("/images",express.static('images'));
app.set('port',process.env.PORT ||3000);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true})) 

const mysql = require('mysql');
const conn = {
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'lostarkpvp'
};

var storage = multer.diskStorage({
    destination : function(req,file,cb){
        cb(null,"images/");
    },
    filename: function(req,file,cb){
        const ext = path.extname(file.originalname);
        cb(null,path.basename(file.originalname,ext)+"-"+Date.now()+ext);
    },
})

var upload = multer({storage: storage});

var connection = mysql.createConnection(conn); // DB 커넥션 생성
connection.connect();

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname,'app.html'));
  });
app.post('/inputdb', upload.single('SkillImage'),function(req,res){
    var sql1 = 'Select SkillName from skill where SkillName = ?';
    var param1 = req.body.SkillName;
    connection.query(sql1,param1,function(err,rows){
        console.log(rows);
        if(rows[0] !== undefined){
            console.log("중복됨");
            res.send("<script>alert('스킬명 중복됨');window.location.replace('/admin');</script>;");
        }
        else{
            var sql = 'Insert INTO skill (JobName,SkillName,SkillEx,AttHit,DefHit,SkillImg,TripodName1,TripodEx1,TripodName2,TripodEx2,TripodName3,TripodEx3,TripodName4,TripodEx4,TripodName5,TripodEx5,TripodName6,TripodEx6,TripodName7,TripodEx7,TripodName8,TripodEx8) VALUES(?,?,?,?,?,?,?) ';
            const JobName = req.body.JobName;
            const SkillName = req.body.SkillName;
            const SkillEx = req.body.SkillEx;
            const AttHit = req.body.AttHit;
            const DefHit = req.body.DefHit;
            let filename = "";
            if(req.file !== undefined){
                filename = req.file.filename;
                
            }
            const SkillImage = `/images/${filename}`;
            const Tripod = [req.body.TripodName1,req.body.TripodEx1,req.body.TripodName2,req.body.TripodEx2,
            req.body.TripodName3,req.body.TripodEx3,req.body.TripodName4,req.body.TripodEx4,
            req.body.TripodName5,req.body.TripodEx5,req.body.TripodName6,req.body.TripodEx6,
            req.body.TripodName7,req.body.TripodEx7,req.body.TripodName8,req.body.TripodEx8] 
            
            var param = [JobName,SkillName,SkillEx,AttHit,DefHit,SkillImage,Tripod];
            connection.query(sql,param,function(err){
                if(err){
                    console.log(err);
                }
                
            })
            res.redirect("/admin");
        }
        
    })


  });

  let result = [];
app.post('/inputpost',function(req,res){
    let sent = req.body.contents;
    let regex = /\[(.*?)\]/g;
    let ex;
    while((ex=regex.exec(sent))!==null){
        result.push(ex[1]);
    }
    for (var i in result){
        result[i] = JSON.stringify(result[i]);
    }
    let skillstr = result.join();
    let sql = 'insert into post (Contents,Skill) values (?,?)';
    let param = [req.body.contents,skillstr];
    connection.query(sql,param,function(err){
        if(err){
            console.log(err);
        }
    })

    res.redirect("/write");
    
})

app.post('/write1',function(req,res){
    let sent = req.body.contents;
    let regex = /\[(.*?)\]/g;
    let ex;
    while((ex=regex.exec(sent))!==null){
        result.push(ex[1]);
    }
    for (var i in result){
        result[i] = JSON.stringify(result[i]);
    }
    console.log(result);
    res.redirect("/post1");
         
})
app.get('/write1',function(req,res,next){
   res.render('write1');

})
app.get('/post1',function(req,res,next){
    let sql = "select SkillName,SkillEx from skill where SkillName in "
    console.log("여기"+result.join());
    sql += "("+result.join()+")";
    connection.query(sql,function(err,rows){
            if(err) console.error;
            console.log(rows);
            res.render("post",{rows:rows});
         })
    result = [];

})

app.get('/post',function(req,res){
    let sql = "select Contents,Skill from post "
    connection.query(sql,function(err,rows){
        if(err) console.error;
        let sql1 = "select SkillName,SkillEx from skill where SkillName in ";
        console.log(rows[1].Skill);   
        sql1 +="("+rows[1].Skill+")";
        connection.query(sql1,function(err,rows1){
            if(err) console.error;
            console.log("2"+rows1);
            res.render("post",{rows:rows1});
        })
        

    })
})

  let jobname ="";
  app.post('/search',function(req,res){
    jobname = req.body.JobName;
    var string = encodeURIComponent(jobname);
    res.redirect('/skilldb/' );
  })

  app.get('/skilldb', function(req,res,next){
    const sql = "select SkillName,SkillEx,SkillImg,TripodName1,TripodEx1,TripodName2,TripodEx2,TripodName3,TripodEx3,TripodName4,TripodEx4,TripodName5,TripodEx5,TripodName6,TripodEx6,TripodName7,TripodEx7,TripodName8,TripodEx8 from skill where JobName = ? "  ;
    var param = jobname;
    connection.query(sql,[param],function(err,rows){
            if(err) console.error;
            res.render("skilldb",{rows:rows});
         })
 

  })


app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번 포트에서 대기중');
})