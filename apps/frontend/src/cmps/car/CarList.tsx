import type { Car } from '@cars/shared/src/car'
import { checkPermission } from '@cars/shared/src/abac'
import { authService } from '../../services/auth'
import { CarPreview } from './CarPreview'

export type CarListProps = {
    cars: Car[],
    onRemoveCar: (carId: string) => Promise<void>,
    onToggleLike: (carId: string) => Promise<void>,
}

export function CarList({ cars, onRemoveCar, onToggleLike }: CarListProps) {

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
            {cars.map(car => 
				<CarPreview 
					key={car._id}
					car={car} 
					canDelete={canDelete(car)}
					onRemoveCar={onRemoveCar} 
					onToggleLike={onToggleLike}/>)}
        </ul>
    </section>
}