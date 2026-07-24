"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add isBanned column if it does not exist
    const tableDescription = await queryInterface.describeTable("Users");

    if (!tableDescription.isBanned) {
      await queryInterface.addColumn("Users", "isBanned", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // Migrate ENUM role: 'owner' -> 'hotel_owner'
    // PostgreSQL: rename enum value if the old value exists
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'enum_Users_role'
              AND e.enumlabel = 'owner'
          ) THEN
            ALTER TYPE "enum_Users_role" RENAME VALUE 'owner' TO 'hotel_owner';
          END IF;
        END
        $$;
      `);
    } catch (error) {
      // If the enum type name differs or value already renamed, continue
      console.warn(
        "Role enum migration note:",
        error.message,
      );
    }

    // Ensure all required enum values exist
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'enum_Users_role'
              AND e.enumlabel = 'hotel_owner'
          ) THEN
            ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'hotel_owner';
          END IF;
        END
        $$;
      `);
    } catch (error) {
      console.warn("hotel_owner enum ensure note:", error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Users");

    if (tableDescription.isBanned) {
      await queryInterface.removeColumn("Users", "isBanned");
    }

    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'enum_Users_role'
              AND e.enumlabel = 'hotel_owner'
          ) THEN
            ALTER TYPE "enum_Users_role" RENAME VALUE 'hotel_owner' TO 'owner';
          END IF;
        END
        $$;
      `);
    } catch (error) {
      console.warn("Role enum rollback note:", error.message);
    }
  },
};
