"use client";
import Navbar from "../Navbar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Courses = () => {
  const [listings, setListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSlot, setFilterSlot] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:5050/api/courseListings")
      .then((response) => response.json())
      .then((data) => setListings(data))
      .catch((err) => {
        console.error("Error:", err);
        setError("Unable to load listings right now.");
      });
  }, []);

  const filteredListings = listings.filter((listing) => {
    const courseMatch =
      filterCourse === "" ||
      listing.courseCode.toLowerCase().includes(filterCourse.toLowerCase());
    const slotMatch =
      filterSlot === "" ||
      listing.currentSlot.toLowerCase().includes(filterSlot.toLowerCase()) ||
      listing.desiredSlot.toLowerCase().includes(filterSlot.toLowerCase());
    return courseMatch && slotMatch;
  });

  const handleDelete = async (id) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Log in to remove your listing.");
      return;
    }

    const token = await user.getIdToken();
    const response = await fetch(`http://127.0.0.1:5050/api/courseListings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to remove listing.");
      return;
    }

    setListings((prev) => prev.filter((listing) => listing._id !== id));
  };

  return (
    <div className="courses">
      <div className="navbar">
        <Navbar />
      </div>
      <h1>Course Swap Marketplace</h1>
      <div className="addCourse">
        <Link href="/courses/add">Post a Swap Request</Link>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="filters" style={{ display: "flex", gap: "16px", margin: "16px 0", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Filter by course code (e.g. CS1010A)"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", minWidth: "220px" }}
        />
        <input
          type="text"
          placeholder="Filter by timeslot (e.g. Mon 9am)"
          value={filterSlot}
          onChange={(e) => setFilterSlot(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", minWidth: "220px" }}
        />
        {(filterCourse || filterSlot) && (
          <button
            onClick={() => { setFilterCourse(""); setFilterSlot(""); }}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer", fontSize: "14px" }}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="courseListings">
        {filteredListings.length === 0 ? (
          <p>No swap listings match your filters.</p>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing._id} className="courseListing" style={{ marginBottom: "20px", padding: "15px" }}>
              <h3>{listing.courseCode}</h3>
              <p><strong>Current Slot:</strong> {listing.currentSlot}</p>
              <p><strong>Desired Slot(s):</strong> {listing.desiredSlot}</p>
              {listing.comments && (
                <p><strong>Notes:</strong> {listing.comments}</p>
              )}
              {listing.createdByEmail && (
                <p><strong>Posted by:</strong> {listing.createdByEmail}</p>
              )}
              {listing.createdBy === userId && (
                <button onClick={() => handleDelete(listing._id)} style={{ marginTop: "10px" }}>
                  Mark as swapped / remove listing
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;
