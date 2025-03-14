document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Zatrzymanie domyślnej akcji formularza

        const login = document.getElementById("login").value.trim();
        const haslo = document.getElementById("haslo").value.trim();

        if (!login || !haslo) {
            showPopup("Wpisz login i hasło!");
            return;
        }

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, haslo })
            });

            const result = await response.json();
            console.log("📥 Odpowiedź serwera:", result);

            if (response.ok) {
                showPopup(result.message, () => {
                    setTimeout(() => {
                        window.location.href = "index.html"; // Zmienione na index.html
                    }, 1000); // Zrób opóźnienie np. 1 sekunda
                });
            } else {
                showPopup(result.error || "Błąd logowania!");
            }
        } catch (error) {
            console.error("❌ Błąd sieci:", error);
            showPopup("Błąd połączenia z serwerem.");
        }
    });

    function showPopup(message, callback) {
        console.log("Pokazuję popup z wiadomością:", message); // Debugowanie

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
