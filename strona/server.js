const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient' });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Używanie sesji
app.use(session({
    secret: 'tajny-klucz',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // W produkcji ustaw na true, jeśli używasz HTTPS
}));

// Serwowanie plików statycznych
app.use(express.static(path.join(__dirname, 'public')));

// Konfiguracja bazy danych
const dbConfig = {
    user: 'rt_kbilka',
    password: 'abc123',
    connectString: 'oracle1.smcebi.us.edu.pl:1521/umain.smcebi.us.edu.pl'
};

// 📝 Zwrot formularzy rejestracji i logowania
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'rejestracja.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'logowanie.html')));

// 🔹 Rejestracja użytkownika
app.post('/register', async (req, res) => {
    const { login, haslo } = req.body;

    if (!login || !haslo) {
        return res.status(400).json({ error: "Brak loginu lub hasła!" });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        let result = await connection.execute(
            'SELECT LOGIN FROM UZYTKOWNICY WHERE LOGIN = :login',
            { login }
        );

        if (result.rows.length > 0) {
            return res.status(400).json({ error: "Użytkownik o podanym loginie już istnieje!" });
        }

        let maxResult = await connection.execute('SELECT NVL(MAX(ID), 0) + 1 FROM UZYTKOWNICY');
        let max_userid = maxResult.rows[0][0];

        await connection.execute(
            'INSERT INTO UZYTKOWNICY (ID, LOGIN, HASLO) VALUES (:max_userid, :login, :haslo)',
            { max_userid, login, haslo },
            { autoCommit: true }
        );

        res.json({ message: "Użytkownik zarejestrowany!" });

    } catch (err) {
        console.error("❌ Błąd połączenia: ", err);
        res.status(500).json({ error: "Błąd serwera" });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 🔹 Logowanie użytkownika
app.post('/login', async (req, res) => {
    const { login, haslo } = req.body;

    if (!login || !haslo) {
        return res.status(400).json({ error: "Brak loginu lub hasła!" });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        let result = await connection.execute(
            'SELECT ID FROM UZYTKOWNICY WHERE LOGIN = :login AND HASLO = :haslo',
            { login, haslo }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Nieprawidłowy login lub hasło!" });
        }

        req.session.user = { id: result.rows[0][0], login };
        res.json({ message: "Zalogowano pomyślnie!" });

    } catch (err) {
        console.error("❌ Błąd połączenia: ", err);
        res.status(500).json({ error: "Błąd serwera" });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 🔹 Sprawdzenie statusu logowania
app.get('/isLoggedIn', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// 🔹 Wylogowanie
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Wylogowano!" });
    });
});

// 🔹 Uruchomienie serwera
app.listen(3000, () => console.log('🚀 Serwer działa na http://localhost:3000'));
