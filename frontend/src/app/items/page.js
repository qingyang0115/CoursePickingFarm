"use client";

import { useEffect, useState } from "react";
import Navbar from "../Navbar";

const Items = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    fetch("http://localhost:5050/api/items")
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  const filteredItems = items
    .filter((item) =>
      item.title.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "priceLow") return a.price - b.price;
      if (sort === "priceHigh") return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div>
      <Navbar />
      <h1>Marketplace</h1>
      <input
        placeholder="Search items..."
        onChange={(e) => setFilter(e.target.value)}
      />

      <select onChange={(e) => setSort(e.target.value)}>
        <option value="latest">Latest</option>
        <option value="priceLow">Price: Low → High</option>
        <option value="priceHigh">Price: High → Low</option>
      </select>

      {/* item grid */}
      <div style={{ display: "grid", gap: 20 }}>
        {filteredItems.map((item) => (
          <div key={item._id} style={{ border: "1px solid #ccc", padding: 10 }}>
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                style={{ width: "100%", maxWidth: 200, display: "block" }}
              />
            )}
            <h3>{item.title}</h3>
            <p>${item.price}</p>
            <p>{item.description}</p>
            <p>{item.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Items;