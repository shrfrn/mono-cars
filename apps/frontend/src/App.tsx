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

function App() {
	const [loggedInUser, setLoggedInUser] = useState<MiniUser | null>(authService.getLoggedInUser())
	console.log('loggedInUser', loggedInUser)

    return <Router>
        <AppHeader loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser}/>
        <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/about' element={<About />}/>
            {/* <Route path='/user' element={<UserIndex />}/> */}
            <Route path='/car' element={<CarIndex />}/>
            <Route path='/car/edit/:carId?' element={<CarEdit />}/>
            <Route path='/car/:carId' element={<CarDetails />}/>
            <Route path='/login' element={<Login setLoggedInUser={setLoggedInUser}/>}/>
        </Routes>

    </Router>
}

export default App
