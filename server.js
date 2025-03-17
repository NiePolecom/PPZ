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

// Rejestracja użytkownika
app.post('/register', async (req, res) => {
    const { login, haslo, email } = req.body;

    if (!login || !haslo || !email) {
        return res.status(400).json({ error: "Brak loginu, hasła lub e-maila!" });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        // Sprawdzamy, czy login lub email już istnieją
        let result = await connection.execute(
            'SELECT LOGIN, EMAIL FROM UZYTKOWNICY WHERE LOGIN = :login OR EMAIL = :email',
            { login, email },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
            let errorMessage = '';
            if (result.rows.some(row => row.LOGIN === login)) {
                errorMessage = "Użytkownik o podanym loginie już istnieje!";
            } 
            if (result.rows.some(row => row.EMAIL === email)) {
                errorMessage = errorMessage ? errorMessage + " " : "";
                errorMessage += "Użytkownik o podanym e-mailu już istnieje!";
            }
            return res.status(400).json({ error: errorMessage });
        }

        // Pobieramy maksymalne ID użytkownika
        let maxResult = await connection.execute('SELECT NVL(MAX(ID), 0) + 1 FROM UZYTKOWNICY');
        let max_userid = maxResult.rows[0][0];

        // Dodajemy nowego użytkownika do bazy danych
        await connection.execute(
            'INSERT INTO UZYTKOWNICY (ID, LOGIN, HASLO, EMAIL) VALUES (:max_userid, :login, :haslo, :email)',
            { max_userid, login, haslo, email },
            { autoCommit: true }
        );

        // Automatyczne logowanie po rejestracji
        req.session.user = { id: max_userid, login };
        res.json({ message: "Użytkownik zarejestrowany i zalogowany!" });

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

        // Zapytanie, które sprawdza zarówno login, jak i email
        let result = await connection.execute(
            'SELECT ID, HASLO FROM UZYTKOWNICY WHERE LOGIN = :login OR EMAIL = :login',
            { login },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log("Wynik zapytania SQL:", result.rows);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Nieprawidłowy login lub hasło!" });
        }

        const storedPassword = result.rows[0].HASLO;

        // Porównanie hasła (w przypadku jawnego hasła)
        if (storedPassword !== haslo) {
            return res.status(400).json({ error: "Nieprawidłowy login lub hasło!" });
        }

        req.session.user = { id: result.rows[0].ID, login };
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

const nodemailer = require('nodemailer'); // Dodajemy moduł do wysyłki maili

// Endpoint do resetowania hasła
app.post('/forgot-password', async (req, res) => {
    const { login } = req.body;

    if (!login) {
        return res.status(400).json({ error: "Podaj login lub e-mail!" });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log("✅ Połączono z bazą danych!");

        // Pobieramy dane użytkownika na podstawie loginu lub e-maila
        let result = await connection.execute(
            'SELECT EMAIL, HASLO FROM UZYTKOWNICY WHERE LOGIN = :login OR EMAIL = :login',
            { login },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Nie znaleziono użytkownika!" });
        }

        const userEmail = result.rows[0].EMAIL;
        const userPassword = result.rows[0].HASLO;

        // Konfiguracja transportera do wysyłki maili
        let transporter = nodemailer.createTransport({
            service: 'gmail', // Można zmienić na SMTP innego dostawcy
            auth: {
                user: 'twojemail@gmail.com', // Zmień na swój e-mail
                pass: 'twojehaslo' // 🔴 Zmień na swoje hasło (lub użyj zmiennych środowiskowych!)
            }
        });

        // Treść maila
        let mailOptions = {
            from: 'twojemail@gmail.com',
            to: userEmail,
            subject: 'Resetowanie hasła',
            text: `Twoje hasło to: ${userPassword}`
        };

        // Wysłanie maila
        await transporter.sendMail(mailOptions);

        res.json({ message: "E-mail z hasłem został wysłany!" });

    } catch (err) {
        console.error("❌ Błąd połączenia: ", err);
        res.status(500).json({ error: "Błąd serwera" });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

