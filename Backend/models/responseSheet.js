import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ResponseSheet = sequelize.define('ResponseSheet', {
    responseSheetId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    serverStartTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    clientStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    gradingStatus: {
        type: DataTypes.ENUM("IN_PROGRESS", "AUTO_GRADED", "VALIDATED"),
        defaultValue: "IN_PROGRESS"
    },
    // Nouveaux champs pour support offline
    attemptLocalId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID local généré côté mobile pour matcher les réponses offline'
    },
    isOfflineSubmission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si cette soumission provenait du mode offline'
    },
    offlineSubmittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp quand la soumission a eu lieu côté client (offline)'
    },
    syncedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp quand les données offline ont été synchronisées au serveur'
    },
    status: {
        type: DataTypes.ENUM("in-progress", "submitted", "synced"),
        defaultValue: "in-progress",
        comment: 'Statut: in-progress | submitted (offline) | synced'
    }

})

export default ResponseSheet;