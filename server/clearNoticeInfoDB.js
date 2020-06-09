const table = require('./createNoticeInfoDB');
const fs=require("fs");

//ranklist.sync({forse:true});
table.destroy({
    where:{}
}).then(function(result){
    console.log("clear NoticeInfoDB success");
}).catch(function(err){
    console.error("clear NoticeInfoDB failed");
})

let filepath="./imglib";
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