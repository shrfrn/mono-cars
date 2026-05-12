import { Link } from 'react-router-dom'
import type { Review } from '@cars/shared'

export type ReviewListProps = {
    reviews: Review[],
    onRemoveReview: (reviewId: string) => void,
}

export function ReviewList({ reviews, onRemoveReview }: ReviewListProps) {
    if (!reviews) return <h1>Review List</h1>

    return <section className="review-list">
        <ul>
            {reviews.map(review => <li key={review._id}>
                <pre>{JSON.stringify(review, null, 4)}</pre>

                <div className="actions">
                    {/* <Link to={`${review._id}`}>Details</Link>
                    <Link to={`edit/${review._id}`}>Edit</Link> */}
                    <button onClick={() => onRemoveReview(review._id)}>x</button>
                </div>
            </li>)}
        </ul>
    </section>
}