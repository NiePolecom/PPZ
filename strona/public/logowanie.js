document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    var login = document.getElementById("login").value;
    var haslo = document.getElementById("haslo").value;
    var errorMessage = document.getElementById("error-message");

    // Clear previous error message
    errorMessage.textContent = "";

    let response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ login, haslo })
    });

    let result = await response.json();
    if (response.ok) {
        alert(result.message);
        window.location.href = "dashboard.html"; // Redirect to the user dashboard after successful login
    } else {
        errorMessage.textContent = result.error;
    }
});
