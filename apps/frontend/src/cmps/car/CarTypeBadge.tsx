import type { Car } from "@cars/shared"

import { Badge } from "@/components/ui/badge"
import { BatteryCharging, EvCharger, Fuel } from "lucide-react"

type CarTypeBadgeProps = {
	car: Car
}

export function CarTypeBadge({ car }: CarTypeBadgeProps) {
	return <Badge variant='default' className='h-7 px-2.5 gap-2 [&>svg]:size-4!'>
		{car.type === 'Electric' && <BatteryCharging />}
		{car.type === 'Gasoline' && <Fuel />}
		{car.type === 'Gas' && <Fuel />}
		{car.type === 'Diesel' && <Fuel />}
		{car.type === 'Hybrid' && <EvCharger />}
		{car.type}
	</Badge>
}