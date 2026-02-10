"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleAuth0Login = async () => {
    setIsLoading(true);
    await signIn("auth0", { callbackUrl: "/dashboard" });
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Iniciar Sesión
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Accede a tu cuenta con Auth0
        </p>

        <button
          onClick={handleAuth0Login}
          disabled={isLoading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg mb-4 transition duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Cargando...
            </>
          ) : (
            <>🔐 Inicia sesión con Auth0</>
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-xs text-gray-500 text-center">
            Esta es una interfaz segura de autenticación
          </p>
        </div>
      </div>
    </div>
  );
}
