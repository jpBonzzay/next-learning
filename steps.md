# Guía: NextAuth + Auth0 + Supabase con Next.js 16 y SOLID Principles

Una guía paso a paso para crear una aplicación con autenticación OAuth y base de datos, siguiendo buenas prácticas de arquitectura.

## Prerequisitos

- Node.js 18+ instalado
- Cuenta en [Auth0](https://auth0.com)
- Cuenta en [Supabase](https://supabase.com)
- Conocimiento básico de Next.js y React

---

## Paso 1: Crear el proyecto Next.js

```bash
npx create-next-app@latest next-learning
# Selecciona las opciones:
# - TypeScript: No
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: Yes
# - App Router: Yes
```

Entra al directorio:

```bash
cd next-learning
```

---

## Paso 2: Instalar dependencias necesarias

```bash
npm install next-auth @auth0/nextauth @supabase/supabase-js
```

**¿Qué son?**

- `next-auth`: Librería de autenticación para Next.js
- `@auth0/nextauth`: Proveedor OAuth de Auth0
- `@supabase/supabase-js`: Cliente de Supabase para conexión a base de datos

---

## Paso 3: Configurar Supabase

### 3.1 Crear las tablas en Supabase

En tu [proyecto de Supabase](https://app.supabase.com), ve a **SQL Editor** y ejecuta:

```sql
-- Crear enum de roles
create type user_role as enum ('admin', 'employee');

-- Tabla de perfiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  role user_role not null default 'employee'
);

-- Tabla de reportes
create table reports (
  id uuid default gen_random_uuid() primary key,
  title text,
  content text,
  created_at timestamp default now()
);
```

### 3.2 Obtener credenciales

En **Settings** → **API**:

- Copia **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
- Copia **anon public** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Paso 4: Configurar Auth0

### 4.1 Crear aplicación

1. Ve a [Auth0 Dashboard](https://manage.auth0.com/)
2. **Applications** → **Create Application**
3. Nombre: `next-learning`
4. Tipo: **Regular Web Application**

### 4.2 Obtener credenciales

En la sección **Settings**:

- **Client ID** → será `AUTH0_ID`
- **Client Secret** → será `AUTH0_SECRET`
- **Domain** → será parte de `AUTH0_ISSUER` (ej: `https://dev-xxxxx.auth0.com`)

### 4.3 Configurar URLs permitidas

En **Settings**, en **Allowed Callback URLs**, agrega:

```
http://localhost:3000/api/auth/callback/auth0
```

Haz clic en **Save Changes**.

---

## Paso 5: Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth
NEXTAUTH_SECRET="1234"
NEXTAUTH_URL="http://localhost:3000"

# Auth0
AUTH0_ID="tu_client_id_aqui"
AUTH0_SECRET="tu_client_secret_aqui"
AUTH0_ISSUER="https://tu-dominio.auth0.com"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="tu_supabase_url_aqui"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_supabase_anon_key_aqui"
```

**Nota:** `NEXT_PUBLIC_` hace que sean accesibles al cliente.

---

## Paso 6: Crear la librería de Supabase

Crea la carpeta `src/lib` y el archivo `src/lib/supabase.js`:

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**¿Por qué?** Centralizamos la instancia de Supabase para reutilizarla en toda la app.

---

## Paso 7: Crear la ruta de autenticación NextAuth

Crea la estructura: `src/app/api/auth/[...nextauth]/route.js`

```javascript
import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

export const authOptions = {
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**¿Por qué esta ruta?** `[...nextauth]` es la convención de Next.js para capturas dinámicas. NextAuth usa esto para manejar `/api/auth/signin`, `/api/auth/callback/auth0`, etc.

---

## Paso 8: Crear el SessionProvider

Este componente es **cliente** y es obligatorio para NextAuth.

Crea: `src/app/components/SessionProvider.js`

```javascript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

**"use client":** Indica que es un Client Component.

---

## Paso 9: Envolver la app con SessionProvider

Actualiza `src/app/layout.js`:

```javascript
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Login App",
  description: "Aplicación con NextAuth y Auth0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

---

## Paso 10: Componentes siguiendo SOLID

### 10.1 LogoutButton - Client Component

**Responsabilidad única:** Manejar logout

Crea: `src/app/components/LogoutButton.js`

```javascript
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
    >
      Cerrar Sesión
    </button>
  );
}
```

### 10.2 ReportCard - Client Component

**Responsabilidad única:** Renderizar una tarjeta de reporte

Crea: `src/app/components/ReportCard.js`

```javascript
"use client";

export default function ReportCard({ report }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
      <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
      <p className="text-gray-600 mt-2">{report.content}</p>
      <p className="text-sm text-gray-400 mt-2">
        {new Date(report.created_at).toLocaleString()}
      </p>
    </div>
  );
}
```

### 10.3 ReportsList - Client Component

**Responsabilidad única:** Mostrar lista de reportes

Crea: `src/app/components/ReportsList.js`

```javascript
"use client";

import ReportCard from "./ReportCard";

export default function ReportsList({ reports, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error cargando reportes: {error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-gray-600 text-center py-8">
        No hay reportes disponibles
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

### 10.4 ReportsContainer - Server Component

**Responsabilidad única:** Obtener datos (corre en servidor, no envía JS al cliente)

Crea: `src/app/components/ReportsContainer.js`

```javascript
import { supabase } from "@/lib/supabase";
import ReportsList from "./ReportsList";

export default async function ReportsContainer() {
  let reports = [];
  let error = null;

  try {
    const { data, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;
    reports = data || [];
  } catch (err) {
    console.error("Error fetching reports:", err);
    error = err.message;
  }

  return <ReportsList reports={reports} error={error} />;
}
```

**Ventaja:** El fetch ocurre en el servidor. No expones credenciales al cliente. Sin JavaScript innecesario.

### 10.5 LoginForm - Client Component

**Responsabilidad única:** Mostrar formulario de login

Crea: `src/app/components/LoginForm.js`

```javascript
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
```

---

## Paso 11: Página de inicio

Actualiza: `src/app/page.js`

```javascript
import LoginForm from "./components/LoginForm";

export default function Home() {
  return <LoginForm />;
}
```

---

## Paso 12: Página del Dashboard

Crea: `src/app/dashboard/page.js`

```javascript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import ReportsContainer from "@/app/components/ReportsContainer";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">¡Bienvenido!</h1>
              <p className="text-gray-600">{session.user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Reportes</h2>
          <ReportsContainer />
        </div>
      </div>
    </div>
  );
}
```

**¿Por qué `getServerSession`?** Valida la sesión en el servidor antes de renderizar. Si no hay sesión, redirige.

---

## Paso 13: Estructura de carpetas final

Tu proyecto debe verse así:

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.js          (NextAuth route)
│   ├── components/
│   │   ├── LoginForm.js              (Client Component)
│   │   ├── LogoutButton.js           (Client Component)
│   │   ├── ReportCard.js             (Client Component)
│   │   ├── ReportsList.js            (Client Component)
│   │   ├── ReportsContainer.js       (Server Component)
│   │   └── SessionProvider.js        (Client Component)
│   ├── dashboard/
│   │   └── page.js                   (Server Page)
│   ├── layout.js                     (Root Layout)
│   ├── page.js                       (Home)
│   └── globals.css
├── lib/
│   └── supabase.js                   (Supabase client)
└── .env.local                        (Variables de entorno)
```

---

## Paso 14: Ejecutar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Flujo de la aplicación

```
Usuario sin sesión
        ↓
    [/] página
        ↓
  LoginForm (Client)
        ↓
    Click: Inicia sesión con Auth0
        ↓
  Redirige a Auth0
        ↓
  Usuario inicia sesión
        ↓
  Auth0 redirige a /api/auth/callback/auth0
        ↓
  NextAuth crea sesión
        ↓
  Redirige a /dashboard
        ↓
  DashboardPage (Server) valida sesión
        ↓
  ReportsContainer (Server) obtiene reportes
        ↓
  ReportsList (Client) renderiza reportes
        ↓
  Usuario ve sus reportes ✅
```

---

## SOLID Principles aplicados

### Single Responsibility (S)

- `LogoutButton`: Solo logout
- `ReportCard`: Solo renderizar una tarjeta
- `ReportsList`: Solo mostrar lista
- `ReportsContainer`: Solo obtener datos
- `LoginForm`: Solo formulario de login

### Open/Closed (O)

- Los componentes aceptan props y pueden extenderse sin modificación

### Liskov (L)

- Los componentes pueden reemplazarse sin romper la aplicación

### Interface Segregation (I)

- Cada componente recibe solo las props que necesita
- `ReportCard` solo recibe un `report`
- `ReportsList` solo recibe `reports` y `error`

### Dependency Inversion (D)

- Los componentes dependen de abstracciones (props)
- No acceden directamente a `supabase` desde el componente (lo hace el contenedor)

---

## Server vs Client Components

| Aspecto          | Server           | Client                 |
| ---------------- | ---------------- | ---------------------- |
| Renderizado      | Servidor         | Navegador              |
| Código enviado   | Solo HTML        | HTML + JavaScript      |
| Base de datos    | ✅ Seguro        | ❌ Expone credenciales |
| Hooks (useState) | ❌ No            | ✅ Sí                  |
| Interacción      | ❌ No            | ✅ Sí                  |
| Ejemplo          | ReportsContainer | LogoutButton           |

---

## Próximos pasos (opcional)

1. **Agregar protección a rutas:** Usar middleware para validar sesiones
2. **Relacionar usuarios con reportes:** Agregar `user_id` en la tabla `reports`
3. **Crear reporte:** Agregar formulario para crear nuevos reportes
4. **Editar/Eliminar:** Operaciones CRUD completas
5. **Tests:** Agregar pruebas unitarias e integración

---

## Troubleshooting

### Error: "Callback URL mismatch"

- Revisa que en Auth0 hayas agregado `http://localhost:3000/api/auth/callback/auth0` en "Allowed Callback URLs"

### Error: "supabase is not defined"

- Verifica que hayas creado `src/lib/supabase.js` correctamente
- Revisa que las variables de entorno estén en `.env.local`

### Error: "No hay reportes"

- Verifica que hayas ejecutado el SQL en Supabase
- Agrega reportes de prueba en la tabla `reports`

---

**¡Listo!** Ahora tienes una aplicación moderna con autenticación segura y base de datos. 🚀
