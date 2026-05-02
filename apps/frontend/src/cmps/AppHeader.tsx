import { NavLink } from "react-router-dom";

export function AppHeader() {
    return <header className="app-header">
        <h1>Cars</h1>
        <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/car">Cars</NavLink>
            <NavLink to="/login">Login</NavLink>
        </nav>
    </header>
}