import Image from "next/image";
import Navbar from './Navbar'

const Home = () => {
  return ( 
    <div className="home">
      <Navbar />
      <h1>Course Picking Farm</h1>
      <p>Welcome to the NUS student marketplace.</p>
      <p>Here you can buy and sell items AND trade tutorial slots with other NUS students.</p>
    </div> 
  );
}
 
export default Home;
