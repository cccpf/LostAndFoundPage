//https://blog.csdn.net/qq_24884131/article/details/100120679
//https://www.jianshu.com/p/797e10fe2393


const Sequelize = require('sequelize');
const sequelize = new Sequelize('LostAndFound','root','123456',
{
    host:'localhost',
    port:3306,
    dialect: 'mysql',
    pool: {   //连接池设置
        max: 5, //最大连接数
        min: 0, //最小连接数
        idle: 10000
    },
});

sequelize.authenticate().then(()=>{
    console.log('Connected');
}).catch(err=>{
    console.error('Connected failed');
});

const userinfotable = sequelize.define('UserInfo',{
    id:{
        type:Sequelize.STRING,
        primaryKey:true
    },

    password:{
        type:Sequelize.STRING,
        allowNull:false
    },

    img:{
        type:Sequelize.STRING,
        allowNull:true
    },

    loginquestion:{
        type:Sequelize.ENUM('lovername','fathername','mothername','favouritemovie','yourprimaryschool'),
        allowNull:false
    },

    loginanswer:{
        type:Sequelize.STRING,
        allowNull:false
    },

    name:{
        type:Sequelize.STRING,
        allowNull:true    
    },
    
    school:{
        type:Sequelize.STRING,
        allowNull:true
    },

    major:{
        type:Sequelize.STRING,
        allowNull:true
    },

    class:{
        type:Sequelize.STRING,
        allowNull:true
    },
})

sequelize.sync().then(()=>{

}).catch(err=>{

});

userinfotable.sync();

module.exports=userinfotable;