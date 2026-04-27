import { Link } from 'react-router-dom'
import type { Car } from '../services/car.service'

export type CarListProps = {
    cars: Car[],
    onRemoveCar: (carId: string) => void,
}

export function CarList({ cars, onRemoveCar }: CarListProps) {
    if (!cars) return <h1>Car List</h1>
    return <section className="car-list">
        <ul>
            {cars.map(car => <li key={car._id}>
                <pre>{JSON.stringify(car, null, 4)}</pre>

                <div className="actions">
                    <Link to={`${car._id}`}>Details</Link>
                    <Link to={`edit/${car._id}`}>Edit</Link>
                    <button onClick={() => onRemoveCar(car._id)}>x</button>
                </div>
            </li>)}
        </ul>
    </section>
}