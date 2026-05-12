import { NavLink } from "react-router-dom";
import type { MiniUser } from "@cars/shared";
import { authService } from "../services/auth";
import { useNavigate } from "react-router-dom";

export function AppHeader({ loggedInUser, setLoggedInUser }: 
	{ loggedInUser: MiniUser | null, setLoggedInUser: (user: MiniUser | null) => void }) {
	const navigate = useNavigate()
	
	function logout() {
		authService.logout()
		setLoggedInUser(null)
		navigate('/login')
	}
    return <header className="app-header">
        <h1>Cars</h1>
        <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/car">Cars</NavLink>
            <NavLink to="/review">Reviews</NavLink>
            {!loggedInUser ? <NavLink to="/login">Login</NavLink> : <div className="loggedin-user">
				<p>Welcome {loggedInUser?.fullname}</p>
				<button onClick={logout}>Logout</button>
			</div>}
        </nav>
    </header>
}