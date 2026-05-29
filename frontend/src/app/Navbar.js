import Link from "next/link";

const Navbar = () => {
  return (
    <nav>
      <h1>NUS Marketplace</h1>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/courses">Course Swaps</Link></li>
        <li><Link href="/items">Item Listings</Link></li>
        <li><Link href="/surveys">Surveys</Link></li>
      </ul>
    </nav>
  );
}
 
export default Navbar;
