import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Class = sequelize.define('Class', {
    classId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    totalStudents: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }

},
{
    indexes: [
    {
      unique: true,
      fields: ["level", "department"]
    }
  ]
})

export default Class;