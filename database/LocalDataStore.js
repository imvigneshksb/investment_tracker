const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Local Database Service that mimics Zoho Catalyst DataStore
 * Provides seamless transition from local development to Catalyst production
 */
class LocalDataStore {
  constructor() {
    this.dbPath = path.join(__dirname, 'investment_tracker.db');
    this.db = null;
  }

  // Initialize database and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        console.log('✅ Local SQLite database connected (mimicking Catalyst DataStore)');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  // Create tables identical to Catalyst DataStore structure
  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS Users (
        ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPortfoliosTable = `
      CREATE TABLE IF NOT EXISTS Portfolios (
        ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        portfolio_data TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(email)
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email)',
      'CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON Portfolios(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_portfolios_updated ON Portfolios(last_updated)'
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating Users table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createPortfoliosTable, (err) => {
          if (err) {
            console.error('Error creating Portfolios table:', err);
            reject(err);
            return;
          }
        });

        // Create indexes
        createIndexes.forEach(indexQuery => {
          this.db.run(indexQuery, (err) => {
            if (err) {
              console.error('Error creating index:', err);
            }
          });
        });

        console.log('✅ Database tables created (Users, Portfolios)');
        resolve();
      });
    });
  }

  // Mimic Catalyst table() method
  table(tableName) {
    return new LocalTable(this.db, tableName);
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

/**
 * Local Table class that mimics Catalyst Table operations
 */
class LocalTable {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  // Insert row (mimic Catalyst insertRow)
  async insertRow(data) {
    return new Promise((resolve, reject) => {
      if (this.tableName === 'Users') {
        const { email, password, name, created_at } = data;
        const query = `
          INSERT INTO Users (email, password, name, created_at)
          VALUES (?, ?, ?, ?)
        `;
        const values = [email, password, name, created_at || new Date().toISOString()];

        this.db.run(query, values, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ROWID: this.lastID,
            email,
            password,
            name,
            created_at: created_at || new Date().toISOString()
          });
        });
      } else if (this.tableName === 'Portfolios') {
        const { user_id, portfolio_data, last_updated } = data;
        const query = `
          INSERT INTO Portfolios (user_id, portfolio_data, last_updated)
          VALUES (?, ?, ?)
        `;
        const values = [
          user_id,
          typeof portfolio_data === 'string' ? portfolio_data : JSON.stringify(portfolio_data),
          last_updated || new Date().toISOString()
        ];

        this.db.run(query, values, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            ROWID: this.lastID,
            user_id,
            portfolio_data: values[1],
            last_updated: values[2]
          });
        });
      } else {
        reject(new Error(`Table ${this.tableName} not supported`));
      }
    });
  }

  // Update row (mimic Catalyst updateRow)
  async updateRow(criteria, data) {
    return new Promise((resolve, reject) => {
      if (this.tableName === 'Portfolios') {
        const query = `
          UPDATE Portfolios 
          SET portfolio_data = ?, last_updated = ?
          WHERE user_id = ?
        `;
        const values = [
          typeof data.portfolio_data === 'string' ? data.portfolio_data : JSON.stringify(data.portfolio_data),
          new Date().toISOString(),
          criteria.user_id
        ];

        this.db.run(query, values, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            changes: this.changes,
            user_id: criteria.user_id
          });
        });
      } else {
        reject(new Error(`Update not implemented for table ${this.tableName}`));
      }
    });
  }

  // Search records (mimic Catalyst search)
  async search(query) {
    return new Promise((resolve, reject) => {
      // Convert simplified query to SQL
      let sqlQuery = query;
      
      // Handle common patterns
      if (query.includes("WHERE email=")) {
        const emailMatch = query.match(/WHERE email='([^']+)'/);
        if (emailMatch && this.tableName === 'Users') {
          sqlQuery = 'SELECT * FROM Users WHERE email = ?';
          this.db.all(sqlQuery, [emailMatch[1]], (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(rows || []);
          });
          return;
        }
      }

      if (query.includes("WHERE user_id=")) {
        const userIdMatch = query.match(/WHERE user_id='([^']+)'/);
        if (userIdMatch && this.tableName === 'Portfolios') {
          sqlQuery = 'SELECT * FROM Portfolios WHERE user_id = ? ORDER BY last_updated DESC LIMIT 1';
          this.db.all(sqlQuery, [userIdMatch[1]], (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(rows || []);
          });
          return;
        }
      }

      // Fallback for direct SQL
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  // Delete records (mimic Catalyst deleteRows)
  async deleteRows(criteria) {
    return new Promise((resolve, reject) => {
      if (this.tableName === 'Users' && criteria.email) {
        // Delete user and their portfolios
        this.db.serialize(() => {
          this.db.run('DELETE FROM Portfolios WHERE user_id = ?', [criteria.email]);
          this.db.run('DELETE FROM Users WHERE email = ?', [criteria.email], function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ deletedRows: this.changes });
          });
        });
      } else {
        reject(new Error(`Delete criteria not supported for table ${this.tableName}`));
      }
    });
  }
}

module.exports = LocalDataStore;
