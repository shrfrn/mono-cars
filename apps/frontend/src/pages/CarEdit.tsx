import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { CarBaseInputSchema, CarTypeSchema, type CarBaseInput } from '@cars/shared'
import { carService } from '../services/car'

export function CarEdit() {
    const { carId } = useParams<{ carId: string }>()
    const navigate = useNavigate()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CarBaseInput>({
        resolver: zodResolver(CarBaseInputSchema),
        defaultValues: carService.getEmptyCar(),
    })

	async function loadCar() {
		const car = await carService.getById(carId!)
		reset(car)
	}

	useEffect(() => {
		if (carId) loadCar() 
	}, [])

    async function onSaveCar(car: CarBaseInput) {
        try {
			await carService.save(car)
			navigate('/car')
		} catch (err) {
			alert(err.response.data.message)
		}
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