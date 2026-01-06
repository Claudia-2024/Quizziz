// import { createPool } from "mysql2";

import { Sequelize } from "sequelize";

// const pool = mysql.createPool({
//     host: "localhost",
//     user: "app_user",
//     password: process.env.DB_PASSWORD,
//     database: 'quizziz_db'
// });

//Creating an instance of sequelize(which communicates with the database)
// const sequelize = new Sequelize({
//     database: 'postgres',
//     username: 'postgres',
//     password: 'mango205',
//     host: 'localhost',
//     port: 5432,
//     dialect: 'postgres',
// });
const sequelize = new Sequelize({
    database: 'quizziz_db',
    username: 'root',
    password: 'claudia@2603',
    host: 'localhost',
    port: 3308,
    dialect: 'mysql',
});

//Test the database connection
sequelize.authenticate().then(() => {
    console.log("Connection to the database has been established successfully");
}).catch(err => {
    console.error("Unable to connect to the database: ", err);
});

export default sequelize;
