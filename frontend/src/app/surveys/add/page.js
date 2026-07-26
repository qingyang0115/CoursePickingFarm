"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Navbar from "../../Navbar";

const SurveyAdd = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        remuneration: "",
        telegramHandle: "",
        minAge: "",
        maxAge: "",
        sex: "",
        major: "",
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                router.push("/login");
                return;
            }

            setUser(firebaseUser);

            try {
                const token = await firebaseUser.getIdToken();

                const response = await fetch("http://localhost:5050/api/profile/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const profile = await response.json();

                    if (profile) {
                        setFormData((prev) => ({
                            ...prev,
                            telegramHandle: profile.telegramHandle || "",
                        }));
                    }
                }
            } catch (err) {
                // ignore, user can still type manually
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            if (!user) {
                setError("You are not logged in.");
                return;
            }

            const token = await user.getIdToken();

            const response = await fetch("http://localhost:5050/api/surveys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create survey.");
                return;
            }

            setMessage("Survey posted successfully.");
            router.push("/surveys");
        } catch (err) {
            setError("Failed to create survey.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div style={{ padding: "24px" }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px" }}>
                <h1>Post Survey</h1>
                <p>Fill in the survey details below.</p>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
                    <label>
                        Survey Name
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            placeholder="Describe what the survey is about..."
                            rows={5}
                        />
                    </label>

                    <label>
                        Remuneration
                        <input
                            type="text"
                            name="remuneration"
                            value={formData.remuneration}
                            onChange={handleChange}
                            required
                            placeholder="e.g. $10 Grab voucher"
                        />
                    </label>

                    <label>
                        Point of Contact Telegram Username
                        <input
                            type="text"
                            name="telegramHandle"
                            value={formData.telegramHandle}
                            onChange={handleChange}
                            required
                            placeholder="without @"
                        />
                    </label>

                    <div style={{ display: "grid", gap: "12px" }}>
                        <p style={{ margin: 0 }}>Requirements (optional)</p>

                        <label>
                            Minimum Age
                            <input
                                type="number"
                                name="minAge"
                                value={formData.minAge}
                                onChange={handleChange}
                                min="0"
                                max="120"
                            />
                        </label>

                        <label>
                            Maximum Age
                            <input
                                type="number"
                                name="maxAge"
                                value={formData.maxAge}
                                onChange={handleChange}
                                min="0"
                                max="120"
                            />
                        </label>

                        <label>
                            Gender
                            <select name="sex" value={formData.sex} onChange={handleChange}>
                                <option value="">Any</option>
                                <option value="M">M</option>
                                <option value="F">F</option>
                            </select>
                        </label>

                        <label>
                            Major
                            <input
                                type="text"
                                name="major"
                                value={formData.major}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    {error && <p>{error}</p>}
                    {message && <p>{message}</p>}

                    <button type="submit" disabled={saving}>
                        {saving ? "Posting..." : "Post Survey"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SurveyAdd;