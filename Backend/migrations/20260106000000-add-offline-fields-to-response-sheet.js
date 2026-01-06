// Backend/migrations/[timestamp]-add-offline-fields-to-response-sheet.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.addColumn('ResponseSheets', 'attemptLocalId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID local généré côté mobile pour matcher les réponses offline'
    });

    await queryInterface.addColumn('ResponseSheets', 'isOfflineSubmission', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Indique si cette soumission provenait du mode offline'
    });

    await queryInterface.addColumn('ResponseSheets', 'offlineSubmittedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp quand la soumission a eu lieu côté client (offline)'
    });

    await queryInterface.addColumn('ResponseSheets', 'syncedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp quand les données offline ont été synchronisées au serveur'
    });

    await queryInterface.addColumn('ResponseSheets', 'status', {
      type: Sequelize.ENUM('in-progress', 'submitted', 'synced'),
      defaultValue: 'in-progress',
      comment: 'Statut: in-progress | submitted (offline) | synced'
    });

    // Create index for attemptLocalId for fast lookups
    await queryInterface.addIndex('ResponseSheets', ['attemptLocalId'], {
      name: 'idx_responsesheet_attemptlocalid'
    });

    // Create indexes for offline queries
    await queryInterface.addIndex('ResponseSheets', ['isOfflineSubmission'], {
      name: 'idx_responsesheet_offline'
    });

    await queryInterface.addIndex('ResponseSheets', ['syncedAt'], {
      name: 'idx_responsesheet_synced'
    });

    await queryInterface.addIndex('ResponseSheets', ['status'], {
      name: 'idx_responsesheet_status'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.removeIndex('ResponseSheets', 'idx_responsesheet_attemptlocalid');
    await queryInterface.removeIndex('ResponseSheets', 'idx_responsesheet_offline');
    await queryInterface.removeIndex('ResponseSheets', 'idx_responsesheet_synced');
    await queryInterface.removeIndex('ResponseSheets', 'idx_responsesheet_status');

    await queryInterface.removeColumn('ResponseSheets', 'attemptLocalId');
    await queryInterface.removeColumn('ResponseSheets', 'isOfflineSubmission');
    await queryInterface.removeColumn('ResponseSheets', 'offlineSubmittedAt');
    await queryInterface.removeColumn('ResponseSheets', 'syncedAt');
    await queryInterface.removeColumn('ResponseSheets', 'status');
  }
};

