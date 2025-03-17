document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const loginInput = document.getElementById("login");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    const forgotPasswordLink = document.getElementById("forgotPassword"); // Dodany link "Zapomniałem hasła"

    // Sprawdzenie, czy dane są zapisane w localStorage
    if (localStorage.getItem("login")) {
        loginInput.value = localStorage.getItem("login");
        rememberMeCheckbox.checked = true;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Zatrzymanie domyślnej akcji formularza

        const login = loginInput.value.trim();
        const haslo = document.getElementById("haslo").value.trim();

        if (rememberMeCheckbox.checked) {
            localStorage.setItem("login", login); // Zapisywanie loginu w localStorage
        } else {
            localStorage.removeItem("login"); // Usuwanie loginu, jeśli checkbox niezaznaczony
        }

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, haslo })
            });

            const data = await response.json();

            if (response.ok && data.message === "Zalogowano pomyślnie!") {
                showPopup("Zalogowano pomyślnie!", function () {
                    window.location.href = "index.html";
                });
            } else {
                showPopup(data.error || "Wystąpił błąd podczas logowania!");
            }

        } catch (error) {
            showPopup("Błąd połączenia z serwerem!");
        }
    });

    // 🔹 Obsługa "Zapomniałem hasła?"
    forgotPasswordLink.addEventListener("click", async function (event) {
        event.preventDefault();

        const login = prompt("Podaj swój login lub e-mail:");

        if (!login) return;

        try {
            const response = await fetch("/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login })
            });

            const data = await response.json();

            if (response.ok) {
                showPopup("E-mail z hasłem został wysłany!");
            } else {
                showPopup(data.error || "Wystąpił błąd!");
            }

        } catch (error) {
            showPopup("Błąd połączenia z serwerem!");
        }
    });

    function showPopup(message, callback) {
        let popup = document.createElement("div");
        popup.innerHTML = `
            <div class="popup-overlay">
                <div class="popup-content">
                    <p>${message}</p>
                    <button id="closePopup">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById("closePopup").addEventListener("click", function () {
            popup.remove();
            if (callback) callback();
        });
    }
});
