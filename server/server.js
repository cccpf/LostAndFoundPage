
const http = require("http");
const qs=require("querystring");
const fs=require("fs");
const formidable=require("formidable");
const path=require("path");
const koastatic=require("koa-static");

const gm=require("gm");
const spawn = require('child_process').spawn; //提供生成node子进程的方法
const GraphicsMagickPath="D:\\GraphicsMagick\\GraphicsMagick-1.3.35-Q16\\";


const sequelize=require("sequelize");
const {op}=require("sequelize");
const userinfodb=require("./createUserInfoDB");
const noticeinfodb=require("./createNoticeInfoDB");
const noticecollectdb=require("./createNoticeCollectDB");
const conversationdb=require("./createConversationDB");

const host = '192.168.88.105';
const port = 6060;



const server = http.createServer((req, res) => {
    
    
});

server
.listen(port, host, () => {
    console.log('Server running at http://'+host+':'+port);
});

server.on('request',function(req,res){
  
    let url = req.url;
    if(url ==='/'){
       readStaticFile('/index.html','text/html',res);
    }
    else if(url==='/login'){
        //处理登录请求
        if (req.method.toUpperCase() == 'POST') {
            let postData = "";

            req.addListener("data", function (data) {
                postData += data;
            });
            
            req.addListener("end", function () {
                let query =JSON.parse(postData);
               
                console.log("用户请求登录："+query.userid);
                queryLoginInfo(query.userid).then(data=>{
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let retData={isValid:true,infoRight:false};
                    if(data[0]!=null){
                        if(data[0].dataValues.id===query.userid && data[0].dataValues.password===query.userpassword){
                            retData["infoRight"]=true;
                        }    
                    }
                    
                    res.end(JSON.stringify(retData)); 
                })
                .catch(err=>{
                    console.log(err);
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let isValid={isValid:false};
                    res.end(JSON.stringify(isValid));  
                })
                              
                
                    
                
            });
        }
    }
    else if(url==='/submitLoginInfo'){
        //处理提交注册信息
        if (req.method.toUpperCase() == 'POST') {
            let postData = "";

            req.addListener("data", function (data) {
                postData += data;
            });
            
            req.addListener("end", function () {
                let query =JSON.parse(postData);
                let id=query.userid,password=query.userpassword;
                console.log("用户请求注册："+id);
                console.log(query);
                insertUserInfoToDB(query.userid,query.userpassword,query.loginquestion,query.loginanswer).then((result)=>{
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let retData={isValid:true};
                   
                    res.end(JSON.stringify(retData));           
                }).catch(err=>{
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let isValid={isValid:false};
                    res.end(JSON.stringify(isValid));  
                
                });
                       
            });
        }
    }
    else if(url==='/submitFindInfo'){
         //处理找回密码请求
         if (req.method.toUpperCase() == 'POST') {
            let postData = "";

            req.addListener("data", function (data) {
                postData += data;
            });
            
            req.addListener("end", function () {
                let query =JSON.parse(postData);
        
                console.log("用户请求找回密码："+query.userid);
                console.log(query);
              
                userinfodb.findAll({
                attributes:{
                    exclude:['password','name','school','major','class','createdAt']
                },
                where:{
                    id:query.userid,
                    loginquestion:query.loginquestion,
                    loginanswer:query.loginanswer
                }})
                .then((data)=>{
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let retData={isValid:true,infoRight:false};
                    if(data[0]!=null){
                        if(data[0].dataValues.id===query.userid && data[0].dataValues.loginquestion===query.loginquestion && data[0].dataValues.loginanswer===query.loginanswer){
                            retData["infoRight"]=true;
                        }
                    }
                    
                    res.end(JSON.stringify(retData)); 
                })
                .catch(err=>{
                    console.log(err);
                    res.writeHead(200,{'Content-Type':'application/json'});
                    let isValid={isValid:false};
                    res.end(JSON.stringify(isValid));  
                })
          
               
                    
            });
        }
    }
    else if(url==='/submitNewPassword'){
        //处理修改新密码请求
        if (req.method.toUpperCase() == 'POST') {
           let postData = "";

           req.addListener("data", function (data) {
               postData += data;
           });
           
           req.addListener("end", function () {
               let query =JSON.parse(postData);
               console.log("用户请求修改密码："+query.userid);
               console.log(query);
               
               userinfodb.update({
                   password:query.usernewpassword
               },{
                   where:{
                        id:query.userid
                   }
               }).then(data=>{
                res.writeHead(200,{'Content-Type':'application/json'});
                let retData={isValid:true};
               
                res.end(JSON.stringify(retData));           
            
               }).catch(error=>{
                console.log(err);
                res.writeHead(200,{'Content-Type':'application/json'});
                let isValid={isValid:false};
                res.end(JSON.stringify(isValid));  
         
               })

           });
       }
   }
    else if(url === '/loginaccount'){
        readStaticFile('/loginaccount.html','text/html',res);
    }
    else if(url === '/findpassword'){
        readStaticFile('/findpassword.html','text/html',res);
    }
    else if(url === '/index'){
        readStaticFile('/index.html','text/html',res);
    }
    else if(findFileType(url) === 'css'){
        readStaticFile(url,'text/css',res);
    }
    else if(findFileType(url) === 'js'){
        readStaticFile(url,'text/js',res);
    }
    else if(isUserPage(url)){
        let urlarr=url.split("/"); 
        let lurl=urlarr[urlarr.length-1];
        if(lurl==="myCollection.html"){
            //处理我的收藏界面请求
            let userpageurl="";
            for(let i=0;i<urlarr.length-1;i++){
                userpageurl+=(urlarr[i]+"/");
            }
            let uid=urlarr[1].split('?id=')[1].split('&')[0];
            let mysubmitnum=0,mycollectionnum=0,mysubmitrow=0,mycollectionrow=0;
            noticeinfodb.findAll({
                attributes:[[sequelize.fn('COUNT',sequelize.col('id')),'no']],
                where:{
                    userid:uid
                }
            }).then(data=>{
                mysubmitnum=data[0].dataValues.no;
                mysubmitrow=Math.ceil((data[0].dataValues.no)/3);
                noticecollectdb.findAll({
                    attributes:[[sequelize.fn('COUNT',sequelize.col('userid')),'no']],
                    where:{
                        userid:uid
                    }
                }).then(data=>{
                    mycollectionnum=data[0].dataValues.no;
                    mycollectionrow=Math.ceil((data[0].dataValues.no)/3);
                    res.writeHead(200,{'Content-Type':'text/html'});
                    fs.readFile('../client/page/myCollection.html','utf-8',function(err,data){
                        if(err){
                            throw(err);
                        }
                        let mycollectiontemplate="",mysubmittemplate="";
                        for(let i=0;i<mysubmitrow;i++){
                            mysubmittemplate+=createMyCollectionRowTemplate(i,true);
                        }
                        for(let i=0;i<mycollectionrow;i++){
                            mycollectiontemplate+=createMyCollectionRowTemplate(i,false);
                        }
                        data=data.replace(new RegExp('{mysubmit}','g'),mysubmittemplate);
                        data=data.replace(new RegExp('{mycollection}','g'),mycollectiontemplate);
                        let myconversationtemp="";
                        conversationdb.findAll({
                            where:{
                                ownerid:uid
                            }
                        }).then((convdata)=>{
                            if(convdata[0]!=null){
                                for(let i=0;i<convdata.length;i++){
                                    if(convdata[i].dataValues!=null){
                                        myconversationtemp+=createMyConversationListTemplate("'"+userpageurl+`conversation?nid=${convdata[i].dataValues.nid}&u0_id=${convdata[i].dataValues.ownerid}&u1_id=${convdata[i].dataValues.userid}`+"'",convdata[i].dataValues.nid,convdata[i].dataValues.ownerid,convdata[i].dataValues.userid);
                                    }
                                }
                            }
                            conversationdb.findAll({
                                where:{
                                    userid:uid
                                }
                            }).then((convdata)=>{
                                if(convdata[0]!=null){
                                    for(let i=0;i<convdata.length;i++){
                                        if(convdata[i].dataValues!=null){
                                            myconversationtemp+=createMyConversationListTemplate("'"+userpageurl+`conversation?nid=${convdata[i].dataValues.nid}&u0_id=${convdata[i].dataValues.ownerid}&u1_id=${convdata[i].dataValues.userid}`+"'",convdata[i].dataValues.nid,convdata[i].dataValues.ownerid,convdata[i].dataValues.userid);
                                        }
                                    }
                                }
                                data=data.replace(new RegExp('{myconversation}','g'),myconversationtemp);
                                noticeinfodb.findAll({
                                    where:{
                                        userid:uid
                                    }
                                }).then(ndata=>{
                                    if(ndata[0]!=null){
                                        for(let i=0;i<mysubmitnum;i++){
                                            row=Math.floor(i/3);
                                            col=i%3;
                                            data=data.replace(new RegExp('{sr'+row+'-c'+col+'-图片}','g'),ndata[i].dataValues.titlepage!=null?ndata[i].dataValues.titlepage.split(".")[1]==="png"?pngToBase64(ndata[i].dataValues.titlepage):jpegToBase64(ndata[i].dataValues.titlepage):jpegToBase64(defaultimg));
                                            data=data.replace(new RegExp('{sr'+row+'-c'+col+'-标题}','g'),ndata[i].dataValues.title==null?"无标题":ndata[i].dataValues.title);
                                            data=data.replace(new RegExp('{sr'+row+'-c'+col+'-介绍}','g'),ndata[i].dataValues.intro==null?"无内容":ndata[i].dataValues.intro);
                                            data=data.replace(new RegExp('{sr'+row+'-c'+col+'-onclick}','g'),ndata[i].dataValues==null?"":"'"+userpageurl+"nid="+ndata[i].dataValues.id+"'");
                                        }        
                                    }
                                    noticecollectdb.findAll({
                                        where:{
                                            userid:uid
                                        }
                                    }).then(cdata=>{
                                        if(cdata[0]!=null){
                                            getNoticeFromCollectionName(0,cdata,data,mycollectionnum,res,userpageurl);
                                        }else{
                                            res.end(data);
                                        }
                                    })
                                });
                            });
                        }).catch(err=>{
                            console.error(err);
                        });
                        
                        
                    });
                });
            }).catch(err=>{
                console.error(err);
            });
        }   
        else if(lurl=="submitNotice.html"){
            readStaticFile('/submitNotice.html','text/html',res);
        }
        else if(lurl=="selfCenter.html"){
            let userid=urlarr[1].split('?id=')[1].split('&')[0];
            
            let user={};
            userinfodb.findAll({
                attributes:{
                    exclude:["password","createdAt"]
                    
                },
                where:{
                    id:userid
                }
            })
            .then(data=>{
                if(data[0].dataValues!=null){
                    if(data[0].dataValues.id!=null)user["userid"]=data[0].dataValues.id;
                    if(data[0].dataValues.name!=null)user["username"]=data[0].dataValues.name;
                    if(data[0].dataValues.school!=null)user["userschool"]=data[0].dataValues.school;
                    if(data[0].dataValues.major!=null)user["usermajor"]=data[0].dataValues.major;
                    if(data[0].dataValues.class!=null)user["userclass"]=data[0].dataValues.class;
                }
                createSelfCenter(user,res);  
            })
            .catch(err=>{
                console.log(err);
                readStaticFile('/serverError.html','text/html',res);
            });

        }
        else if(lurl=="updateUserInfo"){
            //处理用户更改信息请求

            if (req.method.toUpperCase() == 'POST') {
                let postData = "";
     
                req.addListener("data", function (data) {
                    postData += data;
                });
                
                req.addListener("end", function () {
                    let query =JSON.parse(postData);
                    console.log("用户请求修改个人信息："+query.userid);
                   
                    userinfodb.findAll({
                        attributes:{
                            exclude:['loginquestion','loginanswer','name','school','major','class','createdAt']
                        },
                        where:{
                            id:query.userid,
                            password:query.userpassword
                        }
                    })
                    .then(data=>{
                        if(data[0]!=null){
                            if(data[0].dataValues.id==query.userid && data[0].dataValues.password==query.userpassword){
                                userinfodb.update({
                                    name:query.username!=null?query.username:null,
                                    class:query.userclass!=null?query.userclass:null,
                                    major:query.usermajor!=null?query.usermajor:null,
                                    school:query.userschool!=null?query.userschool:null
                                },{
                                    where:{
                                         id:query.userid,
                                         password:query.userpassword
                                    }
                                }).then(data=>{
                                    res.writeHead(200,{'Content-Type':'application/json'});
                                    let retData={isValid:true,infoRight:true};
                            
                                    res.end(JSON.stringify(retData));           
                             
                                });
                            }
                            else{
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let isValid={isValid:true,infoRight:false};
                                res.end(JSON.stringify(isValid)); 
                            }
                        }else{
                            res.writeHead(200,{'Content-Type':'application/json'});
                            let isValid={isValid:true,infoRight:false};
                            res.end(JSON.stringify(isValid)); 
                        }
                    })
                    .catch(err=>{
                        console.log(err);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        let isValid={isValid:false};
                        res.end(JSON.stringify(isValid));     
                    })
     
                });
            }
        }
        else if(lurl=="updatePswByOldPsw"){
            //处理用户更改新密码请求
            
            if (req.method.toUpperCase() == 'POST') {
                let postData = "";
     
                req.addListener("data", function (data) {
                    postData += data;
                });
                
                req.addListener("end", function () {
                    let query =JSON.parse(postData);
                    console.log("用户请求修改密码："+query.userid);
                    console.log(query);
                    
                    userinfodb.findAll({
                        attributes:{
                            exclude:['loginquestion','loginanswer','name','school','major','class','createdAt']
                        },
                        where:{
                            id:query.userid,
                            password:query.userpassword
                        }
                    })
                    .then(data=>{
                        if(data[0]!=null){
                            if(data[0].dataValues.id==query.userid && data[0].dataValues.password==query.userpassword){
                                userinfodb.update({
                                    password:query.usernewpassword
                                },{
                                    where:{
                                         id:query.userid,
                                         password:query.userpassword
                                    }
                                }).then(data=>{
                                    res.writeHead(200,{'Content-Type':'application/json'});
                                    let retData={isValid:true,infoRight:true};
                            
                                    res.end(JSON.stringify(retData));           
                             
                                });
                            }
                            else{
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let isValid={isValid:true,infoRight:false};
                                res.end(JSON.stringify(isValid)); 
                            }
                        }else{
                            res.writeHead(200,{'Content-Type':'application/json'});
                            let isValid={isValid:true,infoRight:false};
                            res.end(JSON.stringify(isValid)); 
                        }
                    })
                    .catch(err=>{
                        console.log(err);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        let isValid={isValid:false};
                        res.end(JSON.stringify(isValid));     
                    })
     
                });
            }
        }
        else if(lurl=="submitNewNotice"){
            //提交或更新notice进数据库
            if(req.method.toUpperCase()=="POST"){
                let postdata="";

                req.addListener("data",data=>{
                    postdata+=data;
                });

                req.addListener("end",()=>{
                    let query=JSON.parse(postdata);
                    query.id=query.ownerid+"_"+query.noticetitle;
                    query.isfind=""+!query.islostnotice;
                    query.imgpath=query.id;
                    console.log(query);
                    let imgpath="./imglib/"+query.imgpath+"/";
                    if(fs.existsSync(imgpath)){
                        let files=fs.readdirSync(imgpath);
                        files.forEach((file)=>{
                            fs.unlinkSync(imgpath+"/"+file);
                        })
                    }

                    noticeinfodb.findAll({
                        where:{
                            id:query.id,
                        }
                    }).then(data=>{
                        if(data==null||data[0]==null||data[0].dataValues.id!=query.id){
                            (async function(){
                                await insertNoticeInfoToDB(query.id,query.ownerid,query.isfind,query.noticetitle,query.noticeintro);
                            })() 
                            .then(()=>{
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let retData={};
                                retData["isValid"]=true;
                               
                                res.end(JSON.stringify(retData));           
                            
                            })
                            .catch(err=>{
                                console.error(err);
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let retData={};
                                retData["isValid"]=false;
                                
                                res.end(JSON.stringify(retData));
                            });
                        }
                        else{
                            noticeinfodb.update({
                                title:query.noticetitle,
                                intro:query.noticeintro,
                                isFind:query.isfind,
                                titlepage:null,
                                readNum:0,
                                collectionNum:0
                            },{
                                where:{
                                        id:query.id,
                                }
                            }).then(data=>{
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let retData={};
                                retData["isValid"]=true;

                                res.end(JSON.stringify(retData));           
                            
                            }).catch(err=>{
                                console.error(err);
                                res.writeHead(200,{'Content-Type':'application/json'});
                                let retData={};
                                retData["isValid"]=false;
                                
                                res.end(JSON.stringify(retData));
                            });
                        }
                        //刷新Notice
                        refreshAllNoticeGroup();
                    }).catch(err=>{
                        console.error(err);
                        res.writeHead(200,{'Content-Type':'application/json'});
                                let retData={};
                                retData["isValid"]=false;
                                
                                res.end(JSON.stringify(retData));
                    });

                })
            }  
        }
        else if(lurl=="submitNewNoticeImg"){
            //处理提交新notice中的图片
            let form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';        //设置编辑
            form.uploadDir = './imglib/temp';     //设置上传目录 文件会自动保存在这里
            form.keepExtensions = true;     //保留后缀
            form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件最大大小5M
            form.parse(req, function (err, fields, files) {
               
                res.end(JSON.stringify({}));

                if (err) {
                    console.error(err);
                    let retData={};
                    retData["isValid"]=true;
                    retData["error"]="服务器出错";
                    retData["initialPreview"]="";
                    retData["initialPreviewConfig"]="";
                    retData["initialPreviewThumbTags"]="";
                    retData["append"]=true;
                    res.end(JSON.stringify(retData));
                
                }

               
                //获得上传的额外数据
                let getdata={};
                getdata["imgpath"]=fields.imgpath;
                getdata["nid"]=fields.nid;
               
                if(files.file_data){
                    if(!fs.existsSync("./imglib/"+getdata.imgpath+"/")){
                        fs.mkdirSync("./imglib/"+getdata.imgpath+"/");
                    }
                    let oldpath=__dirname+'/'+files.file_data.path;    
                    
                    let newpath = __dirname + '/imglib/'+getdata.imgpath+'/' + files.file_data.name;
    
                    fs.rename(oldpath, newpath,function(err){
                        if(err){
                            console.log("文件改名失败");
                            console.error(err);
                            let retData={};
                            retData["isValid"]=true;
                            retData["error"]="图片存储出错，请重试";
                            retData["initialPreview"]="";
                            retData["initialPreviewConfig"]="";
                            retData["initialPreviewThumbTags"]="";
                            retData["append"]=true;
                            res.end(JSON.stringify(retData));
                        
                        }
                    });
                    
                    let userimg=gm(newpath);
                    userimg.options({
                        appPath:GraphicsMagickPath
                    }).resize(480,300,"!").write(newpath,err=>{
                        console.error(err);
                    });
                    
                    noticeinfodb.findAll({
                        where:{id:getdata.nid}
                    }).then(data=>{
                        if(data[0]!=null){
                            if(data[0].dataValues.titlepage==null){
                                noticeinfodb.update({
                                    titlepage: '/imglib/'+getdata.imgpath+'/' + files.file_data.name
                                },{
                                    where:{
                                        id:getdata.nid
                                    }
                                }).then(()=>{
                                    let retData={};
                                    res.end(JSON.stringify(retData));
                                });
                            }
                        }
                    }).catch(err=>{
                        console.error(err);
                        let retData={};
                        retData["isValid"]=true;
                        retData["error"]="默认设置封面出错，请重试";
                        retData["initialPreview"]="";
                        retData["initialPreviewConfig"]="";
                        retData["initialPreviewThumbTags"]="";
                        retData["append"]=true;
                        res.end(JSON.stringify(retData));
                    })
                }
        
          });
        }
        else if(lurl=="userheadimg"){
            //处理提交头像请求
            let form = new formidable.IncomingForm();   //创建上传表单
            form.encoding = 'utf-8';        //设置编辑
            form.uploadDir = './touxiang/temp';     //设置上传目录 文件会自动保存在这里
            form.keepExtensions = true;     //保留后缀
            form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件最大大小5M
            form.parse(req, function (err, fields, files) {
               
                res.end(JSON.stringify({}));

                if (err) {
                    console.error(err);
                    let retData={};
                    retData["isValid"]=true;
                    retData["error"]="服务器出错";
                    retData["initialPreview"]="";
                    retData["initialPreviewConfig"]="";
                    retData["initialPreviewThumbTags"]="";
                    retData["append"]=true;
                    res.end(JSON.stringify(retData));
                
                }

               
                //获得上传的额外数据
                let getdata={};
                getdata["imgpath"]=fields.imgpath;
                getdata["userid"]=fields.userid;
                if(files.file_data){
                    let path="./touxiang/"+getdata.imgpath;
                    if(!fs.existsSync(path)){
                        fs.mkdirSync(path);
                    }else{
                        let files=fs.readdirSync(path);
                        files.forEach(file=>{
                            fs.unlinkSync(path+"/"+file);
                        })
                    }

                    userinfodb.update({
                        img:files.file_data.name,
                    },{
                        where:{
                             id:getdata.userid
                        }
                    }).then(data=>{
                        let oldpath=__dirname+'/'+files.file_data.path;    
                        

                        let newpath = __dirname + '/touxiang/'+getdata.imgpath+'/' + files.file_data.name;
        
                        fs.rename(oldpath, newpath,function(err){
                            if(err){
                                console.log("文件改名失败");
                                console.error(err);
                                let retData={};
                                retData["isValid"]=true;
                                retData["error"]="图片存储出错，请重试";
                                retData["initialPreview"]="";
                                retData["initialPreviewConfig"]="";
                                retData["initialPreviewThumbTags"]="";
                                retData["append"]=true;
                                res.end(JSON.stringify(retData));
                            
                            }
                        }
                        );
                        
                        
                        let userimg=gm(newpath);
                        userimg.options({
                            appPath:GraphicsMagickPath
                        }).resize(200,200,"!").write(newpath,err=>{
                            console.error(err);
                        });
                        
                 
                                      

                    let retData={};
                    
                    res.end(JSON.stringify(retData));           
                 
                    }).catch(err=>{
                        console.error(err);
                        let retData={};
                        retData["isValid"]=true;
                        retData["error"]="服务器出错";
                        retData["initialPreview"]="";
                        retData["initialPreviewConfig"]="";
                        retData["initialPreviewThumbTags"]="";
                        retData["append"]=true;
                        res.end(JSON.stringify(retData));
                    });
                }            
     
        });
        }
        else if(isNotice(lurl)){
            //处理进入告示界面请求
        const nid=lurl.split("=")[1];
        res.writeHead(200,{'Content-Type':'text/html'});
        fs.readFile('../client/page/NoticeTemplate.html','utf-8',function(err,data){
        if(err){
            throw(err);
        }
        noticeinfodb.findAll({
            where:{
                id:nid
            }
        }).then(ndata=>{
            let noticeinfo={};
            if(ndata[0]!=null){
                if(ndata[0].dataValues!=null){
                    noticeinfo["title"]=ndata[0].dataValues.title;
                    noticeinfo["intro"]=ndata[0].dataValues.intro;
                    noticeinfo["imgpath"]=ndata[0].dataValues.imgpath;
                    noticeinfo["collectionnum"]=ndata[0].dataValues.collectionNum;
                }
            }
            
            data=data.replace(new RegExp('{nid}','g'),"'"+nid+"'");
            data=data.replace(new RegExp('{标题}','g'),noticeinfo.title!=null?noticeinfo.title:"获取标题失败");
            data=data.replace(new RegExp('{内容}','g'),noticeinfo.intro!=null?noticeinfo.intro:"获取内容失败");
            data=data.replace(new RegExp('{收藏}','g'),noticeinfo.collectionnum!=null?noticeinfo.collectionnum:"0");
            
            if(noticeinfo.imgpath!=null){
                let filepath="./imglib/"+noticeinfo.imgpath;
                if(fs.existsSync(filepath)){
                    let files=fs.readdirSync(filepath);
                    let nowpic=0;
                    files.forEach((file)=>{
                        let pictype=file.split(".")[1];
                        noticeinfo["img_"+nowpic]=pictype==="png"?pngToBase64("/imglib/"+noticeinfo.imgpath+"/"+file):jpegToBase64("/imglib/"+noticeinfo.imgpath+"/"+file);
                        nowpic++;
                    });
                    data=data.replace(new RegExp('{img_0}','g'),noticeinfo.img_0!=null?'"'+noticeinfo.img_0+'"':"");
                    data=data.replace(new RegExp('{img_1}','g'),noticeinfo.img_1!=null?',"'+noticeinfo.img_1+'"':"");
                    data=data.replace(new RegExp('{img_2}','g'),noticeinfo.img_2!=null?',"'+noticeinfo.img_2+'"':"");
                    data=data.replace(new RegExp('{img_3}','g'),noticeinfo.img_3!=null?',"'+noticeinfo.img_3+'"':"");
                    data=data.replace(new RegExp('{img_4}','g'),noticeinfo.img_4!=null?',"'+noticeinfo.img_4+'"':"");
                    data=data.replace(new RegExp('{img_5}','g'),noticeinfo.img_5!=null?',"'+noticeinfo.img_5+'"':"");
                    data=data.replace(new RegExp('{img_6}','g'),noticeinfo.img_6!=null?',"'+noticeinfo.img_6+'"':"");
                    data=data.replace(new RegExp('{img_7}','g'),noticeinfo.img_7!=null?',"'+noticeinfo.img_7+'"':"");
                    data=data.replace(new RegExp('{img_8}','g'),noticeinfo.img_8!=null?',"'+noticeinfo.img_8+'"':"");
                    data=data.replace(new RegExp('{img_9}','g'),noticeinfo.img_9!=null?',"'+noticeinfo.img_9+'"':"");
                }
                
            }
            else{
                data=data.replace(new RegExp('{img_0}','g'),'"'+jpegToBase64("/images/logo.jpg")+'"');
                data=data.replace(new RegExp('{img_1}','g'),"");
                data=data.replace(new RegExp('{img_2}','g'),"");
                data=data.replace(new RegExp('{img_3}','g'),"");
                data=data.replace(new RegExp('{img_4}','g'),"");
                data=data.replace(new RegExp('{img_5}','g'),"");
                data=data.replace(new RegExp('{img_6}','g'),"");
                data=data.replace(new RegExp('{img_7}','g'),"");
                data=data.replace(new RegExp('{img_8}','g'),"");
                data=data.replace(new RegExp('{img_9}','g'),"");
            }
             
            res.end(data);
        }).catch(err=>{
            console.error(err);
        });

        
     });
        }
        else if(isConversation(lurl)){
            readStaticFile('/ConversationTemplate.html','text/html',res);
        }
        else{
            readStaticFile('/notfind.html','text/html',res);
        }
        
    }
    else if(isMainMenu(url)){
        let urlarr=url.split("/");
        let user={},userinfo=(urlarr[1].split("?"))[1].split("&");
        user["userid"]=(userinfo[0].split("="))[1];
        user["userpassword"]=(userinfo[1].split("="))[1];
       
        console.log(user["userid"]);
        console.log(user["userpassword"]);
        //从数据库读取基本信息
        
        userinfodb.findAll({
            where:{
                id:user.userid,
                password:user.userpassword
            }
        })
        .then(data=>{
            if(data[0]!=null){
                if(data[0].dataValues.id==user.userid && data[0].dataValues.password==user.userpassword){
                   user["username"]=data[0].dataValues.name!=null?data[0].dataValues.name:null;
                   user["usermajor"]=data[0].dataValues.major!=null?data[0].dataValues.major:null;
                   user["userclass"]=data[0].dataValues.class!=null?data[0].dataValues.class:null;
                   user["userschool"]=data[0].dataValues.school!=null?data[0].dataValues.school:null;
                   user["userimg"]=data[0].dataValues.img!=null?"/touxiang/"+data[0].dataValues.id+"/"+data[0].dataValues.img:null;
                   
                   let imgarr=data[0].dataValues.img.split(".");
                   user["imgispng"]=data[0].dataValues.img!=null?imgarr[imgarr.length-1]=="png":null;

                   createMainMenu(user,res);
                }
            }
        })
        .catch(err=>{
            console.log(err);
            createMainMenu(user,res);
        })
       

    }
    else if(isFindSuccess(url)){
        //通过密保问题修改密码
        let urlarr=url.split("/");
        let user={},userinfo=(urlarr[1].split("?"))[1].split("&");
        user["userid"]=(userinfo[0].split("="))[1];
        user["loginquestion"]=(userinfo[1].split("="))[1];
        user["loginanswer"]=(userinfo[2].split("="))[1];
        createUpdatePswPage(user,res);
    }
    else if(url === "/getPageNum"){
        //获取页面数量
        if(req.method.toUpperCase()=="POST"){
            let postdata="";

            req.addListener("data",data=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);
                if(query.noticetype == "allnotice"){
                    noticeinfodb.findAll({
                        attributes:[[sequelize.fn('COUNT',sequelize.col('id')),'no']]
                    }).then(data=>{
                        let retdata={};
                        retdata["pagenum"]=Math.ceil((data[0].dataValues.no)/9);
                        res.writeHead(200,{'Content-Type':'application/json'}); 
                        res.end(JSON.stringify(retdata)); 
                    }).catch(err=>{
                        console.error(err);
                    });
                    
                }else if(query.noticetype == "lostnotice"){
                    noticeinfodb.findAll({
                        attributes:[[sequelize.fn('COUNT',sequelize.col('id')),'no']],
                        where:{
                            isFind:false
                        }
                    }).then(data=>{
                        let retdata={};
                        retdata["pagenum"]=Math.ceil((data[0].dataValues.no)/9);
                        res.writeHead(200,{'Content-Type':'application/json'}); 
                        res.end(JSON.stringify(retdata)); 
                    }).catch(err=>{
                        console.error(err);
                    });
                }else if(query.noticetype == "findnotice"){
                    noticeinfodb.findAll({
                        attributes:[[sequelize.fn('COUNT',sequelize.col('id')),'no']],
                        where:{
                            isFind:true
                        }
                    }).then(data=>{
                        let retdata={};
                        retdata["pagenum"]=Math.ceil((data[0].dataValues.no)/9);
                        res.writeHead(200,{'Content-Type':'application/json'}); 
                        res.end(JSON.stringify(retdata)); 
                    }).catch(err=>{
                        console.error(err);
                    });
                }
                
            });
        }
    }
    else if(url === "/getNoticeData"){
        if(req.method.toUpperCase()=="POST"){
            let postdata="";

            req.addListener("data",(data)=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);
                if(query.noticetype == "allnotice"){
                    if(query.noticesortby == "timedesc"){
                        refreshAllNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "timeasc"){
                        refreshAllNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }else if(query.noticesortby == "collectiondesc"){
                        refreshAllNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "collectionasc"){
                        refreshAllNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }else{
                        console.err("获取全部notice时出现问题");
                        let retdata={isValid:false};
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }
                }else if(query.noticetype == "lostnotice"){
                    if(query.noticesortby == "timedesc"){
                        refreshLostNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescLostGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "timeasc"){
                        refreshLostNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescLostGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "collectiondesc"){
                        refreshLostNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescLostGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "collectionasc"){
                        refreshLostNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescLostGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }else{
                        console.err("获取lostnotice时出现问题");
                        let retdata={isValid:false};
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }
                }else if(query.noticetype == "findnotice"){
                    if(query.noticesortby == "timedesc"){
                        refreshFindNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescFindGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "timeasc"){
                        refreshFindNoticeByTimeDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,timeDescFindGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "collectiondesc"){
                        refreshFindNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescFindGroup,query.pagenum);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));

                    }else if(query.noticesortby == "collectionasc"){
                        refreshFindNoticeByCollectionDesc();
                        let retdata={isValid:true};
                        setNoticeRetData(retdata,collectionDescFindGroup,query.pagenum,false);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }else{
                        console.err("获取findnotice时出现问题");
                        let retdata={isValid:false};
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }
                }else{
                    console.err("获取notice种类时出现问题");
                    let retdata={isValid:false};
                    res.writeHead(200,{'Content-Type':'application/json'});
                    res.end(JSON.stringify(retdata));
                }
            })
        }
    } 
    else if(url === "/setNoticeCollection"){
        //设置用户收藏
        if(req.method.toUpperCase()==="POST"){
            let postdata="";
            req.addListener("data",(data)=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);console.log(query);
                let retdata={isValid:false};
                noticecollectdb.create({
                    nid:query.nid,
                    userid:query.userid
                })
                .then(data=>{
                    noticeinfodb.findAll({
                        where:{
                            id:query.nid
                        }
                    }).then(data=>{
                        if(data[0]!=null){
                            noticeinfodb.update({
                                collectionNum:data[0].dataValues.collectionNum+1
                            },{
                                where:{
                                    id:query.nid
                                }
                            }).then(()=>{
                                retdata["isValid"]=true;
                                retdata["dealtype"]="create";
                                retdata["nowcn"]=data[0].dataValues.collectionNum+1;
                                res.writeHead(200,{'Content-Type':'application/json'});
                                res.end(JSON.stringify(retdata));
                            })
                        }
                    })
                })
                .catch(err=>{
                    if(err.name==="SequelizeUniqueConstraintError"){
                        noticecollectdb.destroy({
                            where:{
                                nid:query.nid,
                                userid:query.userid      
                            }
                        })
                        .then(()=>{
                            noticeinfodb.findAll({
                                where:{
                                    id:query.nid
                                }
                            }).then(data=>{
                                if(data[0]!=null){
                                    noticeinfodb.update({
                                        collectionNum:data[0].dataValues.collectionNum-1
                                    },{
                                        where:{
                                            id:query.nid
                                        }
                                    }).then(()=>{
                                        retdata["isValid"]=true;
                                        retdata["dealtype"]="delete";
                                        retdata["nowcn"]=data[0].dataValues.collectionNum-1;
                                        res.writeHead(200,{'Content-Type':'application/json'});
                                        res.end(JSON.stringify(retdata));
                                    })
                                }
                            })
                        })
                        .catch(err=>{
                            console.error(err);
                            res.writeHead(200,{'Content-Type':'application/json'});
                            res.end(JSON.stringify(retdata));
                        })
                    }else{
                        console.error(err);
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }
                    
                })
                    
            })
        }
    }
    else if(url === "/noticeConversation"){
        if(req.method.toUpperCase()==="POST"){
            let postdata="";
            req.addListener("data",(data)=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);
                let retdata={isValid:false};
                noticeinfodb.findAll({
                    where:{
                        id:query.nid,
                    }
                }).then(data=>{
                    if(data[0]!=null){
                        conversationdb.create({
                                nid:query.nid,
                                ownerid:data[0].dataValues.userid,
                                userid:query.userid,
                        }).then(cdata=>{
                            retdata["hasConversation"]=false;
                            retdata["isValid"]=true;
                            retdata["ownerid"]=data[0].dataValues.userid;
                            res.writeHead(200,{'Content-Type':'application/json'});
                            res.end(JSON.stringify(retdata));
                        }).catch(err=>{
                            if(err.name==="SequelizeUniqueConstraintError"){
                                retdata["hasConversation"]=true;
                                retdata["isValid"]=true;
                                retdata["ownerid"]=data[0].dataValues.userid;
                                res.writeHead(200,{'Content-Type':'application/json'});
                                res.end(JSON.stringify(retdata));
                            }else{
                                console.error(err);
                                res.writeHead(200,{'Content-Type':'application/json'});
                                res.end(JSON.stringify(retdata));
                            }
                            
                        });
                    }
                }).catch(err=>{
                    console.error(err);
                    res.writeHead(200,{'Content-Type':'application/json'});
                    res.end(JSON.stringify(retdata));
                })
                
            });
        }
    }
    else if(url === "/getConversation"){
        if(req.method.toUpperCase()==="POST"){
            let postdata="";
            let retdata={isValid:false};
            req.addListener("data",(data)=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);
                conversationdb.findAll({
                    where:{
                        nid:query.nid,
                        userid:query.userid,
                        ownerid:query.userid_1
                    }
                }).then((data)=>{
                    if(data[0]!=null){
                        retdata["isValid"]=true;
                        retdata["conversation"]=data[0].dataValues.conversation==null?"":data[0].dataValues.conversation;
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify(retdata));
                    }
                    conversationdb.findAll({
                        where:{
                            nid:query.nid,
                            ownerid:query.userid,
                            userid:query.userid_1
                        }
                    }).then((data)=>{
                        if(data[0]!=null){
                            retdata["isValid"]=true;
                            retdata["conversation"]=data[0].dataValues.conversation==null?"":data[0].dataValues.conversation;
                            res.writeHead(200,{'Content-Type':'application/json'});
                            res.end(JSON.stringify(retdata));
                        }
                    })
                }).catch(err=>{
                    console.error(err);
                    res.writeHead(200,{'Content-Type':'application/json'});
                    res.end(JSON.stringify(retdata));
                });
            })
        }
        
    }
    else if(url === "/submitTextToConversation"){
        if(req.method.toUpperCase()==="POST"){
            let postdata="";
            let retdata={submitsuccess:false};
            req.addListener("data",(data)=>{
                postdata+=data;
            });

            req.addListener("end",()=>{
                let query=JSON.parse(postdata);
                conversationdb.findAll({
                    where:{
                        nid:query.nid,
                        userid:query.userid,
                        ownerid:query.userid_1
                    }
                }).then((data)=>{
                    if(data[0]!=null){
                        let temp=data[0].dataValues.conversation==null?"":data[0].dataValues.conversation;
                        conversationdb.update({
                            conversation:temp+(query.userid+"/"+query.mytext+"&"),
                        },{
                            where:{
                                nid:query.nid,
                                userid:query.userid,
                                ownerid:query.userid_1
                            }
                        }).then(()=>{
                            retdata["submitsuccess"]=true;
                            res.writeHead(200,{'Content-Type':'application/json'});
                            res.end(JSON.stringify(retdata));
                        });
                    }
                    
                    conversationdb.findAll({
                        where:{
                            nid:query.nid,
                            ownerid:query.userid,
                            userid:query.userid_1
                        }
                    }).then((data)=>{
                        if(data[0]!=null){
                            let temp=data[0].dataValues.conversation==null?"":data[0].dataValues.conversation;
                            conversationdb.update({
                                conversation:temp+(query.userid+"/"+query.mytext+"&"),
                            },{
                                where:{
                                    nid:query.nid,
                                    ownerid:query.userid,
                                    userid:query.userid_1
                                }
                            }).then(()=>{
                                retdata["submitsuccess"]=true;
                                res.writeHead(200,{'Content-Type':'application/json'});
                                res.end(JSON.stringify(retdata));
                            });
                        }
                    })
                }).catch(err=>{
                    console.error(err);
                    res.writeHead(200,{'Content-Type':'application/json'});
                    res.end(JSON.stringify(retdata));
                });
            })
        }
    }
    else{
        readStaticFile('/notfind.html','text/html',res);
    }
    

});

server.on('request',function(req,res){
    console.log('收到请求，客户端地址为：',req.socket.remoteAddress,req.socket.remotePort);
});


function readStaticFile(url,filetype,response){
    response.writeHead(200,{'Content-Type':filetype});
    fs.readFile('../client/page'+url,'utf-8',function(err,data){
        if(err){
            throw err;
        }
        response.end(data);
    });
}

function findFileType(filename){
    let resarr=filename.split("/");
    if(resarr.length>1){
        return resarr[1];
    }
    
    return undefined;
}

function clearDir(path){
    let files=fs.readdirSync(path);
    files.forEach(file=>{
        let state=fs.statSync(path+"/"+file);
        if(state.isDirectory()){
            clearDir(path+"/"+file);
            fs.rmdirSync(path+"/"+file);
        }else{
            fs.unlinkSync(path+"/"+file);
        }
    });
}

function isMainMenu(filename){
    let resarr=filename.split("/");
    if(resarr.length>1){
        let res=resarr[1].split("?");
    
        if(res[0]==="mainMenu.html"){
            return true;
        }
    }
    
    return false;
}

function isNotice(filename){
    let resarr=filename.split("=");
    if(resarr.length>1){
        let res=resarr[0];
        if(res==="nid"){
            return true;
        }
    }
    
    return false;
}

function isConversation(filename){
    let resarr=filename.split('?');
    if(resarr.length>0){
        let res=resarr[0];
        if(res==="conversation"){
            return true;
        }
    }
    return false;
}

function isFindSuccess(filename){
    let resarr=filename.split("/");
    let res=resarr[1].split("?");
    
    if(res[0]=="findpassword.html"){
        return true;
    }
    return false;
}


function isUserPage(filename){
    if(filename.search(/.*?id=.*psw=.*\//)>=0){
        return true;
    }
    return false;
}

const defaultimg="/images/logo.jpg";

function createMainMenu(user,res){
    res.writeHead(200,{'Content-Type':'text/html'});
    fs.readFile('../client/page/mainMenu.html','utf-8',function(err,data){
        if(err){
            throw(err);
        }

        data=data.replace(new RegExp('{id}','g'),user.userid!=null?user.userid:"");
        data=data.replace(new RegExp('{头像}','g'),user.userimg!=null?user.imgispng?pngToBase64(user.userimg):jpegToBase64(user.userimg):jpegToBase64(defaultimg));
        data=data.replace(new RegExp('{学校}','g'),user.userschool!=null?user.userschool:"");
        data=data.replace(new RegExp('{专业}','g'),user.usermajor!=null?user.usermajor:"");
        data=data.replace(new RegExp('{班级}','g'),user.userclass!=null?user.userclass:"");
        data=data.replace(new RegExp('{姓名}','g'),user.username!=null?user.username:"");
    
        res.end(data);
    });
}

function isPng(url){
    let urlarr=url.split("/");
    let picname=urlarr[urlarr.length-1];
    return (picname.split(".")[picname.split(".").length-1])=="png";
}

function createUpdatePswPage(user,res){
    res.writeHead(200,{'Content-Type':'text/html'});
    fs.readFile('../client/page/updatePswPage.html','utf-8',function(err,data){
        if(err){
            throw(err);
        }

        //修改固定id，提交新密码，给出提示修改成功并返回主页
        if(user.userid)data=data.replace(new RegExp('{userid}','g'),user.userid);


        res.end(data);
    });
}

function createSelfCenter(user,res){
    res.writeHead(200,{'Content-Type':'text/html'});
    fs.readFile('../client/page/selfCenter.html','utf-8',function(err,data){
        if(err){
            throw(err);
        }
        data=data.replace(new RegExp('{id}','g'),user.userid!=null?user.userid:"");
        data=data.replace(new RegExp('{school}','g'),user.userschool!=null?user.userschool:"");
        data=data.replace(new RegExp('{major}','g'),user.usermajor!=null?user.usermajor:"");
        data=data.replace(new RegExp('{class}','g'),user.userclass!=null?user.userclass:"");
        data=data.replace(new RegExp('{name}','g'),user.username!=null?user.username:"");
       
        res.end(data);
    });
}

function createMyCollectionRowTemplate(row,issubmit){
    let mark=issubmit?"s":"c";
    return  '<div class="row displayrow" id="'+mark+'r'+row+'">'+
    '<div class="col displayitem" id="'+mark+'r'+row+'-c0">'+
        '<figure class="figure">'+
            '<img id="'+mark+'r'+row+'-c0-img" class="figure-img img-fluid rounded" src="{'+mark+'r'+row+'-c0-图片}" onclick="window.open({'+mark+'r'+row+'-c0-onclick})" alt="已经没有告示了">'+
            '<figcaption id="'+mark+'r'+row+'-c0-title" class="figure-caption text-right">{'+mark+'r'+row+'-c0-标题}</figcaption>'+
            '<figcaption id="'+mark+'r'+row+'-c0-cn" class="figure-caption text-right">{'+mark+'r'+row+'-c0-介绍}</figcaption>'+
        '</figure>'+
    '</div>'+
    '<div class="col displayitem" id="'+mark+'r'+row+'-c1">'+
        '<figure class="figure">'+
            '<img id="'+mark+'r'+row+'-c1-img" class="figure-img img-fluid rounded" src="{'+mark+'r'+row+'-c1-图片}" onclick="window.open({'+mark+'r'+row+'-c1-onclick})" alt="已经没有告示了">'+
            '<figcaption id="'+mark+'r'+row+'-c1-title" class="figure-caption text-right">{'+mark+'r'+row+'-c1-标题}</figcaption>'+
            '<figcaption id="'+mark+'r'+row+'-c1-cn" class="figure-caption text-right">{'+mark+'r'+row+'-c1-介绍}</figcaption>'+
        '</figure>'+
    '</div>'+
    '<div class="col displayitem" id="'+mark+'r'+row+'-c2">'+
        '<figure class="figure">'+
            '<img id="'+mark+'r'+row+'-c2-img" class="figure-img img-fluid rounded" src="{'+mark+'r'+row+'-c2-图片}" onclick="window.open({'+mark+'r'+row+'-c2-onclick})" alt="已经没有告示了">'+
            '<figcaption id="'+mark+'r'+row+'-c2-title" class="figure-caption text-right">{'+mark+'r'+row+'-c2-标题}</figcaption>'+
            '<figcaption id="'+mark+'r'+row+'-c2-cn" class="figure-caption text-right">{'+mark+'r'+row+'-c2-介绍}</figcaption>'+
       '</figure>'+
    '</div>'+
'</div>';
}

function createMyConversationListTemplate(url,nid,oid,uid){
    return '<li class="list-group-item" onclick="window.open('+url+')">'+`告示名称：${nid}  拥有人：${oid}  对话者：${uid}`+'</li>';
}

function getNoticeFromCollectionName(count,cdata,data,max,res,userpageurl){
    if(count<max){
        row=Math.floor(count/3);
        col=count%3;console.log(row+"-"+col);
        noticeinfodb.findAll({
            where:{
                id:cdata[count].dataValues.nid
            }
        }).then(ndata=>{
            data=data.replace(new RegExp('{cr'+row+'-c'+col+'-图片}','g'),ndata[0].dataValues.titlepage!=null?ndata[0].dataValues.titlepage.split(".")[1]==="png"?pngToBase64(ndata[0].dataValues.titlepage):jpegToBase64(ndata[0].dataValues.titlepage):jpegToBase64(defaultimg));
            data=data.replace(new RegExp('{cr'+row+'-c'+col+'-标题}','g'),ndata[0].dataValues.title==null?"无标题":ndata[0].dataValues.title);
            data=data.replace(new RegExp('{cr'+row+'-c'+col+'-介绍}','g'),ndata[0].dataValues.intro==null?"无内容":ndata[0].dataValues.intro);
            data=data.replace(new RegExp('{cr'+row+'-c'+col+'-onclick}','g'),ndata[0].dataValues==null?"":"'"+userpageurl+"nid="+ndata[0].dataValues.id+"'");
            getNoticeFromCollectionName(count+1,cdata,data,max,res,userpageurl);
        })
    }else{
        res.end(data);
    }
}

function pngToBase64(url){    
    let imageData = fs.readFileSync("../server"+url);
    let imageBase64 = imageData.toString("base64");
    
    let imagePrefix = "data:image/png;base64,";
    return imagePrefix + imageBase64;
}

function jpegToBase64(url){    
    let imageData = fs.readFileSync("../server"+url);
    let imageBase64 = imageData.toString("base64");
    
    let imagePrefix = "data:image/jpeg;base64,";
    return imagePrefix + imageBase64;
}
/**
 * 添加用户信息进数据库
 */
async function insertUserInfoToDB(userid,userpassword,loginquestion,loginanswer,username=null,userschool=null,usermajor=null,userclass=null){
    
    return    userinfodb.create({
                id:userid,
                password:userpassword,
                loginquestion:loginquestion,
                loginanswer:loginanswer,
                name:username,
                school:userschool,
                major:usermajor,
                class:userclass,
                createdAt:new Date(),
                updatedAt:new Date(),
            });    
}
/**
 * 从用户数据库中获取登录信息
 */
async function queryLoginInfo(userid){
    return userinfodb.findAll({
        where:{
            id:userid
        }
    });
}

/**
 * 添加告示信息进数据库
 */
async function insertNoticeInfoToDB(noticeid,ownerid,isfind,noticetitle=null,noticeintro=null){
    return    noticeinfodb.create({
        id:noticeid,
        userid:ownerid,
        title:noticetitle,
        isFind:isfind,
        intro:noticeintro,
        imgpath:ownerid+"_"+noticetitle,
        collectionNum:0,
        readNum:0,
        createdAt:new Date(),
        updatedAt:new Date(),
    });    
}

let timeDescGroup,collectionDescGroup;
let timeDescFindGroup,collectionDescFindGroup;
let timeDescLostGroup,collectionDescLostGroup;

refreshAllNoticeGroup();

setInterval(()=>{
    refreshAllNoticeGroup();
},10000);
/**
 * 刷新全部noticegroup
 */
function refreshAllNoticeGroup(){
    refreshAllNoticeByTimeDesc();
    refreshAllNoticeByCollectionDesc();

    refreshLostNoticeByTimeDesc();
    refreshLostNoticeByCollectionDesc();

    refreshFindNoticeByTimeDesc();
    refreshFindNoticeByCollectionDesc();
}

/**
 * 按创建时间逆序获得全部notice
 */
function refreshAllNoticeByTimeDesc(){
    refreshNoticeDB("createdAt",true).then((data)=>{
        timeDescGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });            
}

/**
 * 按收藏逆序获得全部Notice
 */
function refreshAllNoticeByCollectionDesc(){
    refreshNoticeDB("collectionNum",true).then((data)=>{
        collectionDescGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });
}

/**
 * 按创建时间逆序获得lostnotice
 */
function refreshLostNoticeByTimeDesc(){
    refreshNoticeDBByType("createdAt",true,false).then((data)=>{
        timeDescLostGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });            
}


/**
 * 按收藏逆序获得lostNotice
 */
function refreshLostNoticeByCollectionDesc(){
    refreshNoticeDBByType("collectionNum",true,false).then((data)=>{
        collectionDescLostGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });
}



/**
 * 按创建时间逆序获得findnotice
 */
function refreshFindNoticeByTimeDesc(){
    refreshNoticeDBByType("createdAt",true,true).then((data)=>{
        timeDescFindGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });            
}


/**
 * 按收藏逆序获得findNotice
 */
function refreshFindNoticeByCollectionDesc(){
    refreshNoticeDBByType("collectionNum",true,true).then((data)=>{
        collectionDescFindGroup=data;
    })
    .catch(err=>{
        console.error(err);
    });
}

/**
 * 按排名刷新数据库映射
 */

 async function refreshNoticeDB(sortBy="createdAt",isDesc=false){
     return noticeinfodb.findAll({
        "order":[
            [sortBy,isDesc?"DESC":"ASC"]
        ]
     });
 }

 
 async function refreshNoticeDBByType(sortBy="createdAt",isDesc=false,isfind=true){
    return noticeinfodb.findAll({
       where:{
           isFind:isfind
       },
       "order":[
           [sortBy,isDesc?"DESC":"ASC"]
       ]
    });
}

function setNoticeRetData(retdata,group,pagenum,isDesc=true){
    let n=[],t=(pagenum-1)*9;
    if(isDesc){
        for(let i=0;i<9;i++){
            if(group[i+t]!=null){
                n[i]=group[i+t].dataValues;
            }
        }
    }else{
        let glen=group.length-1;
        for(let i=0;i<9;i++){
            if(group[i+t]!=null){
                n[i]=group[glen-(i+t)].dataValues;
            }
        }
    }
    retdata["n0_nid"]=n[0]!=null?n[0].id:null;
    retdata["n0_img"]=n[0]!=null && n[0].titlepage!=null?isPng(n[0].titlepage)?pngToBase64(n[0].titlepage):jpegToBase64(n[0].titlepage):jpegToBase64(defaultimg);
    retdata["n0_title"]=n[0]!=null?n[0].title:"已经没有告示了";
    retdata["n0_collectionnum"]=n[0]!=null?n[0].collectionNum:0;
    
    retdata["n1_nid"]=n[1]!=null?n[1].id:null;
    retdata["n1_img"]=n[1]!=null && n[1].titlepage!=null?isPng(n[1].titlepage)?pngToBase64(n[1].titlepage):jpegToBase64(n[1].titlepage):jpegToBase64(defaultimg);
    retdata["n1_title"]=n[1]!=null?n[1].title:"已经没有告示了";
    retdata["n1_collectionnum"]=n[1]!=null?n[1].collectionNum:0;
    
    retdata["n2_nid"]=n[2]!=null?n[2].id:null;
    retdata["n2_img"]=n[2]!=null && n[2].titlepage!=null?isPng(n[2].titlepage)?pngToBase64(n[2].titlepage):jpegToBase64(n[2].titlepage):jpegToBase64(defaultimg);
    retdata["n2_title"]=n[2]!=null?n[2].title:"已经没有告示了";
    retdata["n2_collectionnum"]=n[2]!=null?n[2].collectionNum:0;

    retdata["n3_nid"]=n[3]!=null?n[3].id:null;
    retdata["n3_img"]=n[3]!=null && n[3].titlepage!=null?isPng(n[3].titlepage)?pngToBase64(n[3].titlepage):jpegToBase64(n[3].titlepage):jpegToBase64(defaultimg);
    retdata["n3_title"]=n[3]!=null?n[3].title:"已经没有告示了";
    retdata["n3_collectionnum"]=n[3]!=null?n[3].collectionNum:0;

    retdata["n4_nid"]=n[4]!=null?n[4].id:null;
    retdata["n4_img"]=n[4]!=null && n[4].titlepage!=null?isPng(n[4].titlepage)?pngToBase64(n[4].titlepage):jpegToBase64(n[4].titlepage):jpegToBase64(defaultimg);
    retdata["n4_title"]=n[4]!=null?n[4].title:"已经没有告示了";
    retdata["n4_collectionnum"]=n[4]!=null?n[4].collectionNum:0;

    retdata["n5_nid"]=n[5]!=null?n[5].id:null;
    retdata["n5_img"]=n[5]!=null && n[5].titlepage!=null?isPng(n[5].titlepage)?pngToBase64(n[5].titlepage):jpegToBase64(n[5].titlepage):jpegToBase64(defaultimg);
    retdata["n5_title"]=n[5]!=null?n[5].title:"已经没有告示了";
    retdata["n5_collectionnum"]=n[5]!=null?n[5].collectionNum:0;

    retdata["n6_nid"]=n[6]!=null?n[6].id:null;
    retdata["n6_img"]=n[6]!=null && n[6].titlepage!=null?isPng(n[6].titlepage)?pngToBase64(n[6].titlepage):jpegToBase64(n[6].titlepage):jpegToBase64(defaultimg);
    retdata["n6_title"]=n[6]!=null?n[6].title:"已经没有告示了";
    retdata["n6_collectionnum"]=n[6]!=null?n[6].collectionNum:0;

    retdata["n7_nid"]=n[7]!=null?n[7].id:null;
    retdata["n7_img"]=n[7]!=null && n[7].titlepage!=null?isPng(n[7].titlepage)?pngToBase64(n[7].titlepage):jpegToBase64(n[7].titlepage):jpegToBase64(defaultimg);
    retdata["n7_title"]=n[7]!=null?n[7].title:"已经没有告示了";
    retdata["n7_collectionnum"]=n[7]!=null?n[7].collectionNum:0;

    retdata["n8_nid"]=n[8]!=null?n[8].id:null;
    retdata["n8_img"]=n[8]!=null && n[8].titlepage!=null?isPng(n[8].titlepage)?pngToBase64(n[8].titlepage):jpegToBase64(n[8].titlepage):jpegToBase64(defaultimg);
    retdata["n8_title"]=n[8]!=null?n[8].title:"已经没有告示了";
    retdata["n8_collectionnum"]=n[8]!=null?n[8].collectionNum:0;


}