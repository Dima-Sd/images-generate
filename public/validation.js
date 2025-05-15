document.querySelector(".form").addEventListener("submit", function (e) {
    e.preventDefault();
    let isValid = true;

    document.querySelectorAll(".form__input").forEach(input => {
        input.style.backgroundColor = "";
        input.nextElementSibling?.remove();
    });

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (!email.value.trim()) {
        showError(email, "Email не може бути порожнім");
        isValid = false;
    } else if (!email.value.includes("@")) {
        showError(email, "Некоректний email");
        isValid = false;
    }

    if (!password.value.trim()) {
        showError(password, "Пароль не може бути порожнім");
        isValid = false;
    } else if (password.value.length < 6) {
        showError(password, "Пароль має містити мінімум 6 символів");
        isValid = false;
    }

    if (isValid) {
        e.target.submit();
    }

    function showError(input, message) {
        input.style.backgroundColor = "#fdd";
        const error = document.createElement("div");
        error.style.color = "red";
        error.style.fontSize = "0.9em";
        error.textContent = message;
        input.insertAdjacentElement("afterend", error);
    }
});
