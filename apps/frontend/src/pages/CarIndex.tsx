import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { Car } from '@cars/shared'
import type { CarQueryOptions } from '@cars/shared'
import { carService } from "../services/car"
import { CarList } from "../cmps/CarList.tsx"
import { CarFilter } from "../cmps/CarFilter.tsx"

export function CarIndex() {
    const [cars, setCars ] = useState<Car[] | undefined>(undefined)
    const [ carQueryOptions, setCarQueryOptions ] = useState<CarQueryOptions>(carService.getEmptyCarOptions())
	
	
	useEffect(() => {
		loadCars() 
		
		async function loadCars() {
			const cars = await carService.query(carQueryOptions)
			setCars(cars)
		}
	}, [carQueryOptions])

    async function onRemoveCar(carId: string) {
        await carService.remove(carId)
        setCars(prev => prev?.filter(car => car._id !== carId))
    }

    if (!cars) return <h1>Cars</h1>

    return <div className="car-index">
        <Link to="edit">Add a Car</Link>
        <CarFilter queryOptions={carQueryOptions} setQueryOptions={setCarQueryOptions}/>
        <CarList cars={cars} onRemoveCar={onRemoveCar}/>
    </div>
}