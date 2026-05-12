import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type { ReviewPublic, ReviewQueryOptions } from '@cars/shared'
import { reviewService } from "../services/review"
import { ReviewList } from "../cmps/ReviewList"
import { ReviewFilter } from "../cmps/ReviewFilter.tsx"
// import { ReviewList } from "../cmps/ReviewList.tsx"

export function ReviewIndex() {
    const [reviews, setReviews ] = useState<ReviewPublic[] | undefined>(undefined)
    const [ reviewQueryOptions, setReviewQueryOptions ] = useState<ReviewQueryOptions>(reviewService.getEmptyReviewOptions())
	
	
	useEffect(() => {
		loadReviews() 
		
		async function loadReviews() {
			const reviews = await reviewService.query(reviewQueryOptions)
			setReviews(reviews)
		}
	}, [reviewQueryOptions])

    async function onRemoveReview(reviewId: string) {
        await reviewService.remove(reviewId)
        setReviews(prev => prev?.filter(review => review._id !== reviewId))
    }

	async function onAddReview() {
		const review = reviewService.getEmptyReview()

		review.txt = prompt('Enter a review')
		review.rating = +prompt('Enter a rating')
		review.aboutCarId = prompt('Enter a car id')

		if (!review.txt || !review.rating) return

		const addedReview = await reviewService.save(review)
		setReviews(prev => [addedReview, ...prev])
	}

    if (!reviews) return <h1>Reviews</h1>

    return <div className="review-index">
		<button onClick={onAddReview}>Add a Review</button>
        {/* <Link to="edit">Add a Review</Link> */}
        <ReviewFilter queryOptions={reviewQueryOptions} setQueryOptions={setReviewQueryOptions}/>
        <ReviewList reviews={reviews} onRemoveReview={onRemoveReview}/>
    </div>
}