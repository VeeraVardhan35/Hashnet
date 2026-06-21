import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser }
from "../services/auth.service";

import {
    useAuthStore
}
from "../store/auth.store";

export default function LoginPage() {
    const { setAuth } =
        useAuthStore();
    
    const navigate = useNavigate();
    
    const [email, setEmail] =
        useState("");

    const [password,
        setPassword] =
        useState("");

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        try {
            const data = await loginUser({
                email,
                password,
            });

            setAuth(
                data.user,
                data.token
            );

            navigate("/loginsuccessful");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <input
                    value={email}
                    onChange={(e) =>
                        setEmail(
                            e.target.value
                        )
                    }
                />

            </div>
            <div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                        setPassword(
                            e.target.value
                        )
                    }
                />
            </div>
            <div>
                <button type="submit" onSubmit={handleSubmit}>
                    Login
                </button>
            </div>
        </form>
    );
}