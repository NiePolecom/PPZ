document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Zatrzymanie domyślnego działania formularza

        const login = document.getElementById("login").value.trim();
        const haslo = document.getElementById("haslo").value.trim();
        const phaslo = document.getElementById("phaslo").value.trim();
        const email = document.getElementById("email").value.trim();

        let errorMessage = document.getElementById("error-message");

        if (!errorMessage) {
            errorMessage = document.createElement("p");
            errorMessage.id = "error-message";
            errorMessage.style.color = "red";
            document.getElementById("registerForm").appendChild(errorMessage);
        }

        // Walidacja haseł
        if (haslo !== phaslo) {
            errorMessage.textContent = "Hasła muszą się zgadzać!";
            return;
        }

        if (!haslo || !phaslo) {
            errorMessage.textContent = "Proszę wprowadzić hasło!";
            return;
        }

        if (!email) {
            errorMessage.textContent = "E-mail jest wymagany!";
            return;
        }

        errorMessage.textContent = ""; // Czyścimy błędy jeśli wszystko ok

        try {
            let response = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, haslo, email })
            });

            let result = await response.json();

            if (response.ok) {
                showPopup("Rejestracja zakończona sukcesem!", () => {
                    window.location.href = "index.html";
                });
            } else {
                showPopup(result.error);
            }
        } catch (error) {
            showPopup("Błąd połączenia z serwerem.");
        }
    });

    // Funkcja popup
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
