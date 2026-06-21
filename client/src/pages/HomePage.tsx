import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export default function HomePage() {
    const navigate = useNavigate();

    const user = useAuthStore(
        (state) => state.user
    );

    const logout = useAuthStore(
        (state) => state.logout
    );

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div>
            <h1>
                Welcome to the HomePage{" "}
                {user?.username}
            </h1>

            <button
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );
}