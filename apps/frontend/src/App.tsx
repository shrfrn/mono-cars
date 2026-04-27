import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { AppHeader } from './cmps/AppHeader'

import { Home } from './pages/Home'
import { About } from './pages/About'
// import { UserIndex } from './pages/UserIndex'
import { CarIndex } from './pages/CarIndex'
import { CarDetails } from './pages/CarDetails'
import { CarEdit } from './pages/CarEdit'

function App() {
    return <Router>
        <AppHeader />
        <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/about' element={<About />}/>
            {/* <Route path='/user' element={<UserIndex />}/> */}
            <Route path='/car' element={<CarIndex />}/>
            <Route path='/car/edit/:carId?' element={<CarEdit />}/>
            <Route path='/car/:carId' element={<CarDetails />}/>
        </Routes>

    </Router>
}

export default App
