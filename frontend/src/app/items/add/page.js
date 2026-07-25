"use client";

import { useState } from "react";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Navbar from "../../Navbar";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AddItem = () => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      alert("Image must be smaller than 5MB");
      e.target.value = "";
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in");
      router.push("/login");
      return;
    }

    const token = await user.getIdToken();

    setSubmitting(true);

    let image = "";
    try {
      if (imageFile) {
        image = await fileToBase64(imageFile);
      }
    } catch (error) {
      console.error("Failed to read image:", error);
      alert("Failed to read image");
      setSubmitting(false);
      return;
    }

    await fetch("http://localhost:5050/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, price, description, image }),
    });

    setSubmitting(false);
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

        <div>
          <label>Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {imagePreview && (
          <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, display: "block" }} />
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default AddItem;
