
const visitForm = document.getElementById("visitForm");
const successMessage = document.getElementById("successMessage");

visitForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const visitorData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        age: document.getElementById("age").value,
        qualification: document.getElementById("qualification").value,
        district: document.getElementById("district").value.trim(),
        purpose: document.getElementById("purpose").value,
        course: document.getElementById("course").value,
        feedback: document.getElementById("feedback").value
    };

    successMessage.style.display = "block";
    successMessage.textContent = "Submitting your details...";

    try {
        const response = await fetch("http://localhost:5000/api/visitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitorData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Submission failed");
        }

        successMessage.textContent =
            `Thank you, ${visitorData.name}! Your details have been saved.`;

        visitForm.reset();
    } catch (error) {
        successMessage.textContent =
            "Submission failed. Please check the server.";
        console.error(error);
    }
});
