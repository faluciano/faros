import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/lighthouses")
      .then((response) => response.text())
      .then(setData);
  }, []);

  return (
    <>
      <h1>Hello, World!</h1>
      <div className="">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="text-white">{data}</p>
    </>
  );
}

export default App;
