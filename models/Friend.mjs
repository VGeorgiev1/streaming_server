
export default (sequelizeInstance, Sequelize)  => { 
    return sequelizeInstance.define('friends', {
        userId:  {type:Sequelize.INTEGER, primary_key:true},
        friendId: {type:Sequelize.INTEGER, primary_key:true},
        status:  Sequelize.STRING
    })
}