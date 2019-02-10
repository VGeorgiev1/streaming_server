
export default (sequelizeInstance, Sequelize)  => { 
    return sequelizeInstance.define('rooms', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        owner: Sequelize.INTEGER,
        type: Sequelize.STRING(15),
        name: Sequelize.STRING(40),
        rulesId: Sequelize.INTEGER
    })
}