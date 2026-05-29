import { NavLink } from "react-router-dom";
import type { MiniUser } from "@cars/shared";
import { authService } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppHeader({ loggedInUser, setLoggedInUser }: 
	{ loggedInUser: MiniUser | null, setLoggedInUser: (user: MiniUser | null) => void }) {
	const navigate = useNavigate()
	
	function logout() {
		authService.logout()
		setLoggedInUser(null)
		navigate('/login')
	}
    return <header className="app-header full main-layout bg-accent">
        <div className="header-content flex justify-between items-center">
        	<h1 className="text-4xl">Cars</h1>
			<nav className="flex gap-5 items-center">
				<NavLink to="/">Home</NavLink>
				<NavLink to="/about">About</NavLink>
				<NavLink to="/car">Cars</NavLink>
				<NavLink to="/review">Reviews</NavLink> |
				{!loggedInUser ? <NavLink to="/login">Login</NavLink> : <div className="loggedin-user flex gap-3">
							<Button variant="outline" onClick={logout}>Logout</Button>
							<Avatar title={loggedInUser?.fullname}>
								<AvatarImage src={loggedInUser.imgUrl} />
								<AvatarFallback>{loggedInUser.fullname.at(0)}</AvatarFallback>
							</Avatar>
						</div>}
			</nav>
		</div>
    </header>
}