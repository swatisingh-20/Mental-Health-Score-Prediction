
const form = document.getElementById("predictionForm");
const resultSection = document.getElementById("resultSection");
const scoreValue = document.getElementById("scoreValue");
const scoreMessage = document.getElementById("scoreMessage");
const gaugeNeedle = document.getElementById("gaugeNeedle");

// Gauge score range: 0 to 10
function updateGauge(score) {
    const minScore = 0;
    const maxScore = 10;

    // Keep score within 0–10
    const safeScore = Math.max(minScore, Math.min(maxScore, score));

    // Convert score to gauge angle
    const angle = -90 + (safeScore / 10) * 180;

    // Rotate gauge needle
    if (gaugeNeedle) {
        gaugeNeedle.setAttribute(
            "transform",
            `rotate(${angle} 160 165)`
        );
    }

    // Show original model score out of 10
    if (scoreValue) {
        scoreValue.textContent = safeScore.toFixed(1) + "/10";
    }
}

// Display prediction result
function showResult(score) {
    updateGauge(score);

    if (scoreMessage) {
        scoreMessage.textContent =
            "Your predicted mental health score is displayed on a 0–10 scale.";
    }

    if (resultSection) {
        resultSection.hidden = false;
        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }
}

// Send form data to FastAPI
if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Predicting...";
            }

            const formData = new FormData(form);
            const data = {};

            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Convert numeric inputs to numbers
            const numericFields = [
                "Age",
                "Avg_Daily_Usage_Hours",
                "Daily_Unlocks",
                "Study_Hours",
                "Physical_Activity_Hours",
                "Sleep_Hours_Per_Night"
            ];

            numericFields.forEach((field) => {
                if (data[field] !== undefined) {
                    data[field] = Number(data[field]);
                }
            });

            // Call FastAPI prediction endpoint
            const response = await fetch(
                "http://127.0.0.1:8000/predict",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    typeof result.detail === "string"
                        ? result.detail
                        : JSON.stringify(result.detail || result)
                );
            }

            const score = Number(
                result.predicted_mental_health_score
            );

            if (!Number.isFinite(score)) {
                throw new Error("Invalid score received from the model.");
            }

            // Display the model's original score
            showResult(score);

        } catch (error) {
            console.error("Prediction error:", error);

            alert(
                "Prediction failed: " + error.message +
                "\nPlease check that FastAPI is running."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Predict Score";
            }
        }
    });
}
