export default (sequelizeInstance, Sequelize) => { 
    return sequelizeInstance.define('rules', {
        id: {type: Sequelize.INTEGER, primaryKey: true , autoIncrement: true},
        audio: Sequelize.BOOLEAN,
        video: Sequelize.BOOLEAN,
        screen: Sequelize.BOOLEAN
    })
}