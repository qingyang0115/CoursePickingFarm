"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import Navbar from "../Navbar";

const Surveys = () => {
    const [surveys, setSurveys] = useState([]);
    const [mode, setMode] = useState("all");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchSurveys = async () => {
            setLoading(true);
            setError("");

            try {
                if (mode === "matching" && !user) {
                    setSurveys([]);
                    setLoading(false);
                    return;
                }

                const url =
                    mode === "matching"
                        ? "http://localhost:5050/api/surveys/matching"
                        : "http://localhost:5050/api/surveys";

                const options = {};

                if (mode === "matching" && user) {
                    const token = await user.getIdToken();
                    options.headers = {
                        Authorization: `Bearer ${token}`,
                    };
                }

                const response = await fetch(url, options);
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to fetch surveys");
                    setSurveys([]);
                    return;
                }

                setSurveys(data);
            } catch (err) {
                setError("Failed to fetch surveys");
                setSurveys([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveys();
    }, [mode, user]);

    const formatRequirements = (survey) => {
        const requirements = [];

        if (survey.minAge !== undefined || survey.maxAge !== undefined) {
            if (survey.minAge !== undefined && survey.maxAge !== undefined) {
                requirements.push(`Age: ${survey.minAge} - ${survey.maxAge}`);
            } else if (survey.minAge !== undefined) {
                requirements.push(`Age: ${survey.minAge}+`);
            } else if (survey.maxAge !== undefined) {
                requirements.push(`Age: up to ${survey.maxAge}`);
            }
        }

        if (survey.sex) {
            requirements.push(`Gender: ${survey.sex}`);
        }

        if (survey.major) {
            requirements.push(`Major: ${survey.major}`);
        }

        return requirements;
    };

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
                <h1>Surveys</h1>
                <p>Browse all surveys or show only surveys that match your profile.</p>

                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={() => setMode("all")}
                        style={{
                            fontWeight: mode === "all" ? "700" : "400",
                        }}
                    >
                        All Surveys
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("matching")}
                        style={{
                            fontWeight: mode === "matching" ? "700" : "400",
                        }}
                    >
                        Matching Surveys
                    </button>

                    <Link href="/surveys/add">Post Survey</Link>
                </div>

                {mode === "matching" && !user && (
                    <p>Please log in to view matching surveys.</p>
                )}

                {loading ? (
                    <p>Loading surveys...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : surveys.length === 0 ? (
                    <p>No surveys found.</p>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {surveys.map((survey) => {
                            const requirements = formatRequirements(survey);

                            return (
                                <div
                                    key={survey._id}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "16px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <h3>{survey.title}</h3>
                                    <p>{survey.description}</p>
                                    <p>
                                        <strong>Remuneration:</strong> {survey.remuneration}
                                    </p>
                                    <p>
                                        <strong>Contact:</strong> @{survey.telegramHandle}
                                    </p>

                                    {requirements.length > 0 && (
                                        <div>
                                            <strong>Requirements:</strong>
                                            <ul>
                                                {requirements.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Surveys;