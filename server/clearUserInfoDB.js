const table = require('./createUserInfoDB');
const fs=require("fs");

//ranklist.sync({forse:true});
table.destroy({
    where:{}
}).then(function(result){
    console.log("clear UserInfoDB success");
}).catch(function(err){
    console.error("clear UserInfoDB failed");
})

let filepath="./touxiang";
clearDir(filepath);
if(!fs.existsSync(filepath+"/temp")){
    fs.mkdirSync(filepath+"/temp");
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