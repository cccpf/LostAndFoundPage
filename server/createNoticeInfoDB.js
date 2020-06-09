
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

const noticeinfotable = sequelize.define('NoticeInfo',{
    id:{
        type:Sequelize.STRING,
        primaryKey:true
    },

    title:{
        type:Sequelize.STRING,
        allowNull:false
    },

    userid:{
        type:Sequelize.STRING,
        references:{
            model:"UserInfos",
            key:"id"
        },
        allowNull:false
    },
    titlepage:{
        type:Sequelize.STRING,
        allowNull:true
    },
    imgpath:{
        type:Sequelize.STRING,
        allowNull:true
    },

    intro:{
        type:Sequelize.STRING,
        allowNull:true
    },

    isFind:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    },

    collectionNum:{
        type:Sequelize.INTEGER,
        allowNull:false
    },

    readNum:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
})

sequelize.sync().then(()=>{

}).catch(err=>{

});

noticeinfotable.sync();

module.exports=noticeinfotable;