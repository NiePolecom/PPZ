function rejestracja(username, password) {
    if (!username || !password) {
        console.log("Username and password are required.");
        return;
    }

    // Simulate saving user to a database
    const user = {
        username: username,
        password: password // In a real application, make sure to hash the password before saving
    };

    console.log("User registered successfully:", user);
}