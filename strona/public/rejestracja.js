document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    var login = document.getElementById("login").value;
    var haslo = document.getElementById("haslo").value;
    var confirmPassword = document.getElementById("phaslo").value;
    var errorMessage = document.getElementById("error-message");

    if (haslo !== confirmPassword) {
        errorMessage.textContent = "Hasła nie są zgodne!";
        return;
    }
    errorMessage.textContent = "";

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
});
