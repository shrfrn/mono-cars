import { Link } from 'react-router-dom'
import type { Car } from '@cars/shared/src/car'
import { checkPermission } from '@cars/shared/src/abac'
import { authService } from '../services/auth'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { BatteryCharging, EvCharger, Fuel, Heart, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar'

export type CarListProps = {
    cars: Car[],
    onRemoveCar: (carId: string) => void,
    onToggleLike: (carId: string) => void,
}

export function CarList({ cars, onRemoveCar, onToggleLike }: CarListProps) {
	const loggedinUser = authService.getLoggedInUser()

	function likedByLoggedinUser(car) {
		return car?.likedBy?.map(like => like.by._id)?.includes(loggedinUser._id)
	}

	function canDelete(car: Car) {
		return checkPermission({
			action: 'car:delete',
			subject: authService.getLoggedInUser(),
			resource: car
		})
	}
	
    if (!cars) return <h1>Car List</h1>

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
								<div className={rowClass}>
									<span>Owner</span>
									<span>{car.owner.fullname}</span>
								</div>
								<Separator />
							</div>
							{<div className="interactions flex items-center gap-3 min-h-6 mt-4">
								{!!car.likedBy?.length && <AvatarGroup>
									{car.likedBy.slice(0, 3).map(like =>
										<Avatar size='sm' key={like.by._id}>
											<AvatarImage src={`https://www.robohash.org/${like.by._id}`}/>
											<AvatarFallback>{like.by.fullname.at(0)}</AvatarFallback>
										</Avatar>
									)}
								</AvatarGroup>}

								{!!car.likedBy?.length && <p className='text-xs'>
									Liked by {car.likedBy[0].by.fullname} 
										{(car.likedBy?.length > 1) && <span> and {car.likedBy.length - 1} others..</span>}</p>}
							</div>}
						</CardContent>

						<CardFooter className='justify-between py-2'>
							<div className="actions flex items-center">
								<Heart 
									size={24} 
									onClick={() => onToggleLike(car._id)}
									className={`mr-1.5 hover:cursor-pointer ${likedByLoggedinUser(car) && 'fill-red-500 text-red-500 stroke-red-500'}`}/>
								{!!car?.likedBy?.length && <span className='text-xs text-muted-foreground'>{car.comments.length}</span>}
								<MessageCircle size={21} className='ml-4 mr-1.5 -scale-x-100'/>
								{!!car?.comments.length && <span className='text-xs text-muted-foreground'>{car.comments.length}</span>}
							</div>
							<nav className='flex gap-1'>
								<Link to={`${car._id}`}>
									<Button variant="outline">Details</Button>
								</Link>
								<Link to={`edit/${car._id}`}>
									<Button variant="outline">Edit</Button>
								</Link>
							</nav>
						</CardFooter>
					</Card>
            </li>})}
        </ul>
    </section>
}