import { Link } from "react-router-dom"

import type { Car } from "@cars/shared"

import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { CarSocialBar } from "./CarSocialBar"

type CarPreviewFooterProps = {
	car: Car,
	onToggleLike: (carId: string) => Promise<void>,
}

export function CarPreviewFooter({ car, onToggleLike, }: CarPreviewFooterProps) {

	return <CardFooter className='justify-between py-2'>
		<CarSocialBar 
			car={car} 
			onToggleLike={() => onToggleLike(car._id)} />

		<nav className='flex gap-1'>
			<Link to={`${car._id}`}>
				<Button variant="outline">Details</Button>
			</Link>
			<Link to={`edit/${car._id}`}>
				<Button variant="outline">Edit</Button>
			</Link>
		</nav>
	</CardFooter>
}