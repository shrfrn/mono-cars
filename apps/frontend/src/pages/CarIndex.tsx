import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { Car } from '@cars/shared'
import type { CarQueryOptions } from '@cars/shared'
import { carService } from "../services/car"
import { CarList } from "../cmps/CarList.tsx"
import { CarFilter } from "../cmps/CarFilter.tsx"
import { Button } from "@/components/ui/button.tsx"

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
		<header className="flex justify-between items-end py-3 mb-4">
			<CarFilter queryOptions={carQueryOptions} setQueryOptions={setCarQueryOptions}/>
			<Link to="edit">
				<Button>Add a Car</Button>
			</Link>
		</header>
        <CarList cars={cars} onRemoveCar={onRemoveCar}/>
    </div>
}