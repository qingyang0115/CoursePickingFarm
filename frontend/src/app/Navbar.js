"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <nav>
      <h1>NUS Marketplace</h1>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/courses">Course Swaps</Link></li>
        <li><Link href="/items">Item Listings</Link></li>
        <li><Link href="/surveys">Surveys</Link></li>
        {user ? (
          <li>
            <button type="button" onClick={() => signOut(auth)}>
              Log Out
            </button>
          </li>
        ) : (
          <li><Link href="/login">Log In</Link></li>
        )}
      </ul>
    </nav>
  );
}
 
export default Navbar;
