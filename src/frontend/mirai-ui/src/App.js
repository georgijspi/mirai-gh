import "./App.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatNow from "./components/ChatNow";
import APIModuleConfig from "./components/APIModuleConfig";
import LLMPerformance from "./components/LLMPerformance";
import TestUI from "./components/TestUI";

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

function App() {
  const [selectedTab, setSelectedTab] = useState("ChatNow");

  return (
    <>
      <div className="test-ui">
        <TestUI />
      </div>
      <div className="admin-dashboard">
        <Sidebar setSelectedTab={setSelectedTab} />
        {selectedTab === "ChatNow" && <ChatNow />}
        {selectedTab === "LLMPerformance" && <LLMPerformance />}
        {selectedTab === "APIModuleConfig" && <APIModuleConfig />}
      </div>
    </>
  );
}

export default App;
