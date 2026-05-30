"use client";
import Navbar from "../../Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CourseAdd = () => {
    const router = useRouter();
    const [courseCode, setcourseCode] = useState('');
    const [currentSlot, setCurrentSlot] = useState('');
    const [desiredSlot, setDesiredSlot] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newListing = { courseCode, currentSlot, desiredSlot };

        fetch('http://localhost:5050/api/courseListings/', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newListing)
        })
        .then(() => {
        router.push("/courses");
        })
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
                    <button style={{ cursor: "pointer" }}>Add Course Listing</button>
                </form>
            </div>
        </div>
        
     );
}
 
export default CourseAdd;