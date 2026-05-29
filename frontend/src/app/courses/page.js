"use client";
import Navbar from "../Navbar";
import Link from "next/link";
import { useEffect, useState } from "react";

const Courses = () => {
    const [listings, setListings] = useState([]);
    useEffect(() => {
        fetch("http://localhost:5050/api/listings")
          .then((response) => response.json())
          .then((data) => setListings(data))
          .catch((err) => {
            console.error("Error:", err);
          });
        }, []);
    
    return (
        <div className="courses">
            <div className="navbar">
                <Navbar />
            </div>
            <h1>Course Swap Listings</h1>
            <div className="addCourse">
                <Link href="/courses/add">Add Listing</Link>
            </div>
            <div className="courseListings">
                {listings.map((listing, idx) => (
                    <div key ={idx}>
                        <h3>{listing.moduleCode}</h3>
                        <p>Current Slot: {listing.currentSlot}</p>
                        <p>Desired Slot: {listing.desiredSlot}</p>
                    </div>
                ))}
            </div>
        </div>
     );
}
 
export default Courses;