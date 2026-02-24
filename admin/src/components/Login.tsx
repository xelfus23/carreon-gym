import React, { useState } from "react";
import { useAuth } from "../contexts/useAuth";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            if (err instanceof Error) {
                setError(
                    err.message || "Invalid credentials. Please try again.",
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <div className="block lg:flex items-center lg:rounded-4xl lg:bg-surface px-12 py-24 lg:border lg:border-border">
                <div className="flex flex-col items-center">
                    <div className="flex justify-center items-center">
                        <img src="careon/brand-logo.png" />
                    </div>
                    <p className="text-text-secondary text-sm">
                        Gym Management Portal
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-text-primary">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="text-text-secondary px-3 py-2 rounded-xl w-full outline-none focus:ring-1 focus:ring-primary-dark border border-border"
                            placeholder="admin@careongym.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-text-primary">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-text-secondary px-3 py-2 rounded-xl w-full outline-none focus:ring-1 focus:ring-primary-dark border border-border"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="text-text-primary bg-primary-dark w-full py-2 rounded-xl cursor-pointer hover:bg-primary hover:text-surface font-bold"
                    >
                        {isSubmitting ? <div className=""></div> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
