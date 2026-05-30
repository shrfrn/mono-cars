import type { Car } from "@cars/shared"

import { CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type CarPreviewProps = {
	car: Car,
	canDelete: boolean,
	onRemove: () => Promise<void>,
}

export function CarPreviewHeader({ car, canDelete, onRemove }: CarPreviewProps) {
	return <CardHeader>
		<CardDescription>{car.make}</CardDescription>
		<CardTitle className="text-4xl mb-1.5">
			{car.maxSpeed} <span className="text-lg">Kmh</span>
		</CardTitle>
		<CardAction>
			{canDelete && (
				<Button variant="outline" onClick={onRemove}>
					<X />
				</Button>
			)}
		</CardAction>
	</CardHeader>
}
