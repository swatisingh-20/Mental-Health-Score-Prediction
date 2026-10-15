
const form = document.getElementById("predictionForm");

const scoreValue = document.getElementById("scoreValue");
const scoreScale = document.getElementById("scoreScale");
const gaugeNeedle = document.getElementById("gaugeNeedle");

const resultDate = document.getElementById("resultDate");
const resultLabel = document.getElementById("resultLabel");
const resultHelp = document.getElementById("resultHelp");
const readingText = document.getElementById("readingText");

const screenInsight = document.getElementById("screenInsight");
const sleepInsight = document.getElementById("sleepInsight");
const activityInsight = document.getElementById("activityInsight");

const statusMessage = document.getElementById("statusMessage");
const predictBtn = document.getElementById("predictBtn");
const buttonText = document.getElementById("buttonText");

// IMPORTANT:
// Local testing ke liye local URL use karo.
// Render par deploy karne ke baad ise apne actual backend URL se replace karo.
const API_URL = "https://mental-health-score-prediction-3xq7.onrender.com";


// Update gauge from 0 to 10
function updateGauge(score) {
    const safeScore = Math.max(0, Math.min(10, score));

    // Show only the number, for example 6.5 instead of 6.5/10
    scoreValue.textContent = safeScore.toFixed(1);

    if (scoreScale) {
        scoreScale.textContent = "Out of 10";
    }

    // Gauge starts at -90 degrees and ends at 90 degrees
    const angle = -90 + (safeScore / 10) * 180;

    if (gaugeNeedle) {
        gaugeNeedle.setAttribute(
            "transform",
            `rotate(${angle} 160 165)`
        );
    }
}


// Update dashboard after prediction
function updateDashboard(data, submittedData) {
    // Check possible score names returned by the API
    const rawScore =
    data.predicted_mental_health_score ??
    data.Mental_Health_Score ??
    data.prediction ??
    data.predicted_score ??
    data.score;
    const score = Number(rawScore);

    if (rawScore === undefined || rawScore === null || !Number.isFinite(score)) {
        throw new Error(
            "Prediction score nahi mila. Backend response check karo."
        );
    }

    updateGauge(score);

    // Update result date
    if (resultDate) {
        resultDate.textContent = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    // Result message based on score range.
    // These are display labels, not a medical assessment.
    if (score < 4) {
        resultLabel.textContent = "Lower Score";
        resultHelp.textContent =
            "Your model returned a lower score. Review your daily habits and routines.";
        readingText.textContent =
            `Your model predicted a score of ${score.toFixed(1)} out of 10. ` +
            "Use this result as a reflection point, not as a medical diagnosis.";
    } else if (score < 7) {
        resultLabel.textContent = "Moderate Score";
        resultHelp.textContent =
            "Your model returned a mid-range score. Reflect on your daily habits.";
        readingText.textContent =
            `Your model predicted a score of ${score.toFixed(1)} out of 10. ` +
            "Consider your screen time, sleep, study routine and physical activity. " +
            "This estimate is not a medical diagnosis.";
    } else {
        resultLabel.textContent = "Higher Score";
        resultHelp.textContent =
            "Your model returned a higher score. Review the result in context.";
        readingText.textContent =
            `Your model predicted a score of ${score.toFixed(1)} out of 10. ` +
            "Remember that this is a model estimate, not a medical diagnosis.";
    }

    // Update Quick Insights using the values entered in the form
    const screenTime = Number(submittedData.Avg_Daily_Usage_Hours);
    const sleepHours = Number(submittedData.Sleep_Hours_Per_Night);
    const activityHours = Number(submittedData.Physical_Activity_Hours);

    if (screenInsight) {
        screenInsight.textContent = `${screenTime} hours per day`;
    }

    if (sleepInsight) {
        sleepInsight.textContent = `${sleepHours} hours per night`;
    }

    if (activityInsight) {
        activityInsight.textContent = `${activityHours} hours per day`;
    }
}


// Submit form and call FastAPI
if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        const submittedData = Object.fromEntries(formData.entries());

        // Convert numeric inputs to numbers
        const numericFields = [
            "Age",
            "Avg_Daily_Usage_Hours",
            "Daily_Unlocks",
            "Study_Hours",
            "Physical_Activity_Hours",
            "Sleep_Hours_Per_Night"
        ];

        numericFields.forEach(function (field) {
            if (submittedData[field] !== undefined) {
                submittedData[field] = Number(submittedData[field]);
            }
        });

        if (predictBtn) {
            predictBtn.disabled = true;
        }

        if (buttonText) {
            buttonText.textContent = "⏳ Getting prediction...";
        }

        if (statusMessage) {
            statusMessage.textContent = "Connecting to the prediction model...";
        }

        try {
            const response = await fetch(`${API_URL}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(submittedData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Backend error (${response.status}): ${errorText}`
                );
            }

            const data = await response.json();

            console.log("Backend response:", data);

            updateDashboard(data, submittedData);

            if (statusMessage) {
                statusMessage.textContent =
                    "Prediction received successfully.";
            }

        } catch (error) {
            console.error("Prediction error:", error);

            if (statusMessage) {
                statusMessage.textContent =
                    "Prediction failed. Check that your backend is running and the API URL is correct.";
            }

        } finally {
            if (predictBtn) {
                predictBtn.disabled = false;
            }

            if (buttonText) {
                buttonText.textContent = "✦ Read my signal";
            }
        }
    });
}
