import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { AppHeader } from './cmps/AppHeader'

import { Home } from './pages/Home'
import { About } from './pages/About'
// import { UserIndex } from './pages/UserIndex'
import { CarIndex } from './pages/CarIndex'
import { CarDetails } from './pages/CarDetails'
import { CarEdit } from './pages/CarEdit'
import { Login } from './pages/Login'
import { useState } from 'react'
import type { MiniUser } from '@cars/shared'
import { authService } from './services/auth'
import { ReviewIndex } from './pages/ReviewIndex'

function App() {
	const [loggedInUser, setLoggedInUser] = useState<MiniUser | null>(authService.getLoggedInUser())

	return (
		<Router>
			<div className="main-layout">
				<AppHeader loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />
				<main>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/about" element={<About />} />
						{/* <Route path='/user' element={<UserIndex />}/> */}
						<Route path="/car" element={<CarIndex />} />
						<Route path="/car/edit/:carId?" element={<CarEdit />} />
						<Route path="/car/:carId" element={<CarDetails />} />
						<Route path="/review" element={<ReviewIndex />} />
						<Route path="/login" element={<Login setLoggedInUser={setLoggedInUser} />} />
					</Routes>
				</main>
			</div>
		</Router>
	)
}

export default App
