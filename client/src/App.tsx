import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import RegisterSuccessfulPage from "./pages/RegisterSuccessfulPage";
import LoginSuccessfulPage from "./pages/LoginSuccessfulPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-successful" element={<RegisterSuccessfulPage />} />
        <Route path="/loginsuccessful" element={<LoginSuccessfulPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;