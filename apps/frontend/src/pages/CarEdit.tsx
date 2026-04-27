import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { CarBaseSchema, CarTypeSchema, type CarBaseInput } from '@cars/shared'
import { carService } from '../services/car'

export function CarEdit() {
    const { carId } = useParams()
    const navigate = useNavigate()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CarBaseInput>({
        resolver: zodResolver(CarBaseSchema),
        defaultValues: carService.getEmptyCar(),
    })

	useEffect(() => {
		if (carId) loadCar()
	}, [])

	async function loadCar() {
		const car = await carService.getById(carId!)
		reset(car)
	}

    async function onSaveCar(car: CarBaseInput) {
        await carService.save(car)
        navigate('/car')
    }

	return (
		<form onSubmit={handleSubmit(onSaveCar)} className="car-edit">

            <section className="car-make">
			    <input { ... register('make') } placeholder="make"/>
                {errors.make && <p className="error" >{errors.make.message}</p>}
            </section>

            <section className="car-max-speed">
                <input { ...register('maxSpeed')} type="number" placeholder="max. speed"/>
                {errors.maxSpeed && <p className="error" >{errors.maxSpeed.message}</p>}
            </section>

            <section className="car-type">
                <select { ...register('type')}>

                    {CarTypeSchema.options.map(type => 
                        <option value={type} key={type}>{type}</option>)}
                </select>
                {errors.type && <p className="error" >{errors.type.message}</p>}
            </section>

			<Link to="/car">Cancel</Link>
            <button>Save</button>
		</form>
	)
}