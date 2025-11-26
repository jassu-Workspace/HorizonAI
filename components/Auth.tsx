import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseService';

interface AuthProps {
    onAuthSuccess: () => void;
    onGuestAccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onGuestAccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfoMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        throw new Error("Please check your email inbox to confirm your account before logging in.");
                    }
                    if (error.message.includes("Invalid login credentials")) {
                        throw new Error("Invalid email or password.");
                    }
                    throw error;
                }
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (data.user && !data.session) {
                    setInfoMessage("Signup successful! Please check your email to verify your account.");
                    setLoading(false);
                    return; 
                }
            }
            onAuthSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
            // Supabase handles the redirect. onAuthSuccess will be called after the user returns.
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="glass-card p-8 w-full max-w-lg text-center border-l-4 border-amber-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Database Not Configured</h2>
                    <p className="text-slate-600 mb-6">
                        To enable Login and Roadmaps Saving, you need to connect Supabase.
                    </p>
                    <div className="bg-slate-100 p-4 rounded-lg text-left text-sm mb-6 overflow-x-auto font-mono">
                        <p className="text-slate-500 mb-2">// Open <strong className="text-slate-800">services/supabaseService.ts</strong> and add your keys:</p>
                        <p className="text-blue-600">const supabaseUrl = 'YOUR_PROJECT_URL';</p>
                        <p className="text-blue-600">const supabaseKey = 'YOUR_ANON_KEY';</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="dynamic-button"
                        >
                            I Added The Keys, Refresh Page
                        </button>
                        <button 
                            onClick={onGuestAccess} 
                            className="text-slate-500 hover:text-slate-800 underline"
                        >
                            Continue as Guest (No Save Feature)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="glass-card p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {isLogin ? 'Welcome Back' : 'Start Your Journey'}
                </h2>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                    {infoMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-semibold">{infoMessage}</div>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="dynamic-button w-full flex justify-center"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 text-slate-500" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>Or continue with</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-full text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50 bg-white shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.545,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                        Sign in with Google
                    </button>
                </div>

                <div className="mt-6 text-center space-y-4">
                    <div className="text-sm text-slate-600">
                        <p>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setError(''); setInfoMessage(''); }} 
                                className="ml-2 text-blue-600 font-bold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                        <button 
                            onClick={onGuestAccess} 
                            className="text-sm text-slate-500 hover:text-slate-800 transition-colors underline"
                        >
                            Continue as Guest (No Cloud Save)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;