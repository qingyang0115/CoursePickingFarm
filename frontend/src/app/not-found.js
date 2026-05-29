import Link from "next/link";


const NotFound = () => {
  return (
    <div className="not-found">
      <h2>Sorry!</h2>
      <p>That page cannot be found</p>
      <a href="/">Back to homepage</a>
    </div>
  );
}

export default NotFound;
//<Link to="/">Back to the homepage...</Link>