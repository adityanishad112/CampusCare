from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.complaint import Complaint
from app.models.duplicate_link import DuplicateLink
from app.models.user import User

def compute_location_similarity(loc1: str, loc2: str) -> float:
    if not loc1 or not loc2:
        return 0.0
    l1 = set(loc1.lower().replace(",", " ").split())
    l2 = set(loc2.lower().replace(",", " ").split())
    if not l1 or not l2:
        return 0.0
    intersection = l1.intersection(l2)
    union = l1.union(l2)
    return len(intersection) / len(union)

def find_potential_duplicates(
    target_title: str,
    target_description: str,
    target_location: str,
    db: Session,
    exclude_complaint_id: Optional[int] = None,
    threshold: float = 0.45
) -> List[Dict[str, Any]]:
    # Query active/recent complaints (exclude closed complaints older than 30 days)
    query = db.query(Complaint).filter(Complaint.status.in_(["Submitted", "Assigned", "In Progress", "Reopened", "Resolved"]))
    if exclude_complaint_id:
        query = query.filter(Complaint.id != exclude_complaint_id)
        
    candidates = query.order_by(Complaint.created_at.desc()).limit(100).all()
    if not candidates:
        return []

    target_text = f"{target_title} {target_description}"
    candidate_texts = [f"{c.title} {c.description}" for c in candidates]
    all_texts = [target_text] + candidate_texts

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        text_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    except Exception:
        # If vocabulary is empty or single word
        return []

    duplicates = []
    for idx, candidate in enumerate(candidates):
        text_sim = float(text_sims[idx])
        loc_sim = compute_location_similarity(target_location, candidate.location)
        # Combined score: 75% text similarity + 25% location overlap
        combined_score = round((text_sim * 0.75) + (loc_sim * 0.25), 3)

        if combined_score >= threshold or (text_sim >= 0.55):
            duplicates.append({
                "complaint_id": candidate.id,
                "tracking_number": candidate.tracking_number,
                "title": candidate.title,
                "category": candidate.category,
                "location": candidate.location,
                "status": candidate.status,
                "similarity_score": combined_score,
                "created_at": candidate.created_at.strftime("%Y-%m-%d %H:%M")
            })

    duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return duplicates[:5]  # Top 5 most relevant

def link_duplicate_complaints(
    primary_id: int,
    duplicate_id: int,
    actor: User,
    db: Session,
    notes: Optional[str] = None
) -> DuplicateLink:
    # Verify records exist
    primary = db.query(Complaint).filter(Complaint.id == primary_id).first()
    dup = db.query(Complaint).filter(Complaint.id == duplicate_id).first()
    if not primary or not dup:
        raise ValueError("One or both complaints not found")

    # Check if link already exists
    existing = db.query(DuplicateLink).filter(
        DuplicateLink.primary_complaint_id == primary_id,
        DuplicateLink.duplicate_complaint_id == duplicate_id
    ).first()
    if existing:
        return existing

    link = DuplicateLink(
        primary_complaint_id=primary_id,
        duplicate_complaint_id=duplicate_id,
        similarity_score=None,
        notes=notes,
        linked_by_id=actor.id
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link
