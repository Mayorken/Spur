from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db import get_db
from app.models.waitlist import Waitlist

router = APIRouter(prefix="/api/v1/waitlist", tags=["waitlist"])


class WaitlistRequest(BaseModel):
    email: EmailStr
    metro: str = None
    newsletter: bool = True


class WaitlistResponse(BaseModel):
    id: str
    email: str
    created_at: str
    confirmed: bool
    metro: str = None

    class Config:
        from_attributes = True


@router.post("/join", response_model=dict, status_code=status.HTTP_201_CREATED)
async def join_waitlist(
    request: WaitlistRequest,
    db: Session = Depends(get_db)
):
    """
    Join the SPUR waitlist
    """
    # Check if email already exists
    existing = db.query(Waitlist).filter(Waitlist.email == request.email).first()
    if existing:
        return {
            "status": "already_exists",
            "message": "You're already on the waitlist!",
            "email": request.email
        }

    # Create new waitlist entry
    waitlist_entry = Waitlist(
        email=request.email,
        metro=request.metro,
        newsletter=request.newsletter
    )

    db.add(waitlist_entry)
    db.commit()
    db.refresh(waitlist_entry)

    return {
        "status": "success",
        "message": "Successfully joined the waitlist!",
        "email": request.email,
        "position": db.query(Waitlist).count()  # Total on waitlist
    }


@router.get("/status/{email}", response_model=dict)
async def check_status(email: str, db: Session = Depends(get_db)):
    """
    Check if an email is on the waitlist
    """
    entry = db.query(Waitlist).filter(Waitlist.email == email).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found on waitlist"
        )

    # Get position (count of entries created before this one)
    position = db.query(Waitlist).filter(
        Waitlist.created_at <= entry.created_at
    ).count()

    return {
        "email": entry.email,
        "position": position,
        "confirmed": entry.confirmed,
        "joined_at": entry.created_at.isoformat()
    }


@router.get("/count")
async def get_waitlist_count(db: Session = Depends(get_db)):
    """
    Get total waitlist count
    """
    count = db.query(Waitlist).count()
    confirmed_count = db.query(Waitlist).filter(Waitlist.confirmed == True).count()

    return {
        "total": count,
        "confirmed": confirmed_count,
        "unconfirmed": count - confirmed_count
    }
