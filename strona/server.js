const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient' });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serwowanie plików statycznych z folderu 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Konfiguracja bazy danych
const dbConfig = {
    user: 'rt_kbilka',
    password: 'abc123',
    connectString: 'oracle1.smcebi.us.edu.pl:1521/umain.smcebi.us.edu.pl'
};

// Obsługuje żądanie GET /register, zwracając plik HTML
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rejestracja.html'));  // Ścieżka do pliku HTML
});

// Obsługuje żądanie GET /login, zwracając plik HTML
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logowanie.html'));  // Ścieżka do pliku HTML
});

// Rejestracja użytkownika (POST)
app.post('/register', async (req, res) => {
    const { login, haslo } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        let result = await connection.execute('SELECT * FROM UZYTKOWNICY WHERE LOGIN = :login', [login]);
        if (result.rows.length > 0) {
            await connection.close();
            return res.status(400).json({ error: "Użytkownik o podanym loginie już istnieje!" });
        }

        let maxResult = await connection.execute('SELECT MAX(ID) FROM UZYTKOWNICY');
        let max_userid = (maxResult.rows[0][0] || 0) + 1;

        await connection.execute(
            'INSERT INTO UZYTKOWNICY (ID, LOGIN, HASLO) VALUES (:max_userid, :login, :haslo)',
            { max_userid, login, haslo },
            { autoCommit: true }
        );

        await connection.close();
        res.json({ message: "Użytkownik zarejestrowany!" });

    } catch (err) {
        console.error("❌ Błąd połączenia: ", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});

// Logowanie użytkownika (POST)
app.post('/login', async (req, res) => {
    const { login, haslo } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        let result = await connection.execute('SELECT * FROM UZYTKOWNICY WHERE LOGIN = :login AND HASLO = :haslo', [login, haslo]);

        if (result.rows.length === 0) {
            await connection.close();
            return res.status(400).json({ error: "Nieprawidłowy login lub hasło!" });
        }

        await connection.close();
        res.json({ message: "Zalogowano pomyślnie!" });

    } catch (err) {
        console.error("❌ Błąd połączenia: ", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});

// Uruchomienie serwera na porcie 3000
app.listen(3000, () => console.log('🚀 Serwer działa na http://localhost:3000'));
