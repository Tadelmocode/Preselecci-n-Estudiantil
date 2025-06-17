const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const initDB = require('./database');

const app = express();

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Inicializar base de datos
let db;
initDB().then(database => {
    db = database;
    console.log('Base de datos conectada');
    initializeSubjects();
});

async function initializeSubjects() {
    const existingSubjects = await db.all('SELECT * FROM subjects');
    if (existingSubjects.length === 0) {
        await db.exec(`
            INSERT INTO subjects (name, code, quota) VALUES 
            ('Logica Matematica', 'MATH-101', 30),
            ('Matematica I', 'MATH-102', 30),
            ('Economia Digital', 'PHYS-101', 25),
            ('Fundamentos de la Informática', 'INFO-101', 25),
            ('Algoritmos I', 'MATH-103', 25),
            ('Matematica II', 'MATH-201', 30),
            ('Fisica I', 'INFO-201', 25),
            ('Arte y cultura', 'INFO-202', 25),
            ('Algoritmos II', 'ELEC-201', 20),
            ('Programacion I', 'MATH-202', 25),
            ('Fisica II', 'INFO-301', 25),
            ('Matematica III', 'INFO-302', 20),
            ('Programacion II', 'INFO-303', 25),
            ('Base de Datos', 'INFO-304', 25),
            ('Matematica IV', 'INFO-401', 20),
            ('Programacion III', 'INFO-402', 25),
            ('Estructuras Discretas II', 'INFO-403', 20),
            ('Organizacion del Computador', 'INFO-404', 25),
            ('Investigacion de Operaciones', 'INFO-501', 20),
            ('Metodos Numericos', 'INFO-502', 15);
        `);
        console.log('20 materias de ingeniería en informática insertadas');
    }
}

// Rutas
app.get('/', async (req, res) => {
    res.render('index', { 
        title: 'Preselección de Materias', 
        currentYear: new Date().getFullYear() 
    });
});

app.get('/register', async (req, res) => {
    const subjects = await db.all('SELECT * FROM subjects');
    res.render('register', { 
        title: 'Registro de Estudiante',
        subjects,
        error: null,
        currentYear: new Date().getFullYear()
    });
});

app.post('/register', async (req, res) => {
    const { studentId, name, email, selectedSubjects } = req.body;
    
    if (!studentId || !name || !email) {
        const subjects = await db.all('SELECT * FROM subjects');
        return res.render('register', { 
            title: 'Registro de Estudiante',
            subjects,
            error: 'Todos los campos son obligatorios',
            currentYear: new Date().getFullYear()
        });
    }
    
    if (!selectedSubjects || selectedSubjects.length === 0) {
        const subjects = await db.all('SELECT * FROM subjects');
        return res.render('register', { 
            title: 'Registro de Estudiante',
            subjects,
            error: 'Debes seleccionar al menos una materia',
            currentYear: new Date().getFullYear()
        });
    }
    
    try {
        await db.run('BEGIN TRANSACTION');
        const result = await db.run(
            'INSERT INTO students (studentId, name, email, registrationDate) VALUES (?, ?, ?, ?)',
            [studentId, name, email, new Date().toISOString()]
        );
        
        const studentIdDB = result.lastID;
        const subjectsArray = Array.isArray(selectedSubjects) ? selectedSubjects : [selectedSubjects];
        
        for (const subjectId of subjectsArray) {
            await db.run(
                'INSERT INTO student_subjects (student_id, subject_id) VALUES (?, ?)',
                [studentIdDB, subjectId]
            );
        }
        
        await db.run('COMMIT');
        res.redirect('/confirmation/' + studentId);
    } catch (error) {
        await db.run('ROLLBACK');
        
        if (error.message.includes('UNIQUE constraint failed')) {
            const subjects = await db.all('SELECT * FROM subjects');
            return res.render('register', { 
                title: 'Registro de Estudiante',
                subjects,
                error: 'Ya existe un registro con esta matrícula',
                currentYear: new Date().getFullYear()
            });
        }
        
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
});

app.get('/confirmation/:id', async (req, res) => {
    const student = await db.get(
        'SELECT * FROM students WHERE studentId = ?',
        [req.params.id]
    );
    
    if (!student) return res.redirect('/');
    
    const selectedSubjects = await db.all(`
        SELECT s.* FROM subjects s
        JOIN student_subjects ss ON s.id = ss.subject_id
        JOIN students st ON ss.student_id = st.id
        WHERE st.studentId = ?
    `, [req.params.id]);
    
    res.render('confirmation', { 
        title: 'Confirmación de Registro',
        student,
        subjects: selectedSubjects,
        currentYear: new Date().getFullYear()
    });
});

app.get('/stats', async (req, res) => {
    const stats = await db.all(`
        SELECT s.*, 
               COUNT(ss.student_id) as count,
               (s.quota - COUNT(ss.student_id)) as available
        FROM subjects s
        LEFT JOIN student_subjects ss ON s.id = ss.subject_id
        GROUP BY s.id
    `);
    
    const totalStudents = await db.get('SELECT COUNT(*) as total FROM students');
    
    res.render('stats', { 
        title: 'Estadísticas de Preselección',
        stats,
        totalStudents: totalStudents.total,
        currentYear: new Date().getFullYear()
    });
});

app.get('/admin', async (req, res) => {
    try {
        console.log("Accediendo a /admin"); // Debug 1
        
        // Verificar conexión a la base de datos
        if (!db) {
            console.error("Error: Base de datos no conectada");
            return res.status(500).send("Error de conexión a la base de datos");
        }

        // Debug: Verificar tablas existentes
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tablas disponibles:", tables); // Debug 2

        // Consulta modificada para compatibilidad con SQLite
        const students = await db.all(`
            SELECT s.id, s.studentId, s.name, s.email, s.registrationDate,
                   (SELECT GROUP_CONCAT(sub.name, '|') 
                    FROM subjects sub
                    JOIN student_subjects ss ON sub.id = ss.subject_id
                    WHERE ss.student_id = s.id) as subjects
            FROM students s
            ORDER BY s.registrationDate DESC
        `);
        console.log("Estudiantes obtenidos:", students.length); // Debug 3

        // Formatear datos
        const formattedStudents = students.map(student => ({
            ...student,
            subjects: student.subjects ? student.subjects.split('|').filter(s => s) : [],
            registrationDate: new Date(student.registrationDate).toLocaleDateString()
        }));

        // Obtener estadísticas (versión compatible con SQLite)
        const stats = await db.all(`
            SELECT sub.name, 
                   (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id = sub.id) as count,
                   sub.quota,
                   (sub.quota - (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id = sub.id)) as available
            FROM subjects sub
        `);

        res.render('admin', {
            title: 'Panel de Administración',
            students: formattedStudents,
            stats,
            currentYear: new Date().getFullYear()
        });
    } catch (error) {
        console.error('Error detallado en panel de admin:', error);
        res.status(500).send('Error al cargar el panel de administración: ' + error.message);
    }
});
// Ruta para eliminar estudiantes
app.delete('/admin/delete/:id', async (req, res) => {
    try {
        await db.run('BEGIN TRANSACTION');
        
        // Eliminar relaciones primero
        await db.run('DELETE FROM student_subjects WHERE student_id = ?', [req.params.id]);
        
        // Luego eliminar el estudiante
        await db.run('DELETE FROM students WHERE id = ?', [req.params.id]);
        
        await db.run('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error al eliminar:', error);
        res.status(500).send('Error al eliminar el registro');
    }
});
    
module.exports = app;

 