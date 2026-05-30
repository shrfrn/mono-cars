import { Card } from "@/components/ui/card"
import type { Car } from "@cars/shared"
import { CarPreviewHeader } from "./CarPreviewHeader"
import { CarPreviewFooter } from "./CarPreviewFooter"
import { CarPreviewBody } from "./CarPreviewBody"

type CarPreviewProps = {
	car: Car,
	canDelete: boolean,
	onRemoveCar: (carId: string) => Promise<void>,
	onToggleLike: (carId: string) => Promise<void>,
}

export function CarPreview({ car, canDelete, onRemoveCar, onToggleLike }: CarPreviewProps) {

	return <li key={car._id}>
		<Card className='rounded-md hover:shadow-md'>
			<CarPreviewHeader car={car} canDelete={canDelete} onRemove={() => onRemoveCar(car._id)} />
			<CarPreviewBody car={car} />
			<CarPreviewFooter car={car} onToggleLike={onToggleLike} />
		</Card>
	</li>
}