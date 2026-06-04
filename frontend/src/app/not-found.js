import Link from "next/link";


const NotFound = () => {
  return (
    <div className="not-found">
      <h2>Sorry!</h2>
      <p>That page cannot be found</p>
      <Link href="/">Back to homepage</Link>
    </div>
  );
}

export default NotFound;
//<Link to="/">Back to the homepage...</Link>
