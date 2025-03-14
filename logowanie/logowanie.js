function logowanie() {
    var login = document.getElementById("login").value;
    var haslo = document.getElementById("haslo").value;
    if (login == "admin" && haslo == "admin") {
        window.location.href = "index.html";
    } else {
        alert("Błędne dane logowania");
    }
}