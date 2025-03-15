document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    var login = document.getElementById("login").value.trim();
    var haslo = document.getElementById("haslo").value.trim();
    var confirmPassword = document.getElementById("phaslo").value.trim();
    var errorMessage = document.getElementById("error-message");

    if (!errorMessage) {
        // Dodaj element do wyświetlania błędów, jeśli nie istnieje
        errorMessage = document.createElement("p");
        errorMessage.id = "error-message";
        errorMessage.style.color = "red";
        document.getElementById("registerForm").appendChild(errorMessage);
    }

    if (haslo !== confirmPassword) {
        errorMessage.textContent = "Hasła nie są zgodne!";
        return;
    }
    errorMessage.textContent = "";

    try {
        let response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ login, haslo })
        });

        let result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.href = "index.html"; // Przekierowanie po rejestracji
        } else {
            errorMessage.textContent = result.error;
        }
    } catch (error) {
        errorMessage.textContent = "Błąd połączenia z serwerem.";
    }
});
