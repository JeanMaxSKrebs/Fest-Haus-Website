import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AppRoutes />

          <footer
            style={{
              backgroundColor: "#6b21a8",
              color: "white",
              padding: 20,
              textAlign: "center",
              width: "100%",
            }}
          >
            © 2026 Fest Haus
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;