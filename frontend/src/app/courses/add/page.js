"use client";
import Navbar from "../../Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";

const CourseAdd = () => {
  const router = useRouter();
  const [courseCode, setCourseCode] = useState("");
  const [currentSlot, setCurrentSlot] = useState("");
  const [desiredSlot, setDesiredSlot] = useState("");
  const [comments, setComments] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const newListing = { courseCode, currentSlot, desiredSlot, comments, telegramHandle };
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to add a course listing.");
      router.push("/login");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch("http://127.0.0.1:5050/api/courseListings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newListing),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create listing");
      }

      router.push("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="addListings">
      <div className="navbar">
        <Navbar />
      </div>
      <div className="addListingsContent">
        <h2>Add a New Course Swap Listing</h2>
        <form onSubmit={handleSubmit}>
          <label>Module Code:</label>
          <input
            type="text"
            required
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
          <label>Current Slot:</label>
          <input
            type="text"
            required
            value={currentSlot}
            onChange={(e) => setCurrentSlot(e.target.value)}
          />
          <label>Desired Slot(s):</label>
          <input
            type="text"
            required
            value={desiredSlot}
            onChange={(e) => setDesiredSlot(e.target.value)}
            placeholder="e.g. tutorial 1, tutorial 2"
          />
          <label>Telegram ChatID (optional):</label>
          <input
            type="text"
            value={telegramHandle}
            onChange={(e) => setTelegramHandle(e.target.value)}
            placeholder="Use @Rawdata bot to get your telegram chat id"
          />
          <label>Optional Notes:</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add optional swap details or incentives"
          />
          {error && <p>{error}</p>}
          <button disabled={isSubmitting} style={{ cursor: "pointer" }}>
            {isSubmitting ? "Adding..." : "Add Course Listing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseAdd;
