import { Link } from 'react-router-dom'
import type { Car } from '@cars/shared/src/car'
import { checkPermission } from '@cars/shared/src/abac'
import { authService } from '../services/auth'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BatteryCharging, EvCharger, Fuel } from 'lucide-react'

export type CarListProps = {
    cars: Car[],
    onRemoveCar: (carId: string) => void,
}

export function CarList({ cars, onRemoveCar }: CarListProps) {
    if (!cars) return <h1>Car List</h1>

	function canDelete(car: Car) {
		return checkPermission({
			action: 'car:delete',
			subject: authService.getLoggedInUser(),
			resource: car
		})
	}
	
    return <section className="car-list my-3">
        <ul className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,30ch),1fr))] gap-5'>
            {cars.map(car => { 
				const rowClass = 'row flex min-h-11 items-center justify-between py-2'

				return <li key={car._id}>
					<Card className='rounded-md hover:shadow-md'>
						<CardHeader>
							<CardDescription>{car.make}</CardDescription>
							<CardTitle className='text-4xl mb-1.5'>{car.maxSpeed} <span className='text-lg'>Kmh</span></CardTitle>
							<CardAction>
								{canDelete(car) && <Button variant='outline' onClick={() => onRemoveCar(car._id)}>x</Button>}
							</CardAction>
						</CardHeader>

						<CardContent>
							<div className="inner-container rounded-lg bg-muted/50 px-4 py-2">
								<div className={rowClass}>
									<span>Type</span>
									<Badge variant='default' className='h-7 px-2.5 gap-2 [&>svg]:size-4!'>
										{car.type === 'Electric' && <BatteryCharging />}
										{car.type === 'Gasoline' && <Fuel />}
										{car.type === 'Gas' && <Fuel />}
										{car.type === 'Diesel' && <Fuel />}
										{car.type === 'Hybrid' && <EvCharger />}
										{car.type}
									</Badge>
								</div>
								<Separator />
								<div className={rowClass}>
									<span>Owner</span>
									<span>{car.owner.fullname}</span>
								</div>
							</div>
						</CardContent>

						<CardFooter className='gap-1 justify-end py-2'>
							<Link to={`${car._id}`}>
								<Button variant="outline">Details</Button>
							</Link>
							<Link to={`edit/${car._id}`}>
								<Button variant="outline">Edit</Button>
							</Link>
						</CardFooter>
					</Card>
            </li>})}
        </ul>
    </section>
}