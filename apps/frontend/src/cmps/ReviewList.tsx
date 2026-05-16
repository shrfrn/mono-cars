import { Link } from 'react-router-dom'
import type { AggregatedReview } from '@cars/shared'
import { checkPermission } from '@cars/shared/src/abac'
import { authService } from '#services/auth/index.ts'

export type ReviewListProps = {
    reviews: AggregatedReview[],
    onRemoveReview: (reviewId: string) => void,
}

export function ReviewList({ reviews, onRemoveReview }: ReviewListProps) {
	function canRemoveReview(review) {
		return checkPermission({
			action: 'review:delete',
			subject: authService.getLoggedInUser(),
			resource: review,
		})
	}

    if (!reviews) return <h1>Review List</h1>

    return <section className="review-list">
        <ul>
            {reviews.map(review => <li key={review._id}>
                <pre>{JSON.stringify(review, null, 4)}</pre>

                <div className="actions">
                    {/* <Link to={`${review._id}`}>Details</Link>
                    <Link to={`edit/${review._id}`}>Edit</Link> */}
                    {canRemoveReview(review) && <button onClick={() => onRemoveReview(review._id)}>x</button>}
                </div>
            </li>)}
        </ul>
    </section>
}