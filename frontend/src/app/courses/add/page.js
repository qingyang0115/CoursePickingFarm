"use client";
import Navbar from "../../Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";

const CourseAdd = () => {
    const router = useRouter();
    const [courseCode, setcourseCode] = useState('');
    const [currentSlot, setCurrentSlot] = useState('');
    const [desiredSlot, setDesiredSlot] = useState('');
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        const newListing = { courseCode, currentSlot, desiredSlot };
        const user = auth.currentUser;

        if (!user) {
            alert("You must be logged in to add a course listing.");
            router.push("/login");
            setIsSubmitting(false);
            return;
        }

        try {
            const token = await user.getIdToken();

            const response = await fetch('http://localhost:5050/api/courseListings/', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newListing)
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
    }

    return ( 
        <div className="addListings">
            <div className="navbar">
                <Navbar />
            </div>
            <div className="addListingsContent"> 
                <h2>Add a New Blog</h2>
                <form onSubmit={handleSubmit}>
                    <label>Module Code:</label>
                    <input 
                    type="text" 
                    required 
                    value={courseCode}
                    onChange={(e) => setcourseCode(e.target.value)}
                    />
                    <label>Current Slot:</label>
                    <input 
                    type="text" 
                    required 
                    value={currentSlot}
                    onChange={(e) => setCurrentSlot(e.target.value)}
                    />
                    <label>Desired Slot:</label>
                    <input 
                    type="text" 
                    required 
                    value={desiredSlot}
                    onChange={(e) => setDesiredSlot(e.target.value)}
                    />
                    {error && <p>{error}</p>}
                    <button disabled={isSubmitting} style={{ cursor: "pointer" }}>
                        {isSubmitting ? "Adding..." : "Add Course Listing"}
                    </button>
                </form>
            </div>
        </div>
        
     );
}
 
export default CourseAdd;
