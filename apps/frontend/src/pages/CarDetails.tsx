import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import type { Car } from '@cars/shared'

import { carService } from '../services/car'
import { formatTimestamp } from '../services/util.service'

export function CarDetails() {
	const [car, setCar] = useState<Car>()
	const { carId } = useParams()

	useEffect(() => {
		loadCars()
	}, [])

	async function loadCars() {
		const car = await carService.getById(carId!)
		setCar(car)
	}

	if (!car) return <h2>loding...</h2>
	return (
		<div className="car-details">
			<h2>{car.make}</h2>
			<p>{car.type}</p>
			<p>{car.maxSpeed}</p>
            
			<p>Created at {formatTimestamp(car.createdAt)}</p>
			<p>Updated at {formatTimestamp(car.updatedAt)}</p>

			<Link to="/car">Back</Link>
		</div>
	)
}