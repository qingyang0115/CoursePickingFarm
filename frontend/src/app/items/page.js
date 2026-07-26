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

      <main className="page">
        <div className="container" style={{ padding: "2rem 0" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 className="section-title">Marketplace</h1>
            <p className="section-subtitle">
              Search items, sort by price, and browse what other students are selling.
            </p>
          </div>

          <div
            className="card card-pad"
            style={{
              display: "grid",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <input
              placeholder="Search items..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="priceLow">Price: Low → High</option>
              <option value="priceHigh">Price: High → Low</option>
            </select>
          </div>

          <div className="grid grid-3">
            {filteredItems.map((item) => (
              <div key={item._id} className="card card-pad">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "1rem",
                    }}
                  />
                )}

                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                    ${item.price}
                  </p>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    {item.description}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong>Seller:</strong>{" "}
                    {item.sellerTelegramHandle ? (
                      <a
                        href={`https://t.me/${item.sellerTelegramHandle}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        @{item.sellerTelegramHandle}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <p style={{ marginTop: "1.5rem" }}>No items found.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Items;