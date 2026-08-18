import { runStorageMigration } from '../services/migration';
import { closeDatabase } from '../db/mongo';

async function main() {
  console.log('====================================================');
  console.log('   SATHWIK PORTFOLIO MONGODB STORAGE MIGRATION CLI  ');
  console.log('====================================================');

  try {
    const report = await runStorageMigration(true);
    console.log('\nMigration completed successfully!\n');
    console.log('Report Details:');
    console.log('────────────────────────────────────────');
    console.log(`Timestamp:        ${report.timestamp}`);
    console.log(`Database Version: v${report.databaseVersion}`);
    console.log(`Projects:         Existing Mongo: ${report.details.projects.existingMongo} | Local: ${report.details.projects.localSource} | Final: ${report.details.projects.mergedFinal}`);
    console.log(`Creative Work:    Existing Mongo: ${report.details.creative.existingMongo} | Local: ${report.details.creative.localSource} | Final: ${report.details.creative.mergedFinal}`);
    console.log(`Journey Steps:    Existing Mongo: ${report.details.journey.existingMongo} | Local: ${report.details.journey.localSource} | Final: ${report.details.journey.mergedFinal}`);
    console.log(`Certificates:     Existing Mongo: ${report.details.gallery.existingMongo} | Local: ${report.details.gallery.localSource} | Final: ${report.details.gallery.mergedFinal}`);
    console.log(`Resumes:          Existing Mongo: ${report.details.resumes.existingMongo} | Local: ${report.details.resumes.localSource} | Final: ${report.details.resumes.mergedFinal}`);
    console.log(`Inbox Messages:   Existing Mongo: ${report.details.messages.existingMongo} | Local: ${report.details.messages.localSource} | Final: ${report.details.messages.mergedFinal}`);
    console.log('────────────────────────────────────────');
  } catch (error: any) {
    console.error('\n[Migration Error]:', error.message || error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
    process.exit(process.exitCode || 0);
  }
}

main();
