import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { LikeSchema, type Car } from '@cars/shared'
import type { CarQueryOptions } from '@cars/shared'
import { carService } from "../services/car"
import { CarList } from "../cmps/CarList.tsx"
import { CarFilter } from "../cmps/CarFilter.tsx"
import { Button } from "@/components/ui/button.tsx"
import { authService } from "../services/auth"

export function CarIndex() {
	const loggedinUser = authService.getLoggedInUser()

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

	async function onToggleLike(carId: string) {
		const car = cars.find(car => car._id === carId)
		if (!car) throw new Error('Car not found')

		const carToUpdate = structuredClone(car)

		if (car.likedBy?.map(like => like.by._id)?.includes(loggedinUser._id)) {
			await carService.unlike(carId)
			carToUpdate.likedBy = car.likedBy?.filter(like => like.by._id !== loggedinUser._id)
		} else {
			const like = await carService.like(carId)
			carToUpdate.likedBy = [...(carToUpdate.likedBy ?? []) ,LikeSchema.parse(like)]
		}
		setCars(prev => prev.map(car => car._id === carId ? carToUpdate : car))
	}

    if (!cars) return <h1>Cars</h1>

    return <div className="car-index">
		<header className="flex justify-between items-end py-3 mb-4">
			<CarFilter queryOptions={carQueryOptions} setQueryOptions={setCarQueryOptions}/>
			<Link to="edit">
				<Button>Add a Car</Button>
			</Link>
		</header>
        <CarList cars={cars} onRemoveCar={onRemoveCar} onToggleLike={onToggleLike}/>
    </div>
}