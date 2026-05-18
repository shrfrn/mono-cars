import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import type { Car, Comment } from '@cars/shared'

import { carService } from '../services/car'
import { formatTimestamp } from '../services/util.service'
import { authService } from '../services/auth'
import { checkPermission } from '@cars/shared/src/abac'

export function CarDetails() {
	const loggedInUser = authService.getLoggedInUser()
	const [car, setCar] = useState<Car>()
	const [liked, setLiked] = useState(false)

	const { carId } = useParams()

	useEffect(() => {
		loadCar()

		async function loadCar() {
			const car = await carService.getById(carId!)
			setCar(car)

			if (loggedInUser && car.likedBy?.map(like => like.by._id).includes(loggedInUser._id)) setLiked(true)
		}
	}, [carId])

	async function addComment() {
		const txt = prompt('Enter your comment')
		if (!txt) return

		const comment = await carService.addComment(carId!, txt)
		setCar({ ...car, comments: [...(car?.comments || []), comment as Comment] })
	}
	
	async function removeComment(commentId: string) {
		await carService.removeComment(carId, commentId)
		setCar({ ...car, comments: car?.comments?.filter(comment => comment.id !== commentId) || [] })
	}

	async function like() {
		await carService.like(carId!)
		setLiked(true)
		setCar(prev => ({ ...prev, likedBy: [...(prev?.likedBy || []), { by: loggedInUser, createdAt: Date.now() }] }))
	}

	async function unlike() {
		await carService.unlike(carId!)
		setLiked(false)
		setCar(prev => ({ ...prev, likedBy: prev.likedBy.filter(like => like.by._id !== loggedInUser?._id)}))
	}

	function canDeleteComment(comment) {
		return checkPermission({
			action: 'car:deleteComment',
			subject: authService.getLoggedInUser(),
			resource: comment,
		})
	}

	if (!car) return <h2>loding...</h2>
	return (
		<div className="car-details">
			<h2>{car.make}</h2>
			<p>{car.type}</p>
			<p>{car.maxSpeed}</p>
            
			<p>Created at {formatTimestamp(car._createdAt)}</p>
			<p>Updated at {formatTimestamp(car._updatedAt)}</p>

			{car.comments?.map(comment => <div key={comment.id}>
				<pre>{JSON.stringify(comment, null, 2)}</pre>
				{canDeleteComment(comment) && <button onClick={() => removeComment(comment.id)}>x</button>}
			</div>)}

			<p>Liked by {car.likedBy?.length} {car.likedBy?.length === 1 ? 'person: ' : 'people: '}
				{car.likedBy?.map(like => <span key={like.by._id}>{like.by.fullname} </span>)}
			</p>

			<hr />
			
			<button onClick={() => liked ? unlike() : like()}>{liked ? 'Unlike' : 'Like'}</button>
			<button onClick={() => addComment()}>Comment</button>
			<Link to="/car">Back</Link>
		</div>
	)
}