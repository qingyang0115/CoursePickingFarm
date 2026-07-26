"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import Navbar from "../Navbar";

const API_URL = "http://localhost:5050";

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    major: "",
    telegramHandle: "",
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

        const response = await fetch(`${API_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();

          if (profile) {
            setFormData({
              name: profile.name || "",
              age: profile.age ?? "",
              sex: profile.sex || "",
              major: profile.major || "",
              telegramHandle: profile.telegramHandle || "",
            });
          }
        }
      } catch (err) {
        setError("Failed to load profile.");
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
    setMessage("");
    setError("");

    try {
      if (!user) {
        setError("You are not logged in.");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile.");
        return;
      }

      setMessage("Profile saved successfully.");
      setFormData({
        name: data.name || "",
        age: data.age ?? "",
        sex: data.sex || "",
        major: data.major || "",
        telegramHandle: data.telegramHandle || "",
      });
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: "24px" }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
        <h1>Your Profile</h1>
        <p>Update your name, age, sex, major, and Telegram handle here.</p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Your name"
            />
          </label>

          <label>
            Age
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
              min="0"
              max="120"
            />
          </label>

          <label>
            Sex
            <select
              name="sex"
              value={formData.sex || ""}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>

          <label>
            Major
            <input
              type="text"
              name="major"
              value={formData.major || ""}
              onChange={handleChange}
              placeholder="Your major"
            />
          </label>

          <label>
            Telegram Handle
            <input
              type="text"
              name="telegramHandle"
              value={formData.telegramHandle || ""}
              onChange={handleChange}
              placeholder="your_username"
            />
          </label>

          {error && <p>{error}</p>}
          {message && <p>{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;