
export default (sequelizeInstance, Sequelize)=>{ 
    return sequelizeInstance.define('session', {
        userId:  Sequelize.INTEGER,
        sessionToken: {
            type: Sequelize.STRING(60), unique: true
        }
    })
}