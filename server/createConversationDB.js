
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

const conversationtable = sequelize.define('Conversation',{
    nid:{
        type:Sequelize.STRING,
        references:{
            model:"NoticeInfos",
            key:"id"
        },
        primaryKey:true
    },

    ownerid:{
        type:Sequelize.STRING,
        references:{
            model:"UserInfos",
            key:"id"
        },
        primaryKey:true
    },

    userid:{
        type:Sequelize.STRING,
        references:{
            model:"UserInfos",
            key:"id"
        },
        primaryKey:true
    },

    conversation:{
        type:Sequelize.TEXT,
    },
})

sequelize.sync().then(()=>{

}).catch(err=>{

});

conversationtable.sync();

module.exports=conversationtable;