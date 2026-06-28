"use client";

import { useState } from "react";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Navbar from "../../Navbar";

const AddItem = () => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in");
      router.push("/login");
      return;
    }

    const token = await user.getIdToken();

    await fetch("http://localhost:5050/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, price, description }),
    });

    router.push("/items");
  };

  return (
    <div>
      <Navbar />

      <h1>Post Item</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
        <textarea placeholder="Description" onChange={(e) => setDescription(e.target.value)} />

        <button type="submit">Post</button>
      </form>
    </div>
  );
};

export default AddItem;