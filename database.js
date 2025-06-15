const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function initDB() {
    const db = await open({
        filename: './preseleccion.db',
        driver: sqlite3.Database
    });

    // Crear tablas si no existen
    await db.exec(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT UNIQUE,
            name TEXT,
            email TEXT,
            registrationDate TEXT
        );
        
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            code TEXT UNIQUE,
            quota INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS student_subjects (
            student_id INTEGER,
            subject_id INTEGER,
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(subject_id) REFERENCES subjects(id),
            PRIMARY KEY(student_id, subject_id)
        );
    `);

    return db;
}

module.exports = initDB;