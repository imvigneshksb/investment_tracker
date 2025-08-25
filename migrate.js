const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const LocalDataStore = require('./database/LocalDataStore');

/**
 * Migration script to transfer data from userData.json to SQLite database
 * This ensures seamless transition from old file-based storage to new database
 */
async function migrateUserData() {
  console.log('🔄 Starting user data migration...');
  
  try {
    // Initialize database
    const dataStore = new LocalDataStore();
    await dataStore.initialize();
    
    // Read existing userData.json
    const userDataPath = path.join(__dirname, 'client', 'userData.json');
    let userData;
    
    try {
      const data = await fs.readFile(userDataPath, 'utf8');
      userData = JSON.parse(data);
    } catch (error) {
      console.log('📝 No existing userData.json found - starting fresh');
      return;
    }
    
    if (!userData.users || Object.keys(userData.users).length === 0) {
      console.log('📝 No users found in userData.json');
      return;
    }
    
    console.log(`👥 Found ${Object.keys(userData.users).length} users to migrate`);
    
    // Migrate each user
    const usersTable = dataStore.table('Users');
    const portfoliosTable = dataStore.table('Portfolios');
    
    for (const [email, user] of Object.entries(userData.users)) {
      try {
        console.log(`📋 Migrating user: ${email}`);
        
        // Hash password if it's not already hashed
        let hashedPassword = user.password;
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          hashedPassword = await bcrypt.hash(user.password, 12);
          console.log(`🔐 Password hashed for ${email}`);
        }
        
        // Create user record
        const userRecord = {
          email: email,
          password: hashedPassword,
          name: user.fullName || user.name || 'User',
          created_at: user.created_at || new Date().toISOString()
        };
        
        // Save user to database
        await usersTable.insertRow(userRecord);
        console.log(`✅ User ${email} migrated successfully`);
        
        // Migrate portfolio if exists
        if (user.portfolio) {
          const portfolioRecord = {
            user_id: email,
            portfolio_data: JSON.stringify(user.portfolio),
            last_updated: user.last_updated || new Date().toISOString()
          };
          
          await portfoliosTable.insertRow(portfolioRecord);
          console.log(`📊 Portfolio for ${email} migrated successfully`);
        }
        
      } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
          console.log(`⚠️ User ${email} already exists in database - skipping`);
        } else {
          console.error(`❌ Error migrating user ${email}:`, error);
        }
      }
    }
    
    // Backup original file
    const backupPath = path.join(__dirname, 'client', `userData_backup_${Date.now()}.json`);
    await fs.copyFile(userDataPath, backupPath);
    console.log(`💾 Original userData.json backed up to: ${path.basename(backupPath)}`);
    
    console.log('✅ Migration completed successfully!');
    console.log('🎯 Database is now ready for seamless Catalyst deployment');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUserData().then(() => {
    process.exit(0);
  });
}

module.exports = migrateUserData;
